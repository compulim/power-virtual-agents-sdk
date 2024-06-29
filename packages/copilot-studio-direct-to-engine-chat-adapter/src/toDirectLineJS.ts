import { encode as base64Encode } from 'base64-arraybuffer';
import { onErrorResumeNext } from 'on-error-resume-next';
import {
  DeferredObservable,
  DeferredPromise,
  Observable,
  shareObservable
} from 'powerva-turn-based-chat-adapter-framework';
import { v4 } from 'uuid';

import { asyncGeneratorWithLastValue } from 'iter-fest';
import type { TurnGenerator } from './createHalfDuplexChatAdapter';
import { type Activity } from './types/Activity';
import { type Attachment } from './types/Attachment';
import { type ActivityId, type DirectLineJSBotConnection } from './types/DirectLineJSBotConnection';

function once(fn: () => Promise<void>): () => Promise<void>;
function once(fn: () => void): () => void;

function once(fn: () => Promise<void> | void): () => Promise<void> | void {
  let called = false;

  return () => {
    if (!called) {
      called = true;

      return fn();
    }
  };
}

export default function toDirectLineJS(halfDuplexChatAdapter: TurnGenerator): DirectLineJSBotConnection {
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
    (async function () {
      connectionStatusDeferredObservable.next(0);
      connectionStatusDeferredObservable.next(1);

      let turnGenerator: TurnGenerator = halfDuplexChatAdapter;
      let handleAcknowledgementOnce: () => Promise<void> | void = once(async () => {
        connectionStatusDeferredObservable.next(2);
        await 0; // HACK: Web Chat need a spare cycle between connectionStatus$ change and activity$ subscription.
      });

      try {
        for (;;) {
          const iterator = asyncGeneratorWithLastValue(turnGenerator);

          for await (const activity of iterator) {
            await handleAcknowledgementOnce();

            observer.next(patchActivity(activity));
          }

          // If no activities received from bot, we should still acknowledge.
          await handleAcknowledgementOnce();

          const executeTurn = iterator.lastValue();
          const [activity, callback] = await postActivityDeferred.promise;

          postActivityDeferred = new DeferredPromise();

          // Patch `activity.attachments[].contentUrl` into Data URI if it was Blob URL.
          if (activity.type === 'message' && activity.attachments) {
            activity.attachments = await Promise.all(
              activity.attachments.map(async (attachment: Attachment) => {
                if ('contentUrl' in attachment) {
                  const { contentUrl } = attachment;

                  // Ignore malformed URL.
                  if (onErrorResumeNext(() => new URL(contentUrl).protocol) === 'blob:') {
                    // Only allow fetching blob URLs.
                    const res = await fetch(contentUrl);

                    if (!res.ok) {
                      throw new Error('Failed to fetch attachment of blob URL.');
                    }

                    // FileReader.readAsDataURL() is not available in Node.js.
                    return Object.freeze({
                      ...attachment,
                      contentUrl: `data:;base64,${base64Encode(await res.arrayBuffer())}`
                    });
                  }
                }

                return attachment;
              })
            );
          }

          turnGenerator = executeTurn(activity);

          // We will generate the activity ID and echoback the activity only when the first incoming activity arrived.
          // This make sure the bot acknowledged the outgoing activity before we echoback the activity.
          handleAcknowledgementOnce = once(() => {
            const activityId = v4() as ActivityId;

            observer.next(patchActivity({ ...activity, id: activityId }));
            callback(activityId);
          });
        }
      } catch (error) {
        console.error('Failed to communicate with the chat adapter.', error);

        connectionStatusDeferredObservable.next(4);
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
        new Observable<ActivityId>(observer =>
          postActivityDeferred.resolve(Object.freeze([activity, id => observer.next(id)]))
        )
      )
  };
}
