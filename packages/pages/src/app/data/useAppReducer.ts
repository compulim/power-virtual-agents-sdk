import { useCallback, useMemo, useReducer } from 'react';

import { type BotType } from '../types/BotType';
import { type Transport } from '../types/Transport';
import onErrorResumeNext from '../util/onErrorResumeNext';

type State = {
  botIdentifier: string;
  botSchema: string;
  deltaToken: string;
  emitStartConversationEvent: boolean;
  environmentID: string;
  hostnameSuffix: string;
  islandURI?: string;
  tenantID?: string;
  token: string;
  transport?: Transport;
  type: BotType;
};

type ResetAction = { type: 'RESET' };
type SaveToSessionStorageAction = { type: 'SAVE_TO_SESSION_STORAGE' };
type SetBotIdentifierAction = { payload: string; type: 'SET_BOT_IDENTIFIER' };
type SetBotSchemaAction = { payload: string; type: 'SET_BOT_SCHEMA' };
type SetDeltaTokenAction = { payload: string; type: 'SET_DELTA_TOKEN' };
type SetEnvironmentIDAction = { payload: string; type: 'SET_ENVIRONMENT_ID' };
type SetEmitStartConversationEventAction = { payload: boolean; type: 'SET_EMIT_START_CONVERSATION_EVENT' };
type SetHostnameSuffixAction = { payload: string; type: 'SET_HOSTNAME_SUFFIX' };
type SetIslandURIAction = { payload: string; type: 'SET_ISLAND_URI' };
type SetTokenAction = { payload: string; type: 'SET_TOKEN' };
type SetTransportAction = { payload: Transport; type: 'SET_TRANSPORT' };
type SetTypeAction = { payload: BotType; type: 'SET_TYPE' };

type Action =
  | ResetAction
  | SaveToSessionStorageAction
  | SetBotIdentifierAction
  | SetBotSchemaAction
  | SetDeltaTokenAction
  | SetEmitStartConversationEventAction
  | SetEnvironmentIDAction
  | SetHostnameSuffixAction
  | SetIslandURIAction
  | SetTokenAction
  | SetTransportAction
  | SetTypeAction;

type DispatchAction = {
  reset: () => void;
  saveToSessionStorage: () => void;
  setBotIdentifier: (botIdentifier: string) => void;
  setBotSchema: (botSchema: string) => void;
  setDeltaToken: (deltaToken: string) => void;
  setEmitStartConversationEvent: (emitStartConversationEvent: boolean) => void;
  setEnvironmentID: (environmentID: string) => void;
  setHostnameSuffix: (hostnameSuffix: string) => void;
  setIslandURI: (islandURI: string) => void;
  setToken: (token: string) => void;
  setTransport: (transport: Transport) => void;
  setType: (type: BotType) => void;
};

const DEFAULT_STATE: State = {
  botIdentifier: '',
  botSchema: '',
  deltaToken: '',
  emitStartConversationEvent: true,
  environmentID: '',
  hostnameSuffix: 'api.powerplatform.com',
  islandURI: 'https://pvaruntime.us-il102.gateway.prod.island.powerapps.com',
  token: '',
  transport: 'auto',
  type: 'prebuilt bot'
};

import { pathToRegexp } from 'path-to-regexp';

const TEST_CANVAS_REG_EXP = pathToRegexp('/environments/:environmentId/bots/:botId/test/conversations');

