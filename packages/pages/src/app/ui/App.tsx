import { Fragment, memo, useCallback, useState } from 'react';
import { useRefFrom } from 'use-ref-from';

import { type PropsOf } from '../types/PropsOf';
import CredentialForm from './CredentialForm';
import useAppReducer from '../data/useAppReducer';
import WebChatViaPrebuiltBot from './WebChatViaPrebuiltBot';
import WebChatViaPublishedBot from './WebChatViaPublishedBot';

type SubmittedCredential = {
  botIdentifier: string;
  botSchema: string;
  environmentID: string;
  hostnameSuffix: string;
  key: number;
  tenantID?: string;
  token: string;
  type: string;
};

type CredentialFormChangeCallback = Exclude<PropsOf<typeof CredentialForm>['onChange'], undefined>;

export default memo(function App() {
  const [
    { botIdentifier, botSchema, environmentID, hostnameSuffix, token, type },
    {
      reset,
      saveToSessionStorage,
      setBotIdentifier,
      setBotSchema,
      setEnvironmentID,
      setHostnameSuffix,
      setToken,
      setType
    }
  ] = useAppReducer();
  const [submittedCredential, setSubmittedCredential] = useState<SubmittedCredential | undefined>();
  const botIdentifierRef = useRefFrom(botIdentifier);
  const botSchemaRef = useRefFrom(botSchema);
  const environmentIDRef = useRefFrom(environmentID);
  const hostnameSuffixRef = useRefFrom(hostnameSuffix);
  const tokenRef = useRefFrom(token);
  const typeRef = useRefFrom(type);

  const handleCredentialFormChange = useCallback<CredentialFormChangeCallback>(
    ({ botIdentifier, botSchema, environmentID, hostnameSuffix, token, type }) => {
      setBotIdentifier(botIdentifier);
      setBotSchema(botSchema);
      setEnvironmentID(environmentID);
      setHostnameSuffix(hostnameSuffix);
      setToken(token);
      setType(type);

      saveToSessionStorage();
    },
    [saveToSessionStorage, setBotIdentifier, setBotSchema, setEnvironmentID, setHostnameSuffix, setToken, setType]
  );

  const handleReset = useCallback(() => reset(), [reset]);

  const handleSubmit = useCallback(
    () =>
      setSubmittedCredential({
        botIdentifier: botIdentifierRef.current,
        botSchema: botSchemaRef.current,
        environmentID: environmentIDRef.current,
        hostnameSuffix: hostnameSuffixRef.current,
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
