import { Fragment, memo, useCallback, useState } from 'react';
import { useRefFrom } from 'use-ref-from';

import useAppReducer from '../data/useAppReducer';
import { type PropsOf } from '../types/PropsOf';
import { type Transport } from '../types/Transport';
import CredentialForm from './CredentialForm';
import WebChatViaPrebuiltBot from './WebChatViaPrebuiltBot';
import WebChatViaPublishedBot from './WebChatViaPublishedBot';
import WebChatViaTestCanvasBot from './WebChatViaTestCanvasBot';
import WebChatViaAnywhereBot from './WebChatViaAnywhereBot';

type SubmittedCredential = {
  botIdentifier: string;
  botSchema: string;
  deltaToken: string;
  emitStartConversationEvent: boolean;
  environmentID: string;
  hostnameSuffix: string;
  key: number;
  islandURI?: string;
  tenantID?: string;
  token: string;
  transport: Transport;
  type: string;
};

type CredentialFormChangeCallback = Exclude<PropsOf<typeof CredentialForm>['onChange'], undefined>;

export default memo(function App() {
  const [
    {
      botIdentifier,
      botSchema,
      deltaToken,
      emitStartConversationEvent,
      environmentID,
      hostnameSuffix,
      islandURI,
      token,
      transport,
      type
    },
    {
      reset,
      saveToSessionStorage,
      setBotIdentifier,
      setBotSchema,
      setDeltaToken,
      setEmitStartConversationEvent,
      setEnvironmentID,
      setHostnameSuffix,
      setIslandURI,
      setToken,
      setTransport,
      setType
    }
  ] = useAppReducer();
  const [submittedCredential, setSubmittedCredential] = useState<SubmittedCredential | undefined>();
  const botIdentifierRef = useRefFrom(botIdentifier);
  const botSchemaRef = useRefFrom(botSchema);
  const deltaTokenRef = useRefFrom(deltaToken);
  const emitStartConversationEventRef = useRefFrom(emitStartConversationEvent);
  const environmentIDRef = useRefFrom(environmentID);
  const hostnameSuffixRef = useRefFrom(hostnameSuffix);
  const islandURIRef = useRefFrom(islandURI);
  const tokenRef = useRefFrom(token);
  const transportRef = useRefFrom(transport);
  const typeRef = useRefFrom(type);

  const handleCredentialFormChange = useCallback<CredentialFormChangeCallback>(
    ({
      botIdentifier,
      botSchema,
      deltaToken,
      emitStartConversationEvent,
      environmentID,
      hostnameSuffix,
      islandURI,
      token,
      transport,
      type
    }) => {
      setBotIdentifier(botIdentifier);
      setBotSchema(botSchema);
      setDeltaToken(deltaToken);
      setEmitStartConversationEvent(emitStartConversationEvent);
      setEnvironmentID(environmentID);
      setHostnameSuffix(hostnameSuffix);
      setIslandURI(islandURI);
      setToken(token);
      setTransport(transport);
      setType(type);

      saveToSessionStorage();
    },
    [
      saveToSessionStorage,
      setBotIdentifier,
      setBotSchema,
      setDeltaToken,
      setEmitStartConversationEvent,
      setEnvironmentID,
      setHostnameSuffix,
      setIslandURI,
      setToken,
      setTransport,
      setType
    ]
  );

  const handleReset = useCallback(() => reset(), [reset]);

  const handleSubmit = useCallback(
    () =>
      setSubmittedCredential({
        botIdentifier: botIdentifierRef.current,
        botSchema: botSchemaRef.current,
        deltaToken: deltaTokenRef.current,
        emitStartConversationEvent: emitStartConversationEventRef.current,
        environmentID: environmentIDRef.current,
        hostnameSuffix: hostnameSuffixRef.current,
        islandURI: islandURIRef.current,
        key: Date.now(),
        token: tokenRef.current,
        transport: transportRef.current || 'rest',
        type: typeRef.current
      }),
    [
      botIdentifierRef,
      botSchemaRef,
      deltaTokenRef,
      emitStartConversationEventRef,
      environmentIDRef,
      hostnameSuffixRef,
      setSubmittedCredential,
      transportRef,
      tokenRef
    ]
  );
  const renderWebChat = (submittedCredential: SubmittedCredential) => {
    switch (type) {
      case 'published bot':
        return (
          submittedCredential.botSchema && (
            <WebChatViaPublishedBot
              botSchema={submittedCredential.botSchema}
              emitStartConversationEvent={emitStartConversationEvent}
              environmentID={submittedCredential.environmentID}
              hostnameSuffix={submittedCredential.hostnameSuffix}
              key={submittedCredential.key}
              token={submittedCredential.token}
              transport={submittedCredential.transport}
            />
          )
        );
      case 'test canvas bot':
        return (
          submittedCredential.islandURI && (
            <WebChatViaTestCanvasBot
              botId={submittedCredential.botIdentifier}
              deltaToken={submittedCredential.deltaToken}
              emitStartConversationEvent={emitStartConversationEvent}
              environmentId={submittedCredential.environmentID}
              islandURI={submittedCredential.islandURI}
              key={submittedCredential.key}
              token={submittedCredential.token}
              transport={submittedCredential.transport}
            />
          )
        );
      case 'anywhere bot':
        return (
          submittedCredential.botIdentifier && (
            <WebChatViaAnywhereBot
              botIdentifier={submittedCredential.botIdentifier}
              islandURI={submittedCredential.islandURI || ''}
              emitStartConversationEvent={emitStartConversationEvent}
            />
          )
        );
      default:
        return (
          submittedCredential.botIdentifier && (
            <WebChatViaPrebuiltBot
              botIdentifier={submittedCredential.botIdentifier}
              emitStartConversationEvent={emitStartConversationEvent}
              environmentID={submittedCredential.environmentID}
              hostnameSuffix={submittedCredential.hostnameSuffix}
              key={submittedCredential.key}
              token={submittedCredential.token}
              transport={submittedCredential.transport}
            />
          )
        );
    }
  };

  return (
    <Fragment>
      <h1>Copilot Studio chat adapter demo</h1>
      <h2>Credentials</h2>
      <CredentialForm
        autoFocus={!!(botIdentifier && environmentID && token)}
        botIdentifier={botIdentifier}
        botSchema={botSchema}
        deltaToken={deltaToken}
        emitStartConversationEvent={emitStartConversationEvent}
        environmentID={environmentID}
        hostnameSuffix={hostnameSuffix}
        islandURI={islandURI}
        token={token}
        transport={transport}
        type={type}
        onChange={handleCredentialFormChange}
        onReset={handleReset}
        onSubmit={handleSubmit}
      />
      {!!submittedCredential && renderWebChat(submittedCredential)}
    </Fragment>
  );
});
