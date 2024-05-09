/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import { type Activity } from 'botframework-directlinejs';
import { EventSourceParserStream, type ParsedEvent } from 'eventsource-parser/stream';
import pRetry from 'p-retry';
import { type TelemetryClient } from 'powerva-turn-based-chat-adapter-framework';

import { type Transport } from '../types/Transport';
import iterateReadableStream from './iterateReadableStream';
import { resolveURLWithQueryAndHash } from './private/resolveURLWithQueryAndHash';
import { parseBotResponse, type BotResponse } from './types/BotResponse';
import { type ConversationId } from './types/ConversationId';
import { type HalfDuplexChatAdapterAPI } from './types/HalfDuplexChatAdapterAPI';
import { type HalfDuplexChatAdapterAPIStrategy } from './types/HalfDuplexChatAdapterAPIStrategy';

type RetryInit = Readonly<{
  factor?: number | undefined;
  minTimeout?: number | undefined;
  maxTimeout?: number | undefined;
  randomize?: boolean | undefined;
  retries?: number | undefined;
}>;

type Init = {
  retry?: RetryInit | undefined;
  telemetry?: MinimalTelemetryClient;
};

type MinimalTelemetryClient = Pick<TelemetryClient, 'trackException'>;

const DEFAULT_RETRY_COUNT = 4; // Will call 5 times.
const MAX_CONTINUE_TURN = 999;

export default class DirectToEngineServerSentEventsChatAdapterAPI implements HalfDuplexChatAdapterAPI {
  // NOTES: This class must work over RPC and cross-domain:
  //        - If need to extends this class, only add async methods (which return Promise)
  //        - Do not add any non-async methods or properties
  //        - Do not pass any arguments that is not able to be cloned by the Structured Clone Algorithm
  //        - After modifying this class, always test with a C1-hosted PVA Anywhere Bot
  constructor(strategy: HalfDuplexChatAdapterAPIStrategy, init?: Init) {
    this.#retry = {
      factor: init?.retry?.factor,
      maxTimeout: init?.retry?.maxTimeout,
      minTimeout: init?.retry?.minTimeout,
      randomize: init?.retry?.randomize,
      retries: init?.retry?.retries || DEFAULT_RETRY_COUNT
    };

