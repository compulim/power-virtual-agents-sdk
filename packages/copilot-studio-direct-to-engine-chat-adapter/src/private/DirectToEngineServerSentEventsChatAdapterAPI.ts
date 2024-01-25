/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import { type Activity } from 'botframework-directlinejs';
import { EventSourceParserStream, type ParsedEvent } from 'eventsource-parser/stream';
import pRetry from 'p-retry';
import { type TelemetryClient } from 'powerva-turn-based-chat-adapter-framework';
import { type JsonObject } from 'type-fest';

import combineAsyncIterables from './combineAsyncIterables';
import iterableToAsyncIterable from './iterableToAsyncIterable';
import iterateReadableStream from './iterateReadableStream';
import { type ConversationId } from './types/ConversationId';
import { parseExecuteTurnResponse } from './types/ExecuteTurnResponse';
import { type HalfDuplexChatAdapterAPI } from './types/HalfDuplexChatAdapterAPI';
import { type HalfDuplexChatAdapterAPIStrategy } from './types/HalfDuplexChatAdapterAPIStrategy';
import {
  parseStartNewConversationResponseHead,
  parseStartNewConversationResponseRest
} from './types/StartNewConversationResponse';

type Init = { telemetry?: MinimalTelemetryClient };
type MinimalTelemetryClient = Pick<TelemetryClient, 'trackException'>;

const RETRY_COUNT = 4; // Will call 5 times.

function resolveURLWithQueryAndHash(relativeURL: string, baseURL: URL): URL {
  const url = new URL(relativeURL, baseURL);

  url.hash = baseURL.hash;
  url.search = baseURL.search;

  return url;
}

export default class DirectToEngineServerSentEventsChatAdapterAPI implements HalfDuplexChatAdapterAPI {
  // NOTES: This class must work over RPC and cross-domain:
  //        - If need to extends this class, only add async methods (which return Promise)
  //        - Do not add any non-async methods or properties
  //        - Do not pass any arguments that is not able to be cloned by the Structured Clone Algorithm
  //        - After modifying this class, always test with a C1-hosted PVA Anywhere Bot
  constructor(strategy: HalfDuplexChatAdapterAPIStrategy, init?: Init) {
    this.#strategy = strategy;
    this.#telemetry = init?.telemetry;
  }

  #conversationId: ConversationId | undefined = undefined;
  #strategy: HalfDuplexChatAdapterAPIStrategy;
  #telemetry: MinimalTelemetryClient | undefined;

  get conversationId(): ConversationId | undefined {
    return this.#conversationId;
  }

  public async startNewConversation(emitStartConversationEvent: boolean): Promise<AsyncIterableIterator<Activity>> {
    const { baseURL, body, headers } = await this.#strategy.prepareStartNewConversation();

    const response = await this.#postWithStream(resolveURLWithQueryAndHash('conversations', baseURL), {
      body: { ...body, emitStartConversationEvent },
      headers
    });

    const headReader = response.getReader();
    const head = await headReader.read();

    if (head.done) {
      return iterableToAsyncIterable([]);
    }

    const { activities, conversationId } = parseStartNewConversationResponseHead(head.value);

    this.#conversationId = conversationId;

    headReader.releaseLock();

    const restReadable = response.pipeThrough(
      new TransformStream<JsonObject, Activity>({
        transform(data, controller) {
          const { activities } = parseStartNewConversationResponseRest(data);

          activities.map(controller.enqueue.bind(controller));
        }
      })
    );

    return combineAsyncIterables<Activity>(
      iterableToAsyncIterable([iterableToAsyncIterable(activities), iterateReadableStream<Activity>(restReadable)])
    );
  }

  public async executeTurn(activity: Activity): Promise<AsyncIterableIterator<Activity>> {
    if (!this.#conversationId) {
      throw new Error(`startNewConversation() must be called before executeTurn().`);
    }

    const { baseURL, body, headers } = await this.#strategy.prepareExecuteTurn();

    const response = await this.#postWithStream(
      resolveURLWithQueryAndHash(`conversations/${this.#conversationId}`, baseURL),
      {
        body: { ...body, activity },
        headers: { ...headers, 'x-ms-conversationid': this.#conversationId }
      }
    );

    return iterateReadableStream<Activity>(
      response.pipeThrough(
        new TransformStream<JsonObject, Activity>({
          transform(data, controller) {
            const { activities } = parseExecuteTurnResponse(data);

            activities.map(controller.enqueue.bind(controller));
          }
        })
      )
    );
  }

  async #postWithStream(
    url: URL,
    { body, headers, signal }: { body?: Record<string, unknown>; headers?: HeadersInit; signal?: AbortSignal }
  ): Promise<ReadableStream<JsonObject>> {
    let currentResponse: Response;

    const responseBodyPromise = pRetry(
      async (): Promise<ReadableStream<Uint8Array>> => {
        currentResponse = await fetch(url.toString(), {
          method: 'POST',
          body: JSON.stringify(body),
          headers: { ...headers, accept: 'text/event-stream', 'content-type': 'application/json' },
          signal
        });

        if (!currentResponse.ok) {
          throw new Error(`Server returned ${currentResponse.status} while calling the service.`);
        }

        const contentType = currentResponse.headers.get('content-type');

        if (contentType !== 'text/event-stream') {
          throw new Error(
            `Server did not respond with content type of "text/event-stream", instead, received "${contentType}".`
          );
        } else if (!currentResponse.body) {
          throw new Error(`Server did not respond with body.`);
        }

        return currentResponse.body;
      },
      {
        onFailedAttempt: (error: unknown) => {
          if (currentResponse && currentResponse.status < 500) {
            throw error;
          }
        },
        retries: RETRY_COUNT,
        signal
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
              retryCount: RETRY_COUNT + 1 + ''
            }
          );
      });

    const responseBody = await responseBodyPromise;

    return responseBody
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new EventSourceParserStream())
      .pipeThrough(
        new TransformStream<ParsedEvent, JsonObject>({
          transform({ data }, controller) {
            if (data === 'DONE') {
              controller.terminate();
            } else {
              controller.enqueue(JSON.parse(data));
            }
          }
        })
      );
  }
}
