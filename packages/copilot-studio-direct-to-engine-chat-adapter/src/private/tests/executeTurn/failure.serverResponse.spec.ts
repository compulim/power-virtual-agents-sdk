import { asyncIteratorToArray } from 'iter-fest';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';

import type { Activity } from '../../../types/Activity';
import type { Strategy } from '../../../types/Strategy';
import DirectToEngineChatAdapterAPI from '../../DirectToEngineChatAdapterAPI';
import type { BotResponse } from '../../types/BotResponse';
import { parseConversationId } from '../../types/ConversationId';
import type { DefaultHttpResponseResolver } from '../../types/DefaultHttpResponseResolver';
import type { JestMockOf } from '../../types/JestMockOf';

const server = setupServer();

const NOT_MOCKED: DefaultHttpResponseResolver = () => {
  throw new Error('This function is not mocked.');
};

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe.each(['auto' as const, 'rest' as const])('Using "%s" transport', transport => {
  let strategy: Strategy;

  beforeEach(() => {
    strategy = {
      async prepareExecuteTurn() {
        return Promise.resolve({
          baseURL: new URL('http://test/?api=execute#2'),
          body: { dummy: 'dummy' },
          headers: new Headers({ 'x-dummy': 'dummy' }),
          transport
        });
      },
      async prepareStartNewConversation() {
        return Promise.resolve({
          baseURL: new URL('http://test/?api=start#1'),
          body: { dummy: 'dummy' },
          headers: new Headers({ 'x-dummy': 'dummy' }),
          transport
        });
      }
    };
  });

  describe.each([true, false])('With emitStartConversationEvent of %s', emitStartConversationEvent => {
    let adapter: DirectToEngineChatAdapterAPI;
    let httpPostConversation: JestMockOf<DefaultHttpResponseResolver>;
    let httpPostExecute: JestMockOf<DefaultHttpResponseResolver>;

    beforeEach(() => {
      httpPostConversation = jest.fn(NOT_MOCKED);
      httpPostExecute = jest.fn(NOT_MOCKED);

      server.use(http.post('http://test/conversations', httpPostConversation));
      server.use(http.post('http://test/conversations/c-00001', httpPostExecute));

      adapter = new DirectToEngineChatAdapterAPI(strategy, { retry: { factor: 1, minTimeout: 0 } });
    });

    describe('When conversation started and first turn completed', () => {
      let activities: Activity[];

      beforeEach(async () => {
        if (transport === 'auto') {
          httpPostConversation.mockImplementationOnce(
            () =>
              new HttpResponse(
                Buffer.from(`event: activity
data: { "from": { "id": "bot" }, "text": "Hello, World!", "type": "message" }

event: end
data: end

`),
                { headers: { 'content-type': 'text/event-stream', 'x-ms-conversationid': 'c-00001' } }
              )
          );
        } else if (transport === 'rest') {
          httpPostConversation.mockImplementationOnce(() =>
            HttpResponse.json({
              action: 'waiting',
              activities: [{ from: { id: 'bot' }, text: 'Hello, World!', type: 'message' }],
              conversationId: parseConversationId('c-00001')
            } satisfies BotResponse)
          );
        }

        const startNewConversationResult = adapter.startNewConversation({ emitStartConversationEvent });

        activities = await asyncIteratorToArray(startNewConversationResult);
      });

      test('should receive greeting activities', () =>
        expect(activities).toEqual([{ from: { id: 'bot' }, text: 'Hello, World!', type: 'message' }]));

      describe.each([
        ['server closed connection', HttpResponse.error(), { expectedNumCalled: 5 }],
        ['server returned 400', new HttpResponse(undefined, { status: 400 }), { expectedNumCalled: 1 }],
        ['server returned 500', new HttpResponse(undefined, { status: 500 }), { expectedNumCalled: 5 }]
      ])('when execute turn and %s', (_, response, { expectedNumCalled }) => {
        let executeTurnResult: ReturnType<DirectToEngineChatAdapterAPI['executeTurn']>;

        beforeEach(() => {
          executeTurnResult = adapter.executeTurn({
            from: { id: 'u-00001' },
            text: 'Aloha!',
            type: 'message'
          });
        });

        describe('when iterate', () => {
          let iteratePromise: Promise<unknown>;

          beforeEach(async () => {
            httpPostExecute.mockImplementation(() => response);

            iteratePromise = executeTurnResult.next();

            await iteratePromise.catch(() => {});
          });

          test(`should have POST to /conversations ${
            expectedNumCalled === 1 ? 'once' : `${expectedNumCalled} times`
          }`, () => expect(httpPostExecute).toHaveBeenCalledTimes(expectedNumCalled));

          test('should reject', () => expect(iteratePromise).rejects.toThrow());
        });
      });
    });
  });
});
