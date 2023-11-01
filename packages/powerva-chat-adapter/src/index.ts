/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

// TODO: [hawo] When PPUX support named exports, remove this file and reference in package.json.
//              We should only offer named exports.

import fromTurnBasedChatAdapterAPI from './fromTurnBasedChatAdapterAPI';
import PowerPlatformAPIChatAdapter from './PowerPlatformAPIChatAdapter';
import PrebuiltBotAPIStrategy from './PrebuiltBotAPIStrategy';
import PublishedBotAPIStrategy from './PublishedBotAPIStrategy';

import type { TurnBasedChatAdapterAPI } from './types/TurnBasedChatAdapterAPI';
import type { TurnBasedChatAdapterAPIStrategy } from './types/TurnBasedChatAdapterAPIStrategy';

// The exported members should match those in package.json.
export { fromTurnBasedChatAdapterAPI, PowerPlatformAPIChatAdapter, PrebuiltBotAPIStrategy, PublishedBotAPIStrategy };
export type { TurnBasedChatAdapterAPI, TurnBasedChatAdapterAPIStrategy };
