import {
  createHalfDuplexChatAdapter,
  EmbeddedAuthoringBotStrategy,
  PrebuiltBotStrategy,
  PublishedBotStrategy,
  TestCanvasBotStrategy,
  ThirdPartyPublishedBotStrategy,
  toDirectLineJS
} from './index';

declare global {
  interface Window {
    CopilotStudioDirectToEngineChatAdapter: {
      createHalfDuplexChatAdapter: typeof createHalfDuplexChatAdapter;
      EmbeddedAuthoringBotStrategy: typeof EmbeddedAuthoringBotStrategy;
      PrebuiltBotStrategy: typeof PrebuiltBotStrategy;
      PublishedBotStrategy: typeof PublishedBotStrategy;
      TestCanvasBotStrategy: typeof TestCanvasBotStrategy;
      ThirdPartyPublishedBotStrategy: typeof ThirdPartyPublishedBotStrategy;
      toDirectLineJS: typeof toDirectLineJS;
    };
  }
}

window.CopilotStudioDirectToEngineChatAdapter = {
  createHalfDuplexChatAdapter,
  EmbeddedAuthoringBotStrategy,
  PrebuiltBotStrategy,
  PublishedBotStrategy,
  TestCanvasBotStrategy,
  ThirdPartyPublishedBotStrategy,
  toDirectLineJS
};
