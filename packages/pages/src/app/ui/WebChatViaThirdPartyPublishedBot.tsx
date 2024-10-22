import {
  ThirdPartyPublishedBotStrategy,
  createHalfDuplexChatAdapter,
  toDirectLineJS
} from 'copilot-studio-direct-to-engine-chat-adapter';
import { Fragment, memo, useCallback, useEffect, useMemo } from 'react';

import { type Transport } from '../types/Transport';
import ReactWebChatShim from './ReactWebChatShim';

type Props = {
  botSchema: string;
  emitStartConversationEvent: boolean;
  environmentID: string;
  hostnameSuffix: string;
  token: string;
  transport: Transport;
};

export default memo(function WebChat({
  botSchema,
  emitStartConversationEvent,
  environmentID,
  hostnameSuffix,
  token,
  transport
}: Props) {
  // Should use PowerPlatformApiDiscovery to find out the base URL.
  const environmentIDWithoutHyphens = useMemo(() => environmentID.replaceAll('-', ''), [environmentID]);
  const getToken = useCallback<() => Promise<string>>(() => Promise.resolve(token), [token]);
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
    () => new ThirdPartyPublishedBotStrategy({ botSchema, environmentEndpointURL, getToken, transport }),
    [botSchema, environmentEndpointURL, getToken, transport]
  );

  const chatAdapter = useMemo(
    () => toDirectLineJS(createHalfDuplexChatAdapter(strategy, { emitStartConversationEvent })),
    [emitStartConversationEvent, strategy]
  );

  useEffect(() => () => chatAdapter?.end(), [chatAdapter]);

  return (
    <Fragment>
      <h2>Chat adapter strategy parameters</h2>
      <pre>
        {`new ThirdPartyPublishedBotStrategy({`}
        {`\n  botSchema: '${botSchema}',`}
        {`\n  environmentEndpointURL: '${environmentEndpointURL.toString()}',`}
        {`\n  getToken: () => '${token.slice(0, 5)}…',`}
        {`\n  transport: '${transport}'`}
        {`\n})`}
      </pre>
      <div className="webchat">
        <ReactWebChatShim directLine={chatAdapter} />
      </div>
    </Fragment>
  );
});
