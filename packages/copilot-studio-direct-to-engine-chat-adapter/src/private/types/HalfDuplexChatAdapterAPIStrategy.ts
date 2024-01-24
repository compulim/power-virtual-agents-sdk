/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

type PartialRequestInit = {
  baseURL: URL;
  body?: Record<string, unknown>;
  headers?: HeadersInit;
};

export interface HalfDuplexChatAdapterAPIStrategy {
  prepareExecuteTurn(): Promise<PartialRequestInit>;
  prepareStartNewConversation(): Promise<PartialRequestInit>;
}
