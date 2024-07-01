import PrebuiltBotStrategy from './PrebuiltBotStrategy';
import PublishedBotStrategy from './PublishedBotStrategy';
import TestCanvasBotStrategy from './TestCanvasBotStrategy';
import createHalfDuplexChatAdapter, {
  type CreateHalfDuplexChatAdapterInit,
  type ExecuteTurnFunction,
  type TurnGenerator
} from './createHalfDuplexChatAdapter';
import toDirectLineJS from './toDirectLineJS';
import { type Activity } from './types/Activity';
import { type Attachment } from './types/Attachment';
import { type DirectLineJSBotConnection } from './types/DirectLineJSBotConnection';
import { type Strategy, type StrategyRequestInit } from './types/Strategy';
import { type Transport } from './types/Transport';

declare global {
  const env: { npm_package_version: string | undefined };
}

export {
  PrebuiltBotStrategy,
  PublishedBotStrategy,
  TestCanvasBotStrategy,
  createHalfDuplexChatAdapter,
  toDirectLineJS
};

export type {
  Activity,
  Attachment,
  CreateHalfDuplexChatAdapterInit,
  DirectLineJSBotConnection,
  ExecuteTurnFunction,
  Strategy,
  StrategyRequestInit,
  Transport,
  TurnGenerator
};
