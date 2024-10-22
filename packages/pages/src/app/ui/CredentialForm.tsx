import decodeJSONWebToken from 'jwt-decode';
import { memo, useCallback, useMemo, type ChangeEventHandler } from 'react';
import { useRefFrom } from 'use-ref-from';

import { type BotType } from '../types/BotType';
import { type Transport } from '../types/Transport';
import onErrorResumeNext from '../util/onErrorResumeNext';
import DoubleTapButton from './DoubleTapButton';

type Props = {
  autoFocus?: boolean;
  baseURL?: string;
  botIdentifier?: string;
  botSchema?: string;
  deltaToken?: string;
  emitStartConversationEvent?: boolean;
  environmentID?: string;
  hostnameSuffix?: string;
  islandURI?: string;
  onChange?: (nextCredential: {
    baseURL: string;
    botIdentifier: string;
    botSchema: string;
    deltaToken: string;
    emitStartConversationEvent: boolean;
    environmentID: string;
    hostnameSuffix: string;
    islandURI: string;
    token: string;
    transport: Transport;
    type: BotType;
  }) => void;
  onReset?: () => void;
  onSubmit?: () => void;
  token?: string;
  transport?: Transport;
  type?: BotType;
};

export default memo(function CredentialForm({
  autoFocus,
  baseURL,
  botIdentifier,
  botSchema,
  deltaToken,
  emitStartConversationEvent,
  environmentID,
  hostnameSuffix,
  islandURI,
  onChange,
  onReset,
  onSubmit,
  token,
  transport = 'rest',
  type = 'prebuilt bot'
}: Props) {
  const baseURLRef = useRefFrom(baseURL);
  const botIdentifierRef = useRefFrom(botIdentifier);
  const botSchemaRef = useRefFrom(botSchema);
  const deltaTokenRef = useRefFrom(deltaToken);
  const emitStartConversationEventRef = useRefFrom(emitStartConversationEvent);
  const environmentIDRef = useRefFrom(environmentID);
  const hostnameSuffixRef = useRefFrom(hostnameSuffix);
  const islandURIRef = useRefFrom(islandURI);
  const onChangeRef = useRefFrom(onChange);
  const onResetRef = useRefFrom(onReset);
  const onSubmitRef = useRefFrom(onSubmit);
  const tokenRef = useRefFrom(token);
  const transportRef = useRefFrom(transport);
  const typeRef = useRefFrom(type);

  const dispatchChange = useCallback(
    (overrides: {
      baseURL?: string;
      botIdentifier?: string;
      botSchema?: string;
      deltaToken?: string;
      emitStartConversationEvent?: boolean;
      environmentID?: string;
      hostnameSuffix?: string;
      islandURI?: string;
      // tenantID?: string;
      token?: string;
      transport?: Transport;
      type?: BotType;
    }) => {
      const transport: Transport = transportRef.current === 'auto' ? transportRef.current : 'rest';
      const type: BotType =
        typeRef.current === 'embedded authoring test bot' ||
        typeRef.current === 'published bot' ||
        typeRef.current === 'test canvas bot' ||
        typeRef.current === 'third party published bot'
          ? typeRef.current
          : 'prebuilt bot';

      onChangeRef.current?.({
        baseURL: baseURLRef.current || '',
        botIdentifier: botIdentifierRef.current || '',
        botSchema: botSchemaRef.current || '',
        deltaToken: deltaTokenRef.current || '',
        emitStartConversationEvent: emitStartConversationEventRef.current ?? true,
        environmentID: environmentIDRef.current || '',
        hostnameSuffix: hostnameSuffixRef.current || '',
        islandURI: islandURIRef.current || '',
        token: tokenRef.current || '',
        transport,
        type,
        ...overrides
      });
    },
    [
      baseURLRef,
      botIdentifierRef,
      botSchemaRef,
      deltaTokenRef,
      environmentIDRef,
      hostnameSuffix,
      islandURI,
      tokenRef,
      typeRef
    ]
  );

  const handleBaseURLChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    ({ currentTarget }) => dispatchChange({ baseURL: currentTarget.value }),
    [dispatchChange]
  );

  const handleBotIdentifierChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    ({ currentTarget }) => dispatchChange({ botIdentifier: currentTarget.value }),
    [dispatchChange]
  );

  const handleBotSchemaChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    ({ currentTarget }) => dispatchChange({ botSchema: currentTarget.value }),
    [dispatchChange]
  );

  const handleDeltaTokenChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    ({ currentTarget }) => dispatchChange({ deltaToken: currentTarget.value }),
    [dispatchChange]
  );

  const handleEmitStartConversationEventChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    ({ currentTarget }) => dispatchChange({ emitStartConversationEvent: currentTarget.checked }),
    [dispatchChange]
  );

  const handleEnvironmentIDChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    ({ currentTarget }) => dispatchChange({ environmentID: currentTarget.value }),
    [dispatchChange]
  );

  const handleHostnameSuffixChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    ({ currentTarget }) => dispatchChange({ hostnameSuffix: currentTarget.value }),
    [dispatchChange]
  );

  const handleIslandURIChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    ({ currentTarget }) => dispatchChange({ islandURI: currentTarget.value }),
    [dispatchChange]
  );

  const handleSubmit = useCallback<ChangeEventHandler<HTMLFormElement>>(
    event => {
      event.preventDefault();

      onSubmitRef.current?.();
    },
    [onSubmitRef]
  );

  const handleTokenChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    ({ currentTarget: { value } }) =>
      dispatchChange({ token: /^bearer\s/iu.test(value) ? value.substring(6).trimStart() : value }),
    [dispatchChange]
  );

  const handleTransportChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    ({ currentTarget: { value } }) => dispatchChange({ transport: value === 'auto' ? value : 'rest' }),
    [dispatchChange]
  );

  const handleTypeChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    ({ currentTarget: { value } }) =>
      dispatchChange({
        type:
          value === 'embedded authoring test bot' ||
          value === 'published bot' ||
          value === 'test canvas bot' ||
          value === 'third party published bot'
            ? value
            : 'prebuilt bot'
      }),
    [dispatchChange]
  );

  const handleResetButtonClick = useCallback(() => onResetRef.current?.(), [onResetRef]);

  const tokenTooltip = useMemo(
    () =>
      token &&
      onErrorResumeNext(() => {
        const { aud, iss, scp, tid, upn } = decodeJSONWebToken(token) as {
          aud: string;
          iss: string;
          scp: string;
          tid: string;
          upn: string;
        };

        return JSON.stringify({ aud, iss, scp: scp && scp.split(' ').sort(), tid, upn }, null, 2);
      }),
    [token]
  );

  // TODO: If autofocus is enabled, consider focus on the first invalid field.

  return (
    <form onSubmit={handleSubmit}>
      <dl>
        <dt>Bot type</dt>
        <dd>
          <label>
            <input
              checked={
                type !== 'embedded authoring test bot' &&
                type !== 'published bot' &&
                type !== 'test canvas bot' &&
                type !== 'third party published bot'
              }
              name="bot-type"
              onChange={handleTypeChange}
              type="radio"
              value="prebuilt bot"
            />
            Prebuilt bot
          </label>
        </dd>
        <dd>
          <label>
            <input
              checked={type === 'published bot'}
              name="bot-type"
              onChange={handleTypeChange}
              type="radio"
              value="published bot"
            />
            Published bot (1P)
          </label>
        </dd>
        <dd>
          <label>
            <input
              checked={type === 'third party published bot'}
              name="bot-type"
              onChange={handleTypeChange}
              type="radio"
              value="third party published bot"
            />
            Published bot (3P)
          </label>
        </dd>
        <dd>
          <label>
            <input
              checked={type === 'test canvas bot'}
              name="bot-type"
              onChange={handleTypeChange}
              type="radio"
              value="test canvas bot"
            />
            Test canvas bot
          </label>
        </dd>
        <dd>
          <label>
            <input
              checked={type === 'embedded authoring test bot'}
              name="bot-type"
              onChange={handleTypeChange}
              type="radio"
              value="embedded authoring test bot"
            />
            Embedded authoring test bot
          </label>
        </dd>
        <dt>Transport</dt>
        <dd>
          <label>
            <input
              checked={transport === 'auto' || type === 'embedded authoring test bot'}
              disabled={type === 'embedded authoring test bot'}
              name="transport"
              onChange={handleTransportChange}
              type="radio"
              value="auto"
            />
            Auto (SSE over REST)
          </label>
        </dd>
        <dd>
          <label>
            <input
              checked={transport !== 'auto' && type !== 'embedded authoring test bot'}
              disabled={type === 'embedded authoring test bot'}
              name="transport"
              onChange={handleTransportChange}
              type="radio"
              value="rest"
            />
            REST
          </label>
        </dd>
        <dt>Emit start conversation event</dt>
        <dd>
          <label>
            <input
              checked={emitStartConversationEvent}
              name="emitStartConversationEvent"
              onChange={handleEmitStartConversationEventChange}
              type="checkbox"
            />
            Emit start conversation event
          </label>
        </dd>
        {type === 'test canvas bot' ? (
          <label>
            <dt>Island URI</dt>
            <dd>
              <input onChange={handleIslandURIChange} type="text" value={islandURI || ''} />
            </dd>
          </label>
        ) : type === 'embedded authoring test bot' ? (
          <label>
            <dt>Base URL</dt>
            <dd>
              <input onChange={handleBaseURLChange} type="text" value={baseURL || ''} />
            </dd>
          </label>
        ) : (
          <label>
            <dt>Hostname suffix</dt>
            <dd>
              <input onChange={handleHostnameSuffixChange} type="text" value={hostnameSuffix || ''} />
            </dd>
          </label>
        )}
        {type !== 'embedded authoring test bot' && (
          <label>
            <dt>Environment ID</dt>
            <dd>
              <input onChange={handleEnvironmentIDChange} required type="text" value={environmentID || ''} />
            </dd>
          </label>
        )}
        {type === 'embedded authoring test bot' || type === 'published bot' || type === 'third party published bot' ? (
          <label>
            <dt>Bot schema</dt>
            <dd>
              <input onChange={handleBotSchemaChange} required type="text" value={botSchema || ''} />
            </dd>
          </label>
        ) : (
          <label>
            <dt>Bot identifier</dt>
            <dd>
              <input onChange={handleBotIdentifierChange} required type="text" value={botIdentifier || ''} />
            </dd>
          </label>
        )}
        <label>
          <dt>Token</dt>
          <dd>
            <input
              autoComplete="off"
              onChange={handleTokenChange}
              required
              title={tokenTooltip}
              type="password"
              value={token || ''}
            />
          </dd>
        </label>
        {(type === 'embedded authoring test bot' || type === 'test canvas bot') && (
          <label>
            <dt>Delta token</dt>
            <dd>
              <input autoComplete="off" onChange={handleDeltaTokenChange} type="password" value={deltaToken || ''} />
            </dd>
          </label>
        )}
      </dl>
      <button autoFocus={autoFocus} type="submit">
        Create Web Chat
      </button>{' '}
      <DoubleTapButton onClick={handleResetButtonClick}>Double tap to clear</DoubleTapButton>
    </form>
  );
});
