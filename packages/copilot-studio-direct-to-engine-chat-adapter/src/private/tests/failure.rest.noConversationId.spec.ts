import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';

import type { Activity } from '../../types/Activity';
import type { Strategy } from '../../types/Strategy';
import DirectToEngineServerSentEventsChatAdapterAPI from '../DirectToEngineServerSentEventsChatAdapterAPI';
import type { BotResponse } from '../types/BotResponse';
import type { DefaultHttpResponseResolver } from '../types/DefaultHttpResponseResolver';
import type { JestMockOf } from '../types/JestMockOf';

const server = setupServer();

const NOT_MOCKED: DefaultHttpResponseResolver = () => {
  throw new Error('This function is not mocked.');
};

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

let strategy: Strategy;

beforeEach(() => {
  strategy = {
    async prepareExecuteTurn() {
      return Promise.resolve({
        baseURL: new URL('http://test/?api=execute#2'),
        body: { dummy: 'dummy' },
        headers: new Headers({ 'x-dummy': 'dummy' }),
        transport: 'rest'
      });
    },
    async prepareStartNewConversation() {
      return Promise.resolve({
        baseURL: new URL('http://test/?api=start#1'),
        body: { dummy: 'dummy' },
        headers: new Headers({ 'x-dummy': 'dummy' }),
        transport: 'rest'
      });
    }
  };
});

describe.each([true, false])('With emitStartConversationEvent of %s', emitStartConversationEvent => {
  let adapter: DirectToEngineServerSentEventsChatAdapterAPI;
  let httpPostContinue: JestMockOf<DefaultHttpResponseResolver>;
  let httpPostConversation: JestMockOf<DefaultHttpResponseResolver>;
  let httpPostExecute: JestMockOf<DefaultHttpResponseResolver>;

  beforeEach(() => {
    httpPostContinue = jest.fn(NOT_MOCKED);
    httpPostConversation = jest.fn(NOT_MOCKED);
    httpPostExecute = jest.fn(NOT_MOCKED);

    server.use(http.post('http://test/conversations', httpPostConversation));
    server.use(http.post('http://test/conversations/c-00001', httpPostExecute));
    server.use(http.post('http://test/conversations/c-00001/continue', httpPostContinue));

    adapter = new DirectToEngineServerSentEventsChatAdapterAPI(strategy, { retry: { factor: 1, minTimeout: 0 } });
  });

  describe('When conversation started and bot returned with 1 activity over SSE', () => {
    let startNewConversationResult: ReturnType<DirectToEngineServerSentEventsChatAdapterAPI['startNewConversation']>;

    beforeEach(() => {
      startNewConversationResult = adapter.startNewConversation({ emitStartConversationEvent });
    });

    describe('after iterate once', () => {
      let iteratorResultPromise: Promise<IteratorResult<Activity>>;

      beforeEach(async () => {
        httpPostConversation.mockImplementationOnce(() =>
          HttpResponse.json({
            action: 'waiting',
            activities: [{ from: { id: 'bot' }, text: 'Aloha!', type: 'message' }]
          } satisfies BotResponse)
        );

        iteratorResultPromise = startNewConversationResult.next();
        iteratorResultPromise.catch(() => {});
      });

      describe('should have POST to /conversations', () => {
        test('once', () => expect(httpPostConversation).toHaveBeenCalledTimes(1));
        test('with header "Accept" of "application/json"', () =>
          expect(httpPostConversation.mock.calls[0][0].request.headers.get('accept')).toBe('application/json'));
      });

      test('should throw "no conversation ID" error', () =>
        expect(iteratorResultPromise).rejects.toThrow('must have "conversationId"'));
    });
  });
});
