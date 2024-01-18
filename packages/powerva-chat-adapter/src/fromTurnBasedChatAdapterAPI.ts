/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import {
  type ChatAdapter,
  DeferredPromise,
  ExecuteTurnContinuationAction,
  TurnBasedChatAdapter
} from 'powerva-turn-based-chat-adapter-framework';
import { v4 } from 'uuid';

import type { TurnBasedChatAdapterAPI, TurnBasedChatAdapterOptions } from './types/TurnBasedChatAdapterAPI';
import type { Activity } from 'botframework-directlinejs';

type StartConversationCallback = ConstructorParameters<typeof TurnBasedChatAdapter>[0];

/**
 * Converts a turn-based chat API into a chat adapter for Bot Framework Web Chat.
 */
export default function fromTurnBasedChatAdapterAPI(
  api: TurnBasedChatAdapterAPI,
  { emitStartConversationEvent = true }: TurnBasedChatAdapterOptions = {}
): ChatAdapter {
  let iterating = false;
  let nextSequenceID = 0;

  const patchActivity = (activity: Activity): Activity => ({
    ...activity,
    channelData: { ...activity.channelData, 'webchat:sequence-id': nextSequenceID++ },
    timestamp: new Date().toISOString()
  });

  const createActivityIterableIterator = async function* (
    conversationId: string,
    { action, activities }: { action: ExecuteTurnContinuationAction; activities: Activity[] },
    options: { signal?: AbortSignal }
  ): AsyncIterableIterator<Activity[]> {
    if (iterating) {
      throw new Error('ASSERTION: Must fully iterate before performing another iteration.');
    }

    iterating = true;

    try {
      yield activities.map(patchActivity);

      while (action === ExecuteTurnContinuationAction.Continue) {
        ({ action, activities } = await api.continueTurn(conversationId, options));

        yield activities.map(patchActivity);
      }

      iterating = false;
    } catch (error) {
      iterating = false;

      throw error;
    } finally {
      // "iterating" is true if and only if the caller of the iterator call iterator.return() to break the for-loop early.
      // The protocol does not support executeTurn() without completing the previous continueTurn().
      // Thus, we need to throw exception.
      if (iterating) {
        // This error is okay to thrown before any yield.
        // eslint-disable-next-line no-unsafe-finally
        throw new Error('ASSERTION: Break in iterator is not supported.');
      }
    }
  };

  const startConversation: StartConversationCallback = async ({ signal }) => {
    const options = { signal };

    const {
      action: startNewConversationAction,
      activities: startNewConversationActivities,
      conversationId
    } = await api.startNewConversation(emitStartConversationEvent, options);

    return {
      initialActivities: createActivityIterableIterator(
        conversationId,
        { action: startNewConversationAction, activities: startNewConversationActivities },
        options
      ),

      execute(activity: Activity): {
        activities: AsyncIterableIterator<Activity[]>;
        activityID: Promise<string>;
      } {
        const activityID = `c1-${v4()}`;
        const activityIDDeferred = new DeferredPromise<string>();

        const activityWithID: Activity = { ...activity, id: activityID };

        return {
          activities: (async function* (): AsyncIterableIterator<Activity[]> {
            const { action: executeTurnAction, activities: executeTurnActivities } = await api.executeTurn(
              conversationId,
              activityWithID,
              { signal }
            );

            // After executeTurn() completed, the bot should have received the message and start processing.
            // We can resolve the activityID, thus, resolving the postActivity() call.
            activityIDDeferred.resolve(activityID);

            yield* createActivityIterableIterator(
              conversationId,
              {
                action: executeTurnAction,
                // Echo back activity during the first turn.
                activities: [activityWithID, ...executeTurnActivities]
              },
              options
            );
          })(),

          // Resolve activityID only after "executeTurn()" has completed.
          activityID: activityIDDeferred.promise
        };
      }
    };
  };

  return new TurnBasedChatAdapter(startConversation);
}
