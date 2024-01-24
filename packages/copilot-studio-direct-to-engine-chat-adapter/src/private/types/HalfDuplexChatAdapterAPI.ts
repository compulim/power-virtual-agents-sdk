/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import { type Activity } from 'botframework-directlinejs';
import { ConversationId } from './ConversationId';

export interface HalfDuplexChatAdapterAPI {
  get conversationId(): ConversationId | undefined;

  startNewConversation(emitStartConversationEvent: boolean): Promise<AsyncIterableIterator<Activity>>;
  executeTurn(activity: Activity): Promise<AsyncIterableIterator<Activity>>;
}
