import {
  TestCanvasBotAPIStrategy,
  createHalfDuplexChatAdapter,
  toDirectLineJS
} from 'copilot-studio-direct-to-engine-chat-adapter';
import { Fragment, memo, useCallback, useEffect, useMemo } from 'react';

import ReactWebChat from 'botframework-webchat';

type Props = {
  botId: string;
  environmentId: string;
  islandURI: string;
  token: string;
};

export default memo(function WebChat({ botId, environmentId, islandURI, token }: Props) {
  const getTokenCallback = useCallback<() => Promise<string>>(() => Promise.resolve(token), [token]);

  const strategy = useMemo(
    () => new TestCanvasBotAPIStrategy({ botId, environmentId, getTokenCallback, islandURI: new URL(islandURI) }),
    [botId, environmentId, getTokenCallback, islandURI]
  );

  const chatAdapter = useMemo(() => toDirectLineJS(createHalfDuplexChatAdapter(strategy)), [strategy]);

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
        new TestCanvasBotAPIStrategy({'{\n  '}botId: {"'"}
        {botId}
        {"',\n  "}environmentId: {"'"}
        {environmentId.toString()}
        {"',\n  "}getTokenCallback: () =&gt; token
        {',\n  '}islandURI: new URL({"'"}
        {islandURI.toString()}
        {"')\n}"})
      </pre>
      <div className="webchat">
        <ReactWebChat directLine={chatAdapter} />
      </div>
    </Fragment>
  );
});