export default function useAppReducer(): readonly [State, Readonly<DispatchAction>] {
  const reducer = useCallback((state: State, action: Action) => {
    if (action.type === 'RESET') {
      state = DEFAULT_STATE;
    } else if (action.type === 'SAVE_TO_SESSION_STORAGE') {
      onErrorResumeNext(() => sessionStorage?.setItem('app:state', JSON.stringify(state)));
    } else if (action.type === 'SET_BOT_IDENTIFIER') {
      if (state.botIdentifier !== action.payload) {
        state = { ...state, botIdentifier: action.payload };
      }
    } else if (action.type === 'SET_BOT_SCHEMA') {
      if (state.botSchema !== action.payload) {
        state = { ...state, botSchema: action.payload };
      }
    } else if (action.type === 'SET_DELTA_TOKEN') {
      if (state.deltaToken !== action.payload) {
        state = { ...state, deltaToken: action.payload.replace(/^"|"$/gu, '') };
      }
    } else if (action.type === 'SET_EMIT_START_CONVERSATION_EVENT') {
      if (state.emitStartConversationEvent !== action.payload) {
        state = { ...state, emitStartConversationEvent: action.payload };
      }
    } else if (action.type === 'SET_ENVIRONMENT_ID') {
      if (state.environmentID !== action.payload) {
        state = { ...state, environmentID: action.payload };
      }
    } else if (action.type === 'SET_HOSTNAME_SUFFIX') {
      if (state.hostnameSuffix !== action.payload) {
        state = { ...state, hostnameSuffix: action.payload };
      }
    } else if (action.type === 'SET_ISLAND_URI') {
      const { payload } = action;

      if (state.islandURI !== payload) {
        state = { ...state, islandURI: payload };

        if (state.type === 'test canvas bot') {
          try {
            const url = new URL(payload);
            const match = TEST_CANVAS_REG_EXP.exec(url.pathname);

            if (match) {
              state = {
                ...state,
                botIdentifier: match[2],
                environmentID: match[1],
                islandURI: `${url.protocol}//${url.host}`
              };
            }
          } catch {
            // Intentionally left blank.
          }
        }
      }
    } else if (action.type === 'SET_TOKEN') {
      let { payload } = action;

      if (payload.startsWith('Bearer ')) {
        payload = payload.slice(7);
      }

      if (state.token !== payload) {
        state = { ...state, token: payload };
      }
    } else if (action.type === 'SET_TRANSPORT') {
      if (state.token !== action.payload) {
        state = { ...state, transport: action.payload };
      }
    } else if (action.type === 'SET_TYPE') {
      state = {
        ...state,
        type:
          action.payload === 'published bot' || action.payload === 'test canvas bot' ? action.payload : 'prebuilt bot'
      };
    }

    return state;
  }, []);

  const [state, dispatch] = useReducer(reducer, {
    ...DEFAULT_STATE,
    ...onErrorResumeNext(() => JSON.parse(sessionStorage?.getItem('app:state') || '{}'), {})
  });

  const reset = useCallback(() => dispatch({ type: 'RESET' }), [dispatch]);

  const saveToSessionStorage = useCallback(() => dispatch({ type: 'SAVE_TO_SESSION_STORAGE' }), [dispatch]);

  const setBotIdentifier = useCallback(
    (botIdentifier: string) => dispatch({ payload: botIdentifier, type: 'SET_BOT_IDENTIFIER' }),
    [dispatch]
  );

  const setBotSchema = useCallback(
    (botSchema: string) => dispatch({ payload: botSchema, type: 'SET_BOT_SCHEMA' }),
    [dispatch]
  );

  const setDeltaToken = useCallback(
    (deltaToken: string) => dispatch({ payload: deltaToken, type: 'SET_DELTA_TOKEN' }),
    [dispatch]
  );

  const setEmitStartConversationEvent = useCallback(
    (emitStartConversationEvent: boolean) =>
      dispatch({ payload: emitStartConversationEvent, type: 'SET_EMIT_START_CONVERSATION_EVENT' }),
    [dispatch]
  );

  const setEnvironmentID = useCallback(
    (environmentID: string) => dispatch({ payload: environmentID, type: 'SET_ENVIRONMENT_ID' }),
    [dispatch]
  );

  const setHostnameSuffix = useCallback(
    (hostnameSuffix: string) => dispatch({ payload: hostnameSuffix, type: 'SET_HOSTNAME_SUFFIX' }),
    [dispatch]
  );

  const setIslandURI = useCallback(
    (islandURI: string) => dispatch({ payload: islandURI, type: 'SET_ISLAND_URI' }),
    [dispatch]
  );

  const setToken = useCallback((token: string) => dispatch({ payload: token, type: 'SET_TOKEN' }), [dispatch]);

  const setTransport = useCallback(
    (transport: Transport) => dispatch({ payload: transport, type: 'SET_TRANSPORT' }),
    [dispatch]
  );

  const setType = useCallback(
    (type: BotType) =>
      dispatch({
        payload: type === 'published bot' || type === 'test canvas bot' ? type : 'prebuilt bot',
        type: 'SET_TYPE'
      }),
    [dispatch]
  );

  const dispatchActions = useMemo(
    () =>
      Object.freeze({
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
      }),
    [
      setBotIdentifier,
      setBotSchema,
      setDeltaToken,
      setEmitStartConversationEvent,
      setEnvironmentID,
      setHostnameSuffix,
      setToken,
      setTransport,
      setType
    ]
  );

  return Object.freeze([state, dispatchActions]);
}
