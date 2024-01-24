/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import { type Activity } from 'botframework-directlinejs';
import { any, array, object, parse, type AnySchema, type Output } from 'valibot';

export const ResponseBaseSchema = object({
  activities: array(any() as AnySchema<Activity>)
});

/**
 * Base interface for responses from the bot.
 */
export interface ResponseBase extends Output<typeof ResponseBaseSchema> {
  /**
   * A list of activities which represent the response from the bot.
   */
  activities: Output<typeof ResponseBaseSchema>['activities'];
}

export const parseResponseBase = (data: unknown): ResponseBase => parse(ResponseBaseSchema, data);
