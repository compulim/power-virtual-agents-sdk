import { iterateWithReturnValue } from 'iterate-with-return-value/async';
import Readline from 'readline';

import PublishedBotAPIStrategy from './PublishedBotAPIStrategy';
import startConversation from './private/startConversation';

const strategy = new PublishedBotAPIStrategy({
  botSchema: '',
  environmentEndpointURL: new URL(''),
  async getTokenCallback() {
    return '';
  }
});

(async function () {
  let activities = await startConversation(strategy);
  const rl = Readline.promises.createInterface(process.stdin);

  for (;;) {
    let response = await activities.next();

    while (!response.done) {
      console.log(response.value); // Activity

      response = await activities.next();
    }

    const postActivity = response.value;
    const text = await rl.question('Send> ');

    activities = await postActivity({ from: { id: 'u-00001' }, text, type: 'message' });
  }
})();

(async function () {
  let [activities, getReturnValue] = iterateWithReturnValue(await startConversation(strategy));
  const rl = Readline.promises.createInterface(process.stdin);

  for (;;) {
    for await (const activity of activities) {
      console.log(activity);
    }

    const executeTurn = getReturnValue();

    const text = await rl.question('Send> ');

    [activities, getReturnValue] = iterateWithReturnValue(
      await executeTurn({ from: { id: 'u-00001' }, text, type: 'message' })
    );
  }
})();