    this.#strategy = strategy;
    this.#telemetry = init?.telemetry;
  }

  #conversationId: ConversationId | undefined = undefined;
  #retry: RetryInit & { retries: number };
  #strategy: HalfDuplexChatAdapterAPIStrategy;
  #telemetry: MinimalTelemetryClient | undefined;

  get conversationId(): ConversationId | undefined {
    return this.#conversationId;
  }

  public startNewConversation(emitStartConversationEvent: boolean): AsyncIterableIterator<Activity> {
    return async function* (this: DirectToEngineServerSentEventsChatAdapterAPI) {
      const { baseURL, body, headers, transport } = await this.#strategy.prepareStartNewConversation();

      yield* this.#post(baseURL, { body, headers, initialBody: { emitStartConversationEvent }, transport });
    }.call(this);
  }

  public executeTurn(activity: Activity): AsyncIterableIterator<Activity> {
    return async function* (this: DirectToEngineServerSentEventsChatAdapterAPI) {
      if (!this.#conversationId) {
        throw new Error(`startNewConversation() must be called before executeTurn().`);
      }

      const { baseURL, body, headers, transport } = await this.#strategy.prepareExecuteTurn();

      yield* this.#post(baseURL, { body, headers, initialBody: { activity }, transport });
    }.call(this);
  }

  #post(
    baseURL: URL,
    {
      body,
      headers,
      initialBody,
      transport
    }: {
      body?: Record<string, unknown> | undefined;
      headers?: Headers | undefined;
      initialBody?: Record<string, unknown> | undefined;
      transport?: Transport | undefined;
    }
  ): AsyncIterableIterator<Activity> {
    if (transport === 'server sent events') {
      return this.#postWithServerSentEvents(baseURL, { body: { ...body, ...initialBody }, headers });
    }

    return this.#postWithREST(baseURL, { body, headers, initialBody });
  }

  #postWithREST(
    baseURL: URL,
    {
      body,
      headers,
      initialBody
    }: {
      body?: Record<string, unknown> | undefined;
      headers?: Headers | undefined;
      initialBody?: Record<string, unknown> | undefined;
    }
  ): AsyncIterableIterator<Activity> {
    return async function* (this: DirectToEngineServerSentEventsChatAdapterAPI) {
      let withInitialBody = true;

      for (let numTurn = 0; numTurn < MAX_CONTINUE_TURN; numTurn++) {
        let currentResponse: Response;

        const botResponsePromise = pRetry(
          async (): Promise<BotResponse> => {
            const url = resolveURLWithQueryAndHash(`conversations/${this.#conversationId || ''}`, baseURL);
            const requestHeaders = new Headers(headers);

            this.#conversationId && requestHeaders.set('x-ms-conversationid', this.#conversationId);
            requestHeaders.set('content-type', 'application/json');

            currentResponse = await fetch(url.toString(), {
              body: JSON.stringify(withInitialBody ? { ...body, ...initialBody } : body),
              headers: requestHeaders,
              method: 'POST'
            });

            if (!currentResponse.ok) {
              throw new Error(`Server returned ${currentResponse.status} while calling the service.`);
            }

            return parseBotResponse(await currentResponse.json());
          },
          {
            ...this.#retry,
            onFailedAttempt(error: unknown) {
              if (currentResponse?.status < 500) {
                throw error;
              }
            }
          }
        );

        const telemetry = this.#telemetry;

        telemetry &&
          botResponsePromise.catch((error: unknown) => {
            // TODO [hawo]: We should rework on this telemetry for a couple of reasons:
            //              1. We did not handle it, why call it "handledAt"?
            //              2. We should indicate this error is related to the protocol
            error instanceof Error &&
              telemetry.trackException(
                { error },
                {
                  handledAt: 'withRetries',
                  retryCount: this.#retry.retries + 1 + ''
                }
              );
          });

        const botResponse = await botResponsePromise;

        if (botResponse.conversationId) {
          this.#conversationId = botResponse.conversationId;
        }

        for await (const activity of botResponse.activities) {
          yield activity;
        }

        withInitialBody = false;

        if (botResponse.action !== 'continue') {
          break;
        }
      }
    }.call(this);
  }

  #postWithServerSentEvents(
    baseURL: URL,
    {
      body,
      headers
    }: {
      body?: Record<string, unknown> | undefined;
      headers?: Headers | undefined;
    }
  ): AsyncIterableIterator<Activity> {
    return async function* (this: DirectToEngineServerSentEventsChatAdapterAPI) {
      let currentResponse: Response;

      const responseBodyPromise = pRetry(
        async (): Promise<ReadableStream<Uint8Array>> => {
          const requestHeaders = new Headers(headers);

          this.#conversationId && requestHeaders.set('x-ms-conversationid', this.#conversationId);
          requestHeaders.set('accept', 'text/event-stream');
          requestHeaders.set('content-type', 'application/json');

          currentResponse = await fetch(
            resolveURLWithQueryAndHash(`conversations/${this.#conversationId || ''}`, baseURL),
            {
              body: JSON.stringify(body),
              headers: requestHeaders,
              method: 'POST'
            }
          );

          if (!currentResponse.ok) {
            throw new Error(`Server returned ${currentResponse.status} while calling the service.`);
          }

          const contentType = currentResponse.headers.get('content-type');

          if (!/^text\/event-stream(;|$)/.test(contentType || '')) {
            throw new Error(
              `Server did not respond with content type of "text/event-stream", instead, received "${contentType}".`
            );
          } else if (!currentResponse.body) {
            throw new Error(`Server did not respond with body.`);
          }

          return currentResponse.body;
        },
        {
          ...this.#retry,
          onFailedAttempt(error: unknown) {
            if (currentResponse?.status < 500) {
              throw error;
            }
          }
        }
      );

      const telemetry = this.#telemetry;

      telemetry &&
        responseBodyPromise.catch((error: unknown) => {
          // TODO [hawo]: We should rework on this telemetry for a couple of reasons:
          //              1. We did not handle it, why call it "handledAt"?
          //              2. We should indicate this error is related to the protocol
          error instanceof Error &&
            telemetry.trackException(
              { error },
              {
                handledAt: 'withRetries',
                retryCount: this.#retry.retries + 1 + ''
              }
            );
        });

      const readableStream = (await responseBodyPromise)
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new EventSourceParserStream())
        .pipeThrough(
          new TransformStream<ParsedEvent, Activity>({
            transform: ({ data, event }, controller) => {
              if (event === 'end') {
                controller.terminate();
              } else if (event === 'activity') {
                const activity = JSON.parse(data);

                if (!this.#conversationId) {
                  this.#conversationId = activity.conversation.id;
                }

                controller.enqueue(activity);
              }
            }
          })
        );

      for await (const activity of iterateReadableStream(readableStream)) {
        yield activity;
      }
    }.call(this);
  }
}