import { type Activity } from 'botframework-directlinejs';

import DirectToEngineServerSentEventsChatAdapterAPI from './DirectToEngineServerSentEventsChatAdapterAPI';
import { type HalfDuplexChatAdapterAPI } from './types/HalfDuplexChatAdapterAPI';
import { type HalfDuplexChatAdapterAPIStrategy } from './types/HalfDuplexChatAdapterAPIStrategy';

type ExecuteTurnFunction = (activity: Activity) => AsyncGenerator<Activity, ExecuteTurnFunction, undefined>;
type Init = ConstructorParameters<typeof DirectToEngineServerSentEventsChatAdapterAPI>[1] & {
  emitStartConversationEvent?: boolean;
};

const createExecuteTurn = (api: HalfDuplexChatAdapterAPI): ExecuteTurnFunction => {
  let obsoleted = false;

  return async function* (activity: Activity): AsyncGenerator<Activity, ExecuteTurnFunction, undefined> {
    if (obsoleted) {
      throw new Error('This executeTurn() function is obsoleted. Please use a new one.');
    }

    obsoleted = true;

    const activities = await api.executeTurn(activity);

    yield* activities;

    return createExecuteTurn(api);
  };
};

export default async function* startConversation(
  strategy: HalfDuplexChatAdapterAPIStrategy,
  init: Init = {}
): AsyncGenerator<Activity, ExecuteTurnFunction, undefined> {
  const api = new DirectToEngineServerSentEventsChatAdapterAPI(strategy, init);

  const activities = await api.startNewConversation(init?.emitStartConversationEvent || true);

  yield* activities;

  return createExecuteTurn(api);
}
