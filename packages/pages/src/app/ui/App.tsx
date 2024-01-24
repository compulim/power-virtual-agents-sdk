import { Fragment, memo, useCallback, useState } from 'react';
import { useRefFrom } from 'use-ref-from';

import useAppReducer from '../data/useAppReducer';
import { type PropsOf } from '../types/PropsOf';
import CredentialForm from './CredentialForm';
import WebChatViaPrebuiltBot from './WebChatViaPrebuiltBot';
import WebChatViaPublishedBot from './WebChatViaPublishedBot';
import WebChatViaTestCanvasBot from './WebChatViaTestCanvasBot';

type SubmittedCredential = {
  botIdentifier: string;
  botSchema: string;
  environmentID: string;
  hostnameSuffix: string;
  key: number;
  islandURI?: string;
  tenantID?: string;
  token: string;
  type: string;
};

type CredentialFormChangeCallback = Exclude<PropsOf<typeof CredentialForm>['onChange'], undefined>;

export default memo(function App() {
  const [
    { botIdentifier, botSchema, environmentID, hostnameSuffix, islandURI, token, type },
    {
      reset,
      saveToSessionStorage,
      setBotIdentifier,
      setBotSchema,
      setEnvironmentID,
      setHostnameSuffix,
      setIslandURI,
      setToken,
      setType
    }
  ] = useAppReducer();
  const [submittedCredential, setSubmittedCredential] = useState<SubmittedCredential | undefined>();
  const botIdentifierRef = useRefFrom(botIdentifier);
  const botSchemaRef = useRefFrom(botSchema);
  const environmentIDRef = useRefFrom(environmentID);
  const hostnameSuffixRef = useRefFrom(hostnameSuffix);
  const islandURIRef = useRefFrom(islandURI);
  const tokenRef = useRefFrom(token);
  const typeRef = useRefFrom(type);

  const handleCredentialFormChange = useCallback<CredentialFormChangeCallback>(
    ({ botIdentifier, botSchema, environmentID, hostnameSuffix, islandURI, token, type }) => {
      setBotIdentifier(botIdentifier);
      setBotSchema(botSchema);
      setEnvironmentID(environmentID);
      setHostnameSuffix(hostnameSuffix);
      setIslandURI(islandURI);
      setToken(token);
      setType(type);

      saveToSessionStorage();
    },
    [
      saveToSessionStorage,
      setBotIdentifier,
      setBotSchema,
      setEnvironmentID,
      setHostnameSuffix,
      setIslandURI,
      setToken,
      setType
    ]
  );

  const handleReset = useCallback(() => reset(), [reset]);

  const handleSubmit = useCallback(
    () =>
      setSubmittedCredential({
        botIdentifier: botIdentifierRef.current,
        botSchema: botSchemaRef.current,
        environmentID: environmentIDRef.current,
        hostnameSuffix: hostnameSuffixRef.current,
        islandURI: islandURIRef.current,
        key: Date.now(),
        token: tokenRef.current,
        type: typeRef.current
      }),
    [botIdentifierRef, environmentIDRef, hostnameSuffixRef, setSubmittedCredential, tokenRef]
  );

  return (
    <Fragment>
      <h1>Power Virtual Agents chat adapter demo</h1>
      <h2>Credential</h2>
      <CredentialForm
        autoFocus={!!(botIdentifier && environmentID && token)}
        botIdentifier={botIdentifier}
        botSchema={botSchema}
        environmentID={environmentID}
        hostnameSuffix={hostnameSuffix}
        islandURI={islandURI}
        token={token}
        type={type}
        onChange={handleCredentialFormChange}
        onReset={handleReset}
        onSubmit={handleSubmit}
      />
      {!!submittedCredential &&
        (type === 'published bot'
          ? submittedCredential.botSchema && (
              <WebChatViaPublishedBot
                botSchema={submittedCredential.botSchema}
                environmentID={submittedCredential.environmentID}
                hostnameSuffix={submittedCredential.hostnameSuffix}
                key={submittedCredential.key}
                token={submittedCredential.token}
              />
            )
          : type === 'test canvas bot'
          ? submittedCredential.islandURI && (
              <WebChatViaTestCanvasBot
                botId={submittedCredential.botIdentifier}
                environmentId={submittedCredential.environmentID}
                islandURI={submittedCredential.islandURI}
                key={submittedCredential.key}
                token={submittedCredential.token}
              />
            )
          : submittedCredential.botIdentifier && (
              <WebChatViaPrebuiltBot
                botIdentifier={submittedCredential.botIdentifier}
                environmentID={submittedCredential.environmentID}
                hostnameSuffix={submittedCredential.hostnameSuffix}
                key={submittedCredential.key}
                token={submittedCredential.token}
              />
            ))}
    </Fragment>
  );
});
