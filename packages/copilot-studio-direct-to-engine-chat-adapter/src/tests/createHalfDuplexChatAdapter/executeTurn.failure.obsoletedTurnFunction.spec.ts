import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';

import createHalfDuplexChatAdapter, {
  type ExecuteTurnFunction,
  type TurnGenerator
} from '../../createHalfDuplexChatAdapter';
import asyncGeneratorToArray from '../../private/asyncGeneratorToArray';
import type { BotResponse } from '../../private/types/BotResponse';
import { parseConversationId } from '../../private/types/ConversationId';
import type { DefaultHttpResponseResolver } from '../../private/types/DefaultHttpResponseResolver';
import type { JestMockOf } from '../../private/types/JestMockOf';
import type { Activity } from '../../types/Activity';
import type { Strategy } from '../../types/Strategy';

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
    let generator: TurnGenerator;
    let httpPostConversation: JestMockOf<DefaultHttpResponseResolver>;
    let httpPostExecute: JestMockOf<DefaultHttpResponseResolver>;

    beforeEach(() => {
      httpPostConversation = jest.fn(NOT_MOCKED);
      httpPostExecute = jest.fn(NOT_MOCKED);

      server.use(http.post('http://test/conversations', httpPostConversation));
      server.use(http.post('http://test/conversations/c-00001', httpPostExecute));

      generator = createHalfDuplexChatAdapter(strategy, {
        emitStartConversationEvent,
        retry: { factor: 1, minTimeout: 0 }
      });
    });

    describe('When conversation started and first turn completed', () => {
      let activities: Activity[];
      let executeTurn: ExecuteTurnFunction;

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

        [activities, executeTurn] = await asyncGeneratorToArray(generator);
      });

      test('should receive greeting activities', () =>
        expect(activities).toEqual([{ from: { id: 'bot' }, text: 'Hello, World!', type: 'message' }]));

      describe('when execute turn', () => {
        let generator: TurnGenerator;

        beforeEach(() => {
          generator = executeTurn({
            from: { id: 'u-00001' },
            text: 'Aloha!',
            type: 'message'
          });
        });

        describe('when iterate', () => {
          let activities: Activity[];

          beforeEach(async () => {
            if (transport === 'auto') {
              httpPostExecute.mockImplementationOnce(
                () =>
                  new HttpResponse(
                    Buffer.from(`event: activity
data: { "from": { "id": "bot" }, "text": "Aloha!", "type": "message" }

event: end
data: end

`),
                    { headers: { 'content-type': 'text/event-stream' } }
                  )
              );
            } else if (transport === 'rest') {
              httpPostExecute.mockImplementationOnce(() =>
                HttpResponse.json({
                  action: 'waiting',
                  activities: [{ from: { id: 'bot' }, text: 'Aloha!', type: 'message' }],
                  conversationId: parseConversationId('c-00001')
                } satisfies BotResponse)
              );
            }

            [activities] = await asyncGeneratorToArray(generator);
          });

          test('should receive activities', () =>
            expect(activities).toEqual([{ from: { id: 'bot' }, text: 'Aloha!', type: 'message' }]));

          describe('when calling previous executeTurn function', () => {
            let errorThrown: unknown;

            beforeEach(async () => {
              try {
                executeTurn({
                  from: { id: 'u-00001' },
                  text: 'Morning.',
                  type: 'message'
                });
              } catch (error) {
                errorThrown = error;
              }
            });

            test('should throw', () =>
              expect(() => {
                if (errorThrown) {
                  throw errorThrown;
                }
              }).toThrow('This executeTurn() function is obsoleted. Please use a new one.'));
          });
        });
      });
    });
  });
});
