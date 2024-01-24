/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import { type Activity } from 'botframework-directlinejs';
import { iterateWithReturnValue } from 'iterate-with-return-value/async';
import {
  DeferredObservable,
  DeferredPromise,
  Observable,
  shareObservable
} from 'powerva-turn-based-chat-adapter-framework';
import { v4 } from 'uuid';

import type createHalfDuplexChatAdapter from './createHalfDuplexChatAdapter';
import { type ActivityId, type DirectLineJSBotConnection } from './types/DirectLineJSBotConnection';

export default function toDirectLineJS(
  startConversation: ReturnType<typeof createHalfDuplexChatAdapter>
): DirectLineJSBotConnection {
  let postActivityDeferred = new DeferredPromise<readonly [Activity, (id: ActivityId) => void]>();

  const activityDeferredObservable = new DeferredObservable<Activity>(observer => {
    connectionStatusDeferredObservable.next(0);
    connectionStatusDeferredObservable.next(1);

    let firstActivityReceived = false;

    (async function () {
      let [activities, getReturnValue] = iterateWithReturnValue(startConversation());

      for (;;) {
        for await (const activity of activities) {
          firstActivityReceived || connectionStatusDeferredObservable.next(2);

          firstActivityReceived = true;

          // TODO: Find out why replyToId is pointing to nowhere.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { replyToId: _, ...patchedActivity } = activity as any;

          console.log({ activity, patchedActivity });

          observer.next(patchedActivity);
        }

        const executeTurn = getReturnValue();
        const [activity, callback] = await postActivityDeferred.promise;
        const activityId = v4() as ActivityId;

        [activities, getReturnValue] = iterateWithReturnValue(executeTurn(activity));

        callback(activityId);

        observer.next({ ...activity, id: activityId, timestamp: new Date().toISOString() });
      }
    })();
  });

  const connectionStatusDeferredObservable = new DeferredObservable<number>();

  return {
    activity$: shareObservable(activityDeferredObservable.observable),
    connectionStatus$: shareObservable(connectionStatusDeferredObservable.observable),
    end() {
      throw new Error('Not implemented.');
    },
    postActivity(activity: Activity) {
      return new Observable<ActivityId>(observer => {
        postActivityDeferred.resolve(Object.freeze([activity, id => observer.next(id)]));
        postActivityDeferred = new DeferredPromise();
      });
    }
  };
}
