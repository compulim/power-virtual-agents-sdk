import {
  AnywhereBotAPIStrategy,
  createHalfDuplexChatAdapter,
  toDirectLineJS
} from 'copilot-studio-direct-to-engine-chat-adapter';
import { Fragment, memo, useEffect, useMemo } from 'react';

import ReactWebChatShim from './ReactWebChatShim';

type Props = {
  emitStartConversationEvent: boolean;
  botIdentifier: string;
  islandURI: string;
};

export default memo(function WebChat({ emitStartConversationEvent, botIdentifier, islandURI }: Props) {
  const strategy = useMemo(
    () =>
      new AnywhereBotAPIStrategy({
        botIdentifier,
        islandURI: new URL(islandURI)
      }),
    [botIdentifier, islandURI]
  );

  // const chatAdapter = useMemo(() => fromTurnBasedChatAdapterAPI(new PowerPlatformAPIChatAdapter(strategy)), [strategy]);
  const chatAdapter = useMemo(
    () => toDirectLineJS(createHalfDuplexChatAdapter(strategy, { emitStartConversationEvent })),
    [emitStartConversationEvent, strategy]
  );

  useEffect(() => () => chatAdapter?.end(), [chatAdapter]);

  return (
    <Fragment>
      <h2>Chat adapter strategy parameters</h2>
      <pre>
        {`new AnywhereBotAPIStrategy({`}
        {`\n  botIdentifier: '${botIdentifier}',`}
        {`\n  islandURI: new URL('${islandURI.toString()}'),`}
        {`\n})`}
      </pre>
      <div className="webchat">
        <ReactWebChatShim directLine={chatAdapter} />
      </div>
    </Fragment>
  );
});
