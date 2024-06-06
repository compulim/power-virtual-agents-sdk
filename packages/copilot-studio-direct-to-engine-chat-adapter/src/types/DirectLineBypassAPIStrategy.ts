/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import { Transport } from './Transport';

type RequestBody = unknown;

export type StrategyRequestInit = {
  baseURL: URL;
  body?: Record<string, unknown> | undefined;
  headers?: Headers | undefined;
  transport?: Transport | undefined;
};

export interface DirectLineBypassAPIStrategy {
  getHeaders(): Promise<HeadersInit>;
  getUrl(pathSuffix: string): Promise<URL>;

  onRequestBody(
    requestType: 'continueTurn' | 'executeTurn' | 'startNewConversation',
    body: Readonly<RequestBody>
  ): Readonly<RequestBody>;
  prepareExecuteTurn(): Promise<StrategyRequestInit>;
  prepareStartNewConversation(): Promise<StrategyRequestInit>;
}
