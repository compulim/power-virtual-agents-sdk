import { setupServer } from 'msw/node';

import type { Strategy } from '../../../types/Strategy';
import DirectToEngineChatAdapterAPI from '../../DirectToEngineChatAdapterAPI';

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('When call executeTurn before start new conversation', () => {
  let adapter: DirectToEngineChatAdapterAPI;
  let executeTurnResult: ReturnType<DirectToEngineChatAdapterAPI['executeTurn']>;

  beforeEach(() => {
    const strategy: Strategy = {
      async prepareExecuteTurn() {
        return Promise.resolve({ baseURL: new URL('http://test/?api=execute#2') });
      },
      async prepareStartNewConversation() {
        return Promise.resolve({ baseURL: new URL('http://test/?api=start#1') });
      }
    };

    adapter = new DirectToEngineChatAdapterAPI(strategy, { retry: { factor: 1, minTimeout: 0 } });
    executeTurnResult = adapter.executeTurn({
      from: { id: 'u-00001', role: 'user' },
      text: 'Hello, World!',
      type: 'message'
    });
  });

  describe('when iterate', () => {
    let iteratePromise: Promise<unknown>;

    beforeEach(async () => {
      iteratePromise = executeTurnResult.next();

      await iteratePromise.catch(() => {});
    });

    test('should reject', () =>
      expect(iteratePromise).rejects.toThrow('startNewConversation() must be called before executeTurn().'));
  });
});
