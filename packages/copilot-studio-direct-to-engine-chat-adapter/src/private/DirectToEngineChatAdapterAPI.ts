import { EventSourceParserStream, type ParsedEvent } from 'eventsource-parser/stream';
import { asyncGeneratorWithLastValue, readableStreamValues } from 'iter-fest';
import pRetry from 'p-retry';

import { type Activity } from '../types/Activity';
import { type Strategy } from '../types/Strategy';
import { type Telemetry } from '../types/Telemetry';
import { type Transport } from '../types/Transport';
import { resolveURLWithQueryAndHash } from './resolveURLWithQueryAndHash';
import { parseBotResponse } from './types/BotResponse';
import { parseConversationId, type ConversationId } from './types/ConversationId';
import { type HalfDuplexChatAdapterAPI, type StartNewConversationInit } from './types/HalfDuplexChatAdapterAPI';

export type DirectToEngineChatAdapterAPIInit = {
  retry?:
    | Readonly<{
        factor?: number | undefined;
        minTimeout?: number | undefined;
        maxTimeout?: number | undefined;
        randomize?: boolean | undefined;
        retries?: number | undefined;
      }>
    | undefined;
  telemetry?: Telemetry | undefined;
};

const DEFAULT_RETRY_COUNT = 4; // Will call 5 times.
const MAX_CONTINUE_TURN = 999;

