import { Fragment, memo, useCallback, useState } from 'react';
import { useRefFrom } from 'use-ref-from';

import useAppReducer from '../data/useAppReducer';
import { type PropsOf } from '../types/PropsOf';
import { type Transport } from '../types/Transport';
import CredentialForm from './CredentialForm';
import WebChatViaEmbeddedAuthoringTestBot from './WebChatViaEmbeddedAuthoringTestBot';
import WebChatViaPrebuiltBot from './WebChatViaPrebuiltBot';
import WebChatViaPublishedBot from './WebChatViaPublishedBot';
import WebChatViaTestCanvasBot from './WebChatViaTestCanvasBot';
import WebChatViaThirdPartyPublishedBot from './WebChatViaThirdPartyPublishedBot';

type SubmittedCredential = {
  baseURL?: string;
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
      baseURL,
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
      setBaseURL,
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
  const baseURLRef = useRefFrom(baseURL);
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
      baseURL,
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
      setBaseURL(baseURL);
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
      setBaseURL,
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
        baseURL: baseURLRef.current,
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
      baseURLRef,
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

  return (
    <Fragment>
      <h1>Copilot Studio chat adapter demo</h1>
      <h2>Credentials</h2>
      <CredentialForm
        autoFocus={!!(botIdentifier && environmentID && token)}
        baseURL={baseURL}
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
      {!!submittedCredential &&
        (type === 'embedded authoring test bot'
          ? submittedCredential.baseURL && (
              <WebChatViaEmbeddedAuthoringTestBot
                baseURL={submittedCredential.baseURL}
                botSchema={submittedCredential.botSchema}
                deltaToken={submittedCredential.deltaToken}
                emitStartConversationEvent={emitStartConversationEvent}
                key={submittedCredential.key}
                token={submittedCredential.token}
              />
            )
          : type === 'published bot'
          ? submittedCredential.botSchema && (
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
          : type === 'third party published bot'
          ? submittedCredential.botSchema && (
              <WebChatViaThirdPartyPublishedBot
                botSchema={submittedCredential.botSchema}
                emitStartConversationEvent={emitStartConversationEvent}
                environmentID={submittedCredential.environmentID}
                hostnameSuffix={submittedCredential.hostnameSuffix}
                key={submittedCredential.key}
                token={submittedCredential.token}
                transport={submittedCredential.transport}
              />
            )
          : type === 'test canvas bot'
          ? submittedCredential.islandURI && (
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
          : submittedCredential.botIdentifier && (
              <WebChatViaPrebuiltBot
                botIdentifier={submittedCredential.botIdentifier}
                emitStartConversationEvent={emitStartConversationEvent}
                environmentID={submittedCredential.environmentID}
                hostnameSuffix={submittedCredential.hostnameSuffix}
                key={submittedCredential.key}
                token={submittedCredential.token}
                transport={submittedCredential.transport}
              />
            ))}
    </Fragment>
  );
});
