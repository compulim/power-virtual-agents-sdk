/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import { type Activity, type ConnectionStatus } from 'botframework-directlinejs';
import { type Observable } from 'powerva-turn-based-chat-adapter-framework';
import { type Tagged } from 'type-fest';

export type ActivityId = Tagged<string, 'ActivityId'>;

export type DirectLineJSBotConnection = {
  activity$: Observable<Activity>;
  close(): void;
  connectionStatus$: Observable<ConnectionStatus>;
  postActivity(activity: Activity): Observable<ActivityId>;
};