export default class DirectToEngineChatAdapterAPI implements HalfDuplexChatAdapterAPI {
  // NOTES: This class must work over RPC and cross-domain:
  //        - If need to extends this class, only add async methods (which return Promise)
  //        - Do not add any non-async methods or properties
  //        - Do not pass any arguments that is not able to be cloned by the Structured Clone Algorithm
  //        - After modifying this class, always test with a C1-hosted PVA Anywhere Bot
  constructor(strategy: Strategy, init?: DirectToEngineChatAdapterAPIInit) {
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

  #busy: boolean = false;
  #conversationId: ConversationId | undefined = undefined;
  #retry: DirectToEngineChatAdapterAPIInit['retry'] & { retries: number };
  #strategy: Strategy;
  #telemetry: DirectToEngineChatAdapterAPIInit['telemetry'];

  public startNewConversation({
    emitStartConversationEvent,
    locale
  }: StartNewConversationInit): AsyncIterableIterator<Activity> {
    if (this.#busy) {
      const error = new Error('Another operation is in progress.');

      this.#telemetry?.trackException(error, { handledAt: 'DirectToEngineChatAdapterAPI.startNewConversation' });

      throw error;
    }

    this.#busy = true;

    return async function* (this: DirectToEngineChatAdapterAPI) {
      try {
        if (this.#conversationId) {
          const error = new Error('startNewConversation() cannot be called more than once.');

          this.#telemetry?.trackException(error, { handledAt: 'DirectToEngineChatAdapterAPI.startNewConversation' });

          throw error;
        }

        const { baseURL, body, headers, transport } = await this.#strategy.prepareStartNewConversation();

        yield* this.#post(baseURL, { body, headers, initialBody: { emitStartConversationEvent, locale }, transport });
      } finally {
        this.#busy = false;
      }
    }.call(this);
  }

  public executeTurn(activity: Activity): AsyncIterableIterator<Activity> {
    if (this.#busy) {
      const error = new Error('Another operation is in progress.');

      this.#telemetry?.trackException(error, { handledAt: 'DirectToEngineChatAdapterAPI.executeTurn' });

      throw error;
    }

    this.#busy = true;

    return async function* (this: DirectToEngineChatAdapterAPI) {
      try {
        if (!this.#conversationId) {
          const error = new Error(`startNewConversation() must be called before executeTurn().`);

          this.#telemetry?.trackException(error, { handledAt: 'DirectToEngineChatAdapterAPI.executeTurn' });

          throw error;
        }

        const { baseURL, body, headers, transport } = await this.#strategy.prepareExecuteTurn();

        yield* this.#post(baseURL, { body, headers, initialBody: { activity }, transport });
      } finally {
        this.#busy = false;
      }
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
    return async function* (this: DirectToEngineChatAdapterAPI) {
      const typingMap = new Map<string, string>();

      for (let numTurn = 0; numTurn < MAX_CONTINUE_TURN; numTurn++) {
        const isContinueTurn = !!numTurn;
        let currentResponse: Response;

        const activityGeneratorPromise = pRetry(
          async (): Promise<AsyncGenerator<Activity, 'continue' | 'end'>> => {
            const requestHeaders = new Headers(headers);

            this.#conversationId && requestHeaders.set('x-ms-conversationid', this.#conversationId);
            requestHeaders.set(
              'accept',
              transport === 'rest' ? 'application/json' : 'text/event-stream,application/json;q=0.9'
            );
            requestHeaders.set('content-type', 'application/json');
            requestHeaders.set(
              'x-ms-chat-adapter',
              new URLSearchParams([['version', process.env.npm_package_version]] satisfies string[][]).toString()
            );
            const correlationId = this.#telemetry?.correlationId;
            correlationId && requestHeaders.set('x-ms-correlationid', correlationId);

            currentResponse = await fetch(
              resolveURLWithQueryAndHash(baseURL, 'conversations', this.#conversationId, isContinueTurn && 'continue'),
              {
                body: JSON.stringify(isContinueTurn ? body : { ...body, ...initialBody }),
                headers: requestHeaders,
                method: 'POST'
              }
            );

            if (!currentResponse.ok) {
              const error = new Error(`Server returned ${currentResponse.status} while calling the service.`);

              this.#telemetry?.trackException(error, { handledAt: 'DirectToEngineChatAdapterAPI.#post' });

              throw error;
            }

            const contentType = currentResponse.headers.get('content-type');

            if (contentType === 'application/json') {
              const botResponse = parseBotResponse(await currentResponse.json());

              if (!this.#conversationId) {
                if (!botResponse.conversationId) {
                  const error = new Error('HTTP response from start new conversation must have "conversationId".');

                  this.#telemetry?.trackException(error, { handledAt: 'DirectToEngineChatAdapterAPI.#post' });

                  throw error;
                }

                this.#conversationId = botResponse.conversationId;
              }

              return (async function* (): AsyncGenerator<Activity, 'continue' | 'end'> {
                for (const activity of botResponse.activities) {
                  yield activity;
                }

                return botResponse.action === 'continue' ? botResponse.action : 'end';
              })();
            } else if (contentType === 'text/event-stream') {
              if (transport === 'rest') {
                const error = new Error(
                  'Protocol mismatch. Server returning Server-Sent Events while client requesting REST API.'
                );

                this.#telemetry?.trackException(error, { handledAt: 'DirectToEngineChatAdapterAPI.#post' });

                throw error;
              }

              const conversationId = currentResponse.headers.get('x-ms-conversationid');

              if (conversationId) {
                this.#conversationId = parseConversationId(conversationId);
              }

              const { body } = currentResponse;

              if (!body) {
                const error = new Error(`Server did not respond with body in event stream mode.`);

                this.#telemetry?.trackException(error, { handledAt: 'DirectToEngineChatAdapterAPI.#post' });

                throw error;
              }

              const readableStream = body
                .pipeThrough(new TextDecoderStream())
                .pipeThrough(new EventSourceParserStream())
                .pipeThrough(
                  new TransformStream<ParsedEvent, Activity>({
                    transform: ({ data, event }, controller) => {
                      if (event === 'end') {
                        controller.terminate();
                      } else if (event === 'activity') {
                        const activity = JSON.parse(data);

                        // TODO: Should be replaced by something in HTTP header or "init" event.
                        if (!this.#conversationId && activity.conversation?.id) {
                          this.#conversationId = activity.conversation.id;
                        }

                        // Specific to DtE SSE protocol, this will accumulate intermediate result by concatenating with previous result.
                        if (
                          activity.type === 'typing' &&
                          activity.text &&
                          activity.channelData?.streamType === 'streaming' &&
                          activity.channelData?.chunkType === 'delta'
                        ) {
                          const streamId = activity.channelData?.streamId || activity.id;
                          const accumulated = (typingMap.get(streamId) || '') + activity.text;

                          typingMap.set(streamId, accumulated);
                          activity.text = accumulated;
                        }

                        controller.enqueue(activity);
                      }
                    }
                  })
                );

              return (async function* () {
                for await (const activity of readableStreamValues(readableStream)) {
                  yield activity;
                }

                return 'end' as const;
              })();
            }

            const error = new Error(`Received unknown HTTP header "Content-Type: ${contentType}".`);

            this.#telemetry?.trackException(error, { handledAt: 'DirectToEngineChatAdapterAPI.#post' });

            throw error;
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
          activityGeneratorPromise.catch((error: unknown) => {
            // TODO [hawo]: We should rework on this telemetry for a couple of reasons:
            //              1. We did not handle it, why call it "handledAt"?
            //              2. We should indicate this error is related to the protocol
            error instanceof Error &&
              telemetry.trackException(error, {
                handledAt: 'DirectToEngineChatAdapterAPI.withRetries',
                retryCount: this.#retry.retries + 1 + ''
              });
          });

        const activities = asyncGeneratorWithLastValue(await activityGeneratorPromise);

        for await (const activity of activities) {
          yield activity;
        }

        if (activities.lastValue() === 'end') {
          break;
        }
      }
    }.call(this);
  }
}
