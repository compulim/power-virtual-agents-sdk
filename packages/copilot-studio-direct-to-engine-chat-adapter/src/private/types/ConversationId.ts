/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import { type Tagged } from 'type-fest';
import { parse, string, type Output, type StringSchema } from 'valibot';

export type ConversationId = Output<typeof ConversationIdSchema>;

export const ConversationIdSchema = string() as StringSchema<Tagged<string, 'ConversationId'>>;

export const parseConversationId = (conversationId: string): ConversationId =>
  parse(ConversationIdSchema, conversationId);
