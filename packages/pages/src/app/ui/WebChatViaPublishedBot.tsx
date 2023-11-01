import { Fragment, memo, useCallback, useEffect, useMemo } from 'react';
import {
  fromTurnBasedChatAdapterAPI,
  PowerPlatformAPIChatAdapter,
  PublishedBotAPIStrategy
} from 'powerva-chat-adapter';

import ReactWebChat from 'botframework-webchat';

type Props = {
  botSchema: string;
  environmentID: string;
  hostnameSuffix: string;
  token: string;
};

export default memo(function WebChat({ botSchema, environmentID, hostnameSuffix, token }: Props) {
  // Should use PowerPlatformApiDiscovery to find out the base URL.
  const environmentIDWithoutHyphens = useMemo(() => environmentID.replaceAll('-', ''), [environmentID]);
  const getTokenCallback = useCallback<() => Promise<string>>(() => Promise.resolve(token), [token]);
  const hostnameShardLength = useMemo(() => (hostnameSuffix === 'api.powerplatform.com' ? 2 : 1), [hostnameSuffix]);

  const hostnamePrefix = useMemo(
    () =>
      [
        environmentIDWithoutHyphens.substring(0, environmentIDWithoutHyphens.length - hostnameShardLength),
        environmentIDWithoutHyphens.substring(environmentIDWithoutHyphens.length - hostnameShardLength)
      ].join('.'),
    [environmentIDWithoutHyphens, hostnameShardLength]
  );

  const environmentEndpointURL = new URL(`https://${hostnamePrefix}.environment.${hostnameSuffix}`);

  const strategy = useMemo(
    () => new PublishedBotAPIStrategy({ botSchema, environmentEndpointURL, getTokenCallback }),
    [botSchema, environmentEndpointURL, getTokenCallback]
  );

  const chatAdapter = useMemo(() => fromTurnBasedChatAdapterAPI(new PowerPlatformAPIChatAdapter(strategy)), [strategy]);

  useEffect(() => () => chatAdapter?.end(), [chatAdapter]);

  return (
    <Fragment>
      <h2>Chat adapter strategy parameters</h2>
      <pre>
        new PublishedBotAPIStrategy({'{'}
        {'\n  '}botSchema: {"'"}
        {botSchema}
        {"'"},{'\n  '}environmentEndpointURL: {"'"}
        {environmentEndpointURL.toString()}
        {"'"}
        {'\n  '}getTokenCallback: () =&gt; token
        {'\n}'})
      </pre>
      <div className="webchat">
        <ReactWebChat directLine={chatAdapter} />
      </div>
    </Fragment>
  );
});
