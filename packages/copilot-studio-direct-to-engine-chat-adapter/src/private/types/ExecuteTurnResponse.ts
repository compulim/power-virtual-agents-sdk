/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import { type Output, parse } from 'valibot';

import { ResponseBaseSchema } from './ResponseBase';

export const ExecuteTurnResponseSchema = ResponseBaseSchema;

/**
 * Response to a request to execute or continue a turn.
 */
export interface ExecuteTurnResponse extends Output<typeof ExecuteTurnResponseSchema> {}

export const parseExecuteTurnResponse = (data: unknown) => parse(ResponseBaseSchema, data);
