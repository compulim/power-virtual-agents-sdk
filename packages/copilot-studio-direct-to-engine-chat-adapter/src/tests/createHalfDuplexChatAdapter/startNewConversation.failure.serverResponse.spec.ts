import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';

import createHalfDuplexChatAdapter, { type TurnGenerator } from '../../createHalfDuplexChatAdapter';
import type { DefaultHttpResponseResolver } from '../../private/types/DefaultHttpResponseResolver';
import type { JestMockOf } from '../../private/types/JestMockOf';
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
    describe.each([
      ['server closed connection', HttpResponse.error(), { expectedNumCalled: 5 }],
      ['server returned 400', new HttpResponse(undefined, { status: 400 }), { expectedNumCalled: 1 }],
      ['server returned 500', new HttpResponse(undefined, { status: 500 }), { expectedNumCalled: 5 }]
    ])('when conversation started and %s', (_, response, { expectedNumCalled }) => {
      let generator: TurnGenerator;
      let httpPostConversations: JestMockOf<DefaultHttpResponseResolver>;

      beforeEach(() => {
        httpPostConversations = jest.fn(NOT_MOCKED);

        server.use(http.post('http://test/conversations', httpPostConversations));

        generator = createHalfDuplexChatAdapter(strategy, {
          emitStartConversationEvent,
          retry: { factor: 1, minTimeout: 0 }
        });
      });

      describe('when iterate', () => {
        let iteratePromise: Promise<unknown>;

        beforeEach(async () => {
          httpPostConversations.mockImplementation(() => response);

          iteratePromise = generator.next();

          await iteratePromise.catch(() => {});
        });

        test(`should have POST to /conversations ${
          expectedNumCalled === 1 ? 'once' : `${expectedNumCalled} times`
        }`, () => expect(httpPostConversations).toHaveBeenCalledTimes(expectedNumCalled));

        test('should reject', () => expect(iteratePromise).rejects.toThrow());
      });
    });
  });
});
