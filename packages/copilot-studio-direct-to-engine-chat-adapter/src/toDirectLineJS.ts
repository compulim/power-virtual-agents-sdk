import { type Activity } from 'botframework-directlinejs';
import { iterateWithReturnValue } from 'iterate-with-return-value/async';
import {
  DeferredObservable,
  DeferredPromise,
  Observable,
  shareObservable
} from 'powerva-turn-based-chat-adapter-framework';
import { v4 } from 'uuid';

import createStartConversation from './private/createStartConversation';
import { type ActivityId, type DirectLineJSBotConnection } from './types/DirectLineJSBotConnection';

export default function toDirectLineJS(
  startConversation: ReturnType<typeof createStartConversation>
): DirectLineJSBotConnection {
  let postActivityDeferred = new DeferredPromise<readonly [Activity, (id: ActivityId) => void]>();

  const activityDeferredObservable = new DeferredObservable<Activity>(observer => {
    connectionStatusDeferredObservable.next(0);
    connectionStatusDeferredObservable.next(1);
    connectionStatusDeferredObservable.next(2);

    (async function () {
      let [activities, getReturnValue] = iterateWithReturnValue(startConversation());

      for (;;) {
        for await (const activity of activities) {
          observer.next(activity);
        }

        const executeTurn = getReturnValue();
        const [activity, callback] = await postActivityDeferred.promise;
        const activityId = v4() as ActivityId;

        [activities, getReturnValue] = iterateWithReturnValue(executeTurn(activity));

        callback(activityId);

        observer.next({ ...activity, id: activityId });
      }
    })();
  });

  const connectionStatusDeferredObservable = new DeferredObservable<number>();

  return {
    activity$: shareObservable(activityDeferredObservable.observable),
    close() {
      throw new Error('Not implemented.');
    },
    connectionStatus$: shareObservable(connectionStatusDeferredObservable.observable),
    postActivity(activity: Activity) {
      return new Observable<ActivityId>(observer => {
        postActivityDeferred.resolve(Object.freeze([activity, id => observer.next(id)]));
        postActivityDeferred = new DeferredPromise();
      });
    }
  };
}
