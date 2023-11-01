import { type ChangeEventHandler, memo, useCallback, useMemo } from 'react';
import { useRefFrom } from 'use-ref-from';
import decodeJSONWebToken from 'jwt-decode';

import { type BotType } from '../types/BotType';
import DoubleTapButton from './DoubleTapButton';
import onErrorResumeNext from '../util/onErrorResumeNext';

type Props = {
  autoFocus?: boolean;
  botIdentifier?: string;
  botSchema?: string;
  environmentID?: string;
  hostnameSuffix?: string;
  onChange?: (nextCredential: {
    botIdentifier: string;
    botSchema: string;
    environmentID: string;
    hostnameSuffix: string;
    token: string;
    type: BotType;
  }) => void;
  onReset?: () => void;
  onSubmit?: () => void;
  token?: string;
  type?: BotType;
};

export default memo(function CredentialForm({
  autoFocus,
  botIdentifier,
  botSchema,
  environmentID,
  hostnameSuffix,
  onChange,
  onReset,
  onSubmit,
  token,
  type = 'prebuilt bot'
}: Props) {
  const botIdentifierRef = useRefFrom(botIdentifier);
  const botSchemaRef = useRefFrom(botSchema);
  const environmentIDRef = useRefFrom(environmentID);
  const hostnameSuffixRef = useRefFrom(hostnameSuffix);
  const onChangeRef = useRefFrom(onChange);
  const onResetRef = useRefFrom(onReset);
  const onSubmitRef = useRefFrom(onSubmit);
  const tokenRef = useRefFrom(token);
  const typeRef = useRefFrom(type);

  const dispatchChange = useCallback(
    (overrides: {
      botIdentifier?: string;
      botSchema?: string;
      environmentID?: string;
      hostnameSuffix?: string;
      // tenantID?: string;
      token?: string;
      type?: BotType;
    }) => {
      const type: BotType = typeRef.current === 'published bot' ? 'published bot' : 'prebuilt bot';

      onChangeRef.current?.({
        botIdentifier: botIdentifierRef.current || '',
        botSchema: botSchemaRef.current || '',
        environmentID: environmentIDRef.current || '',
        hostnameSuffix: hostnameSuffixRef.current || '',
        token: tokenRef.current || '',
        type,
        ...overrides
      });
    },
    [botIdentifierRef, botSchemaRef, environmentIDRef, hostnameSuffix, tokenRef, typeRef]
  );

  const handleBotIdentifierChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    ({ currentTarget }) => dispatchChange({ botIdentifier: currentTarget.value }),
    [environmentIDRef, onChangeRef, tokenRef]
  );

  const handleBotSchemaChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    ({ currentTarget }) => dispatchChange({ botSchema: currentTarget.value }),
    [environmentIDRef, onChangeRef, tokenRef]
  );

  const handleEnvironmentIDChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    ({ currentTarget }) => dispatchChange({ environmentID: currentTarget.value }),
    [dispatchChange]
  );

  const handleHostnameSuffixChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    ({ currentTarget }) => dispatchChange({ hostnameSuffix: currentTarget.value }),
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
    ({ currentTarget }) => dispatchChange({ token: currentTarget.value }),
    [dispatchChange]
  );

  const handleTypeChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    ({ currentTarget }) =>
      dispatchChange({ type: currentTarget.value === 'published bot' ? 'published bot' : 'prebuilt bot' }),
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
              checked={type !== 'published bot'}
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
            Published bot
          </label>
        </dd>
        <label>
          <dt>Hostname suffix</dt>
          <dd>
            <input onChange={handleHostnameSuffixChange} type="text" value={hostnameSuffix || ''} />
          </dd>
        </label>
        <label>
          <dt>Environment ID</dt>
          <dd>
            <input onChange={handleEnvironmentIDChange} required type="text" value={environmentID || ''} />
          </dd>
        </label>
        {type === 'published bot' ? (
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
      </dl>
      <button autoFocus={autoFocus} type="submit">
        Create Web Chat
      </button>{' '}
      <DoubleTapButton onClick={handleResetButtonClick}>Double tap to clear</DoubleTapButton>
    </form>
  );
});
