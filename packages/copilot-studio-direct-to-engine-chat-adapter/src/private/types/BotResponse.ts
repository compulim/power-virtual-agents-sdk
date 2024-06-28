import { type JsonObject } from 'type-fest';
import {
  any,
  array,
  object,
  optional,
  parse,
  string,
  transform,
  union,
  value,
  type AnySchema,
  type Output,
  type StringSchema
} from 'valibot';

import { type Activity } from '../../types/Activity';
import { type ConversationIdSchema } from './ConversationId';

export const BotResponseSchema = object({
  action: optional(
    union([
      string([value('continue')]) as StringSchema<'continue'>,
      transform<StringSchema<'Continue'>, 'continue'>(
        string([value('Continue')]) as StringSchema<'Continue'>,
        () => 'continue'
      ),
      string([value('waiting')]) as StringSchema<'waiting'>,
      transform<StringSchema<'Waiting'>, 'waiting'>(
        string([value('Waiting')]) as StringSchema<'Waiting'>,
        () => 'waiting'
      )
    ])
  ),
  activities: array(any() as AnySchema<Activity>),
  conversationId: optional(string() as typeof ConversationIdSchema)
});

/**
 * Response from the bot.
 */
export interface BotResponse extends Output<typeof BotResponseSchema> {
  action?: Output<typeof BotResponseSchema>['action'];

  /**
   * A list of activities which represent the response from the bot.
   */
  activities: Output<typeof BotResponseSchema>['activities'];

  /**
   * Conversation ID.
   */
  conversationId?: Output<typeof BotResponseSchema>['conversationId'];
}

export const parseBotResponse = (data: JsonObject): BotResponse => parse(BotResponseSchema, data);
