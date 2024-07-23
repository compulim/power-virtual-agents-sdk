/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import type { ConversationId } from './private/ConversationId';
import type { ContinueTurnResponse } from './private/ContinueTurnResponse';
import type { ExecuteTurnResponse } from './private/ExecuteTurnResponse';
import type { StartResponse } from './private/StartResponse';
import type { Activity } from 'botframework-directlinejs';

type Options = {
  correlationId?: string;
  signal?: AbortSignal;
};

export interface TurnBasedChatAdapterAPI {
  continueTurn(conversationId: ConversationId, options?: Options): Promise<ContinueTurnResponse>;
  executeTurn(conversationId: ConversationId, activity: Activity, options?: Options): Promise<ExecuteTurnResponse>;
  startNewConversation(emitStartConversationEvent: boolean, options?: Options): Promise<StartResponse>;
}

export interface TurnBasedChatAdapterOptions {
  emitStartConversationEvent?: boolean | undefined;
  locale?: string | undefined;
}
