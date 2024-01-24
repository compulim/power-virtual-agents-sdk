// /*!
//  * Copyright (C) Microsoft Corporation. All rights reserved.
//  */

// import { type Activity } from 'botframework-directlinejs';
// import { any, array, object, parse, type AnySchema, type Output } from 'valibot';

// export const TurnResponseSchema = object({
//   activities: array(any() as AnySchema<Activity>)
// });

// /**
//  * Interface for responses from the bot.
//  */
// export interface TurnResponse extends Output<typeof TurnResponseSchema> {
//   /**
//    * A list of activities which represent the response from the bot.
//    */
//   activities: Output<typeof TurnResponseSchema>['activities'];
// }

// export const parseTurnResponse = (data: unknown): TurnResponse => parse(TurnResponseSchema, data);
