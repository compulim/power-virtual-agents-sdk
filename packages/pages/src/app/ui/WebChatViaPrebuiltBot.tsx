import { Fragment, memo, useCallback, useEffect, useMemo } from 'react';
import { fromTurnBasedChatAdapterAPI, PowerPlatformAPIChatAdapter, PrebuiltBotAPIStrategy } from 'powerva-chat-adapter';

import ReactWebChat from 'botframework-webchat';

type Props = {
  botIdentifier: string;
  environmentID: string;
  hostnameSuffix: string;
  token: string;
};

export default memo(function WebChat({ botIdentifier, environmentID, hostnameSuffix, token }: Props) {
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
    () => new PrebuiltBotAPIStrategy({ botIdentifier, environmentEndpointURL, getTokenCallback }),
    [botIdentifier, environmentEndpointURL, getTokenCallback]
  );

  const chatAdapter = useMemo(() => fromTurnBasedChatAdapterAPI(new PowerPlatformAPIChatAdapter(strategy)), [strategy]);

  useEffect(() => () => chatAdapter?.end(), [chatAdapter]);

  return (
    <Fragment>
      <h2>Chat adapter strategy parameters</h2>
      <pre>
        new PrebuiltBotAPIStrategy({'{'}
        {'\n  '}botIdentifier: {"'"}
        {botIdentifier}
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
