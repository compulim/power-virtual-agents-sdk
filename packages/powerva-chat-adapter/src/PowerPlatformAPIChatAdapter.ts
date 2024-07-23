/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import pRetry from 'p-retry';
import { ExecuteTurnContinuationAction, type TelemetryClient } from 'powerva-turn-based-chat-adapter-framework';

import type { Activity } from 'botframework-directlinejs';
import type { TurnBasedChatAdapterAPI } from './types/TurnBasedChatAdapterAPI';
import type { TurnBasedChatAdapterAPIStrategy } from './types/TurnBasedChatAdapterAPIStrategy';
import type { ExecuteTurnResponse } from './types/private/ExecuteTurnResponse';
import type { StartResponse } from './types/private/StartResponse';

type Init = { telemetry?: LimitedTelemetryClient };
type LimitedTelemetryClient = Pick<TelemetryClient, 'trackException'>;

const RETRY_COUNT = 4; // Will call 5 times.

/**
 * Allows case-insensitive `ExecuteTurnContinuationAction`.
 *
 * @todo 2023-04-18 [hawo]: Currently, engine returns `"continue"` (camel casing) instead of `"Continue"` (Pascal casing).
 *                          Once this is locked (say, GA), we should update `ExecuteTurnContinuationAction` and remove this function.
 * @todo 2023-07-17 [hawo]: Engine returns lowercase.
 */
function patchContinuationActionEnum(action: ExecuteTurnContinuationAction): ExecuteTurnContinuationAction {
  const actionString = action as string;

  return actionString === 'continue' || actionString === 'Continue'
    ? ExecuteTurnContinuationAction.Continue
    : ExecuteTurnContinuationAction.Waiting;
}

function resolveURLWithQueryAndHash(relativeURL: string, baseURL: URL): URL {
  const url = new URL(relativeURL, baseURL);

  url.hash = baseURL.hash;
  url.search = baseURL.search;

  return url;
}

export default class PowerPlatformAPIChatAdapter implements TurnBasedChatAdapterAPI {
  // NOTES: This class must work over RPC and cross-domain:
  //        - If need to extends this class, only add async methods (which return Promise)
  //        - Do not add any non-async methods or properties
  //        - Do not pass any arguments that is not able to be cloned by the Structured Clone Algorithm
  //        - After modifying this class, always test with a C1-hosted PVA Anywhere Bot
  constructor(strategy: TurnBasedChatAdapterAPIStrategy, init?: Init) {
    this.#strategy = strategy;
    this.#telemetry = init?.telemetry;
  }

  #strategy: TurnBasedChatAdapterAPIStrategy;
  #telemetry: LimitedTelemetryClient | undefined;

  public async startNewConversation(
    emitStartConversationEvent: boolean,
    {
      correlationId,
      locale,
      signal
    }: { correlationId?: string | undefined; locale?: string | undefined; signal?: AbortSignal | undefined }
  ): Promise<StartResponse> {
    const { baseURL, body, headers } = await this.#strategy.prepareStartNewConversation();

    const response = await this.post<StartResponse>(resolveURLWithQueryAndHash('conversations', baseURL), {
      body: { ...body, emitStartConversationEvent, ...(locale ? { locale } : {}) },
      headers: { ...headers, ...(correlationId && { 'x-ms-correlationid': correlationId }) },
      signal
    });

    response.action = patchContinuationActionEnum(response.action);

    return response;
  }

  public async executeTurn(
    conversationId: string,
    activity: Activity,
    { correlationId, signal }: { correlationId?: string | undefined; signal?: AbortSignal | undefined }
  ): Promise<ExecuteTurnResponse> {
    const { baseURL, body, headers } = await this.#strategy.prepareExecuteTurn();

    const response = await this.post<ExecuteTurnResponse>(
      resolveURLWithQueryAndHash(`conversations/${conversationId}`, baseURL),
      {
        body: { ...body, activity },
        headers: {
          ...headers,
          'x-ms-conversationid': conversationId,
          ...(correlationId && { 'x-ms-correlationid': correlationId })
        },
        signal
      }
    );

    response.action = patchContinuationActionEnum(response.action);

    return response;
  }

  public async continueTurn(
    conversationId: string,
    { correlationId, signal }: { correlationId?: string | undefined; signal?: AbortSignal | undefined }
  ): Promise<ExecuteTurnResponse> {
    const { baseURL, body, headers } = await this.#strategy.prepareContinueTurn();

    const response = await this.post<ExecuteTurnResponse>(
      resolveURLWithQueryAndHash(`conversations/${conversationId}/continue`, baseURL),
      {
        body,
        headers: {
          ...headers,
          'x-ms-conversationid': conversationId,
          ...(correlationId && { 'x-ms-correlationid': correlationId })
        },
        signal
      }
    );

    response.action = patchContinuationActionEnum(response.action);

    return response;
  }

  private async post<TResponse>(
    url: URL,
    { body, headers, signal }: { body?: Record<string, unknown>; headers?: HeadersInit; signal?: AbortSignal }
  ): Promise<TResponse> {
    let currentResponse: Response;

    const responsePromise = pRetry(
      async () => {
        currentResponse = await fetch(url.toString(), {
          method: 'POST',
          body: JSON.stringify(body),
          headers: { ...headers, 'Content-Type': 'application/json' },
          signal
        });

        if (!currentResponse.ok) {
          throw new Error(`Server returned ${currentResponse.status} while calling the service.`);
        }

        return currentResponse;
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
      responsePromise.catch((error: unknown) => {
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

    const response = await responsePromise;

    return response.json() as unknown as TResponse;
  }
}
