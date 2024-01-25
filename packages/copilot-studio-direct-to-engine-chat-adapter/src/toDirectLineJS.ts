/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import { type Activity } from 'botframework-directlinejs';
import {
  DeferredObservable,
  DeferredPromise,
  Observable,
  shareObservable
} from 'powerva-turn-based-chat-adapter-framework';
import { v4 } from 'uuid';

import type createHalfDuplexChatAdapter from './createHalfDuplexChatAdapter';
import iterateWithReturnValue from './private/iterateWithReturnValueAsync';
import { type ActivityId, type DirectLineJSBotConnection } from './types/DirectLineJSBotConnection';

export default function toDirectLineJS(
  startConversation: ReturnType<typeof createHalfDuplexChatAdapter>
): DirectLineJSBotConnection {
  let nextSequenceId = 0;
  let postActivityDeferred = new DeferredPromise<readonly [Activity, (id: ActivityId) => void]>();

  // TODO: Find out why replyToId is pointing to nowhere.
  // TODO: Can the service add "timestamp" field?
  // TODO: Can the service echo back the activity?
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const patchActivity = ({ replyToId: _, ...activity }: Activity & { replyToId?: string }): Activity => ({
    ...activity,
    channelData: { ...activity.channelData, 'webchat:sequence-id': nextSequenceId++ },
    timestamp: new Date().toISOString()
  });

  const activityDeferredObservable = new DeferredObservable<Activity>(observer => {
    connectionStatusDeferredObservable.next(0);
    connectionStatusDeferredObservable.next(1);

    (async function () {
      const startConversationPromise = await startConversation();

      connectionStatusDeferredObservable.next(2);

      let [activities, getExecuteTurn] = iterateWithReturnValue(startConversationPromise);

      for (;;) {
        for await (const activity of activities) {
          observer.next(patchActivity(activity));
        }

        const executeTurn = getExecuteTurn();
        const [activity, callback] = await postActivityDeferred.promise;

        const activityId = v4() as ActivityId;
        const executeTurnActivities = await executeTurn(activity);

        observer.next(patchActivity({ ...activity, id: activityId }));
        callback(activityId);

        [activities, getExecuteTurn] = iterateWithReturnValue(executeTurnActivities);
      }
    })();
  });

  const connectionStatusDeferredObservable = new DeferredObservable<number>();

  return {
    activity$: shareObservable(activityDeferredObservable.observable),
    connectionStatus$: shareObservable(connectionStatusDeferredObservable.observable),
    end() {
      // Half-duplex connection does not requires implicit closing.
    },
    postActivity: (activity: Activity) =>
      shareObservable(
        new Observable<ActivityId>(observer => {
          postActivityDeferred.resolve(Object.freeze([activity, id => observer.next(id)]));
          postActivityDeferred = new DeferredPromise();
        })
      )
  };
}
