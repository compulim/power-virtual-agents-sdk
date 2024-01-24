import { useCallback, useMemo, useReducer } from 'react';

import { type BotType } from '../types/BotType';
import onErrorResumeNext from '../util/onErrorResumeNext';

type State = {
  botIdentifier: string;
  botSchema: string;
  environmentID: string;
  hostnameSuffix: string;
  islandURI?: string;
  tenantID?: string;
  token: string;
  type: BotType;
};

type ResetAction = { type: 'RESET' };
type SaveToSessionStorageAction = { type: 'SAVE_TO_SESSION_STORAGE' };
type SetBotIdentifierAction = { payload: string; type: 'SET_BOT_IDENTIFIER' };
type SetBotSchemaAction = { payload: string; type: 'SET_BOT_SCHEMA' };
type SetEnvironmentIDAction = { payload: string; type: 'SET_ENVIRONMENT_ID' };
type SetIslandURIAction = { payload: string; type: 'SET_ISLAND_URI' };
type SetHostnameSuffixAction = { payload: string; type: 'SET_HOSTNAME_SUFFIX' };
type SetTokenAction = { payload: string; type: 'SET_TOKEN' };
type SetTypeAction = { payload: BotType; type: 'SET_TYPE' };

type Action =
  | ResetAction
  | SaveToSessionStorageAction
  | SetBotIdentifierAction
  | SetBotSchemaAction
  | SetEnvironmentIDAction
  | SetHostnameSuffixAction
  | SetIslandURIAction
  | SetTokenAction
  | SetTypeAction;

type DispatchAction = {
  reset: () => void;
  saveToSessionStorage: () => void;
  setBotIdentifier: (botIdentifier: string) => void;
  setBotSchema: (botSchema: string) => void;
  setEnvironmentID: (environmentID: string) => void;
  setHostnameSuffix: (hostnameSuffix: string) => void;
  setIslandURI: (islandURI: string) => void;
  setToken: (token: string) => void;
  setType: (type: BotType) => void;
};

const DEFAULT_STATE: State = {
  botIdentifier: '',
  botSchema: '',
  environmentID: '',
  hostnameSuffix: 'api.powerplatform.com',
  islandURI: 'https://pvaruntime.us-il102.gateway.prod.island.powerapps.com',
  token: '',
  type: 'prebuilt bot'
};

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
    } else if (action.type === 'SET_ENVIRONMENT_ID') {
      if (state.environmentID !== action.payload) {
        state = { ...state, environmentID: action.payload };
      }
    } else if (action.type === 'SET_HOSTNAME_SUFFIX') {
      if (state.hostnameSuffix !== action.payload) {
        state = { ...state, hostnameSuffix: action.payload };
      }
    } else if (action.type === 'SET_ISLAND_URI') {
      if (state.islandURI !== action.payload) {
        state = { ...state, islandURI: action.payload };
      }
    } else if (action.type === 'SET_TOKEN') {
      if (state.token !== action.payload) {
        state = { ...state, token: action.payload };
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
        setEnvironmentID,
        setHostnameSuffix,
        setIslandURI,
        setToken,
        setType
      }),
    [setBotIdentifier, setBotSchema, setEnvironmentID, setHostnameSuffix, setToken, setType]
  );

  return Object.freeze([state, dispatchActions]);
}
