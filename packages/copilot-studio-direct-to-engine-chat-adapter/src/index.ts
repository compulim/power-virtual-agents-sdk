import EmbeddedAuthoringBotStrategy, { type EmbeddedAuthoringBotStrategyInit } from './EmbeddedAuthoringBotStrategy';
import PrebuiltBotStrategy, { type PrebuiltBotStrategyInit } from './PrebuiltBotStrategy';
import PublishedBotStrategy, { type PublishedBotStrategyInit } from './PublishedBotStrategy';
import TestCanvasBotStrategy, { type TestCanvasBotStrategyInit } from './TestCanvasBotStrategy';
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
import { type Telemetry } from './types/Telemetry';
import { type Transport } from './types/Transport';

declare global {
  const env: { npm_package_version: string };
}

export {
  createHalfDuplexChatAdapter,
  EmbeddedAuthoringBotStrategy,
  PrebuiltBotStrategy,
  PublishedBotStrategy,
  TestCanvasBotStrategy,
  toDirectLineJS
};

export type {
  Activity,
  Attachment,
  CreateHalfDuplexChatAdapterInit,
  DirectLineJSBotConnection,
  EmbeddedAuthoringBotStrategyInit,
  ExecuteTurnFunction,
  PrebuiltBotStrategyInit,
  PublishedBotStrategyInit,
  Strategy,
  StrategyRequestInit,
  Telemetry,
  TestCanvasBotStrategyInit,
  Transport,
  TurnGenerator
};
