import {
  TestCanvasBotStrategy,
  createHalfDuplexChatAdapter,
  toDirectLineJS
} from 'copilot-studio-direct-to-engine-chat-adapter';
import { Fragment, memo, useCallback, useEffect, useMemo } from 'react';
import { useRefFrom } from 'use-ref-from';

import { type Transport } from '../types/Transport';
import ReactWebChatShim from './ReactWebChatShim';

type Props = {
  botId: string;
  deltaToken: string;
  emitStartConversationEvent: boolean;
  environmentId: string;
  islandURI: string;
  token: string;
  transport: Transport;
};

export default memo(function WebChat({
  botId,
  deltaToken,
  emitStartConversationEvent,
  environmentId,
  islandURI,
  token,
  transport
}: Props) {
  const deltaTokenRef = useRefFrom(deltaToken);
  const tokenRef = useRefFrom(token);
  const getDeltaToken = useCallback<() => Promise<string | undefined>>(
    () => Promise.resolve(deltaTokenRef.current),
    [deltaTokenRef]
  );
  const getToken = useCallback<() => Promise<string>>(() => Promise.resolve(tokenRef.current), [tokenRef]);

  const strategy = useMemo(
    () =>
      new TestCanvasBotStrategy({
        botId,
        environmentId,
        getDeltaToken,
        getToken,
        islandURI: new URL(islandURI),
        transport
      }),
    [botId, environmentId, getDeltaToken, getToken, islandURI, transport]
  );

  const chatAdapter = useMemo(
    () => toDirectLineJS(createHalfDuplexChatAdapter(strategy, { emitStartConversationEvent })),
    [emitStartConversationEvent, strategy]
  );

  useEffect(
    () => () => {
      try {
        chatAdapter?.end();
      } catch {
        // Intentionally left blank.
      }
    },
    [chatAdapter]
  );

  return (
    <Fragment>
      <h2>Chat adapter strategy parameters</h2>
      <pre>
        {'new TestCanvasBotStrategy({'}
        {`\n  botId: '${botId}',`}
        {`\n  environmentId: '${environmentId.toString()}',`}
        {`\n  getDeltaToken: () => '${deltaToken.slice(0, 5)}…',`}
        {`\n  getToken: () => '${token.slice(0, 5)}…',`}
        {`\n  islandURI: new URL('${islandURI.toString()}'),`}
        {`\n  transport: '${transport}'`}
        {`\n})`}
      </pre>
      <div className="webchat">
        <ReactWebChatShim directLine={chatAdapter} />
      </div>
    </Fragment>
  );
});
