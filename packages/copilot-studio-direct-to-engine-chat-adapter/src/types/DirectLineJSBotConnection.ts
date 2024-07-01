import { type ConnectionStatus } from 'botframework-directlinejs';
import { type Observable } from 'iter-fest';
import { type Tagged } from 'type-fest';

import { type Activity } from '../types/Activity';

export type ActivityId = Tagged<string, 'ActivityId'>;

export type DirectLineJSBotConnection = {
  activity$: Observable<Activity>;
  connectionStatus$: Observable<ConnectionStatus>;
  end(): void;
  postActivity(activity: Activity): Observable<ActivityId>;
};
