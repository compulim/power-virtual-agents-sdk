import { type Activity } from '../../types/Activity';

export type StartNewConversationInit = {
  emitStartConversationEvent: boolean;
  locale?: string | undefined;
};

export interface HalfDuplexChatAdapterAPI {
  startNewConversation(init: StartNewConversationInit): AsyncIterableIterator<Activity>;
  executeTurn(activity: Activity): AsyncIterableIterator<Activity>;
}
