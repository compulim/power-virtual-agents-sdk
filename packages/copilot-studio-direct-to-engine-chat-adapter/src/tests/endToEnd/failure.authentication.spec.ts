import type { ConnectionStatus } from 'botframework-directlinejs';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';

import createHalfDuplexChatAdapter from '../../createHalfDuplexChatAdapter';
import DeferredQueue from '../../private/DeferredQueue';
import type { DefaultHttpResponseResolver } from '../../private/types/DefaultHttpResponseResolver';
import type { JestMockOf } from '../../private/types/JestMockOf';
import toDirectLineJS from '../../toDirectLineJS';
import type { Activity } from '../../types/Activity';
import type { DirectLineJSBotConnection } from '../../types/DirectLineJSBotConnection';
import type { Strategy } from '../../types/Strategy';

const server = setupServer();

const NOT_MOCKED: DefaultHttpResponseResolver = () => {
  throw new Error('This function is not mocked.');
};

jest.spyOn(console, 'error').mockImplementation(jest.fn());
jest.spyOn(console, 'warn').mockImplementation(jest.fn());

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

  describe.each([true, false])('with emitStartConversationEvent of %s', emitStartConversationEvent => {
    let directLineJS: DirectLineJSBotConnection;
    let httpPostConversation: JestMockOf<DefaultHttpResponseResolver>;

    beforeEach(() => {
      httpPostConversation = jest.fn(NOT_MOCKED);

      server.use(http.post('http://test/conversations', httpPostConversation));

      const chatAdapter = createHalfDuplexChatAdapter(strategy, {
        emitStartConversationEvent,
        locale: 'ja-JP',
        retry: { factor: 1, minTimeout: 0 }
      });

      directLineJS = toDirectLineJS(chatAdapter);
    });

    test('should not POST to /conversations', () => expect(httpPostConversation).toHaveBeenCalledTimes(0));

    describe('when subscribe', () => {
      let activityObserver: JestMockOf<(activity: Activity) => void>;
      let connectionStatusObserver: JestMockOf<(connectionStatus: ConnectionStatus) => void>;
      let connectionStatusQueue: DeferredQueue<ConnectionStatus>;

      beforeEach(() => {
        httpPostConversation.mockImplementationOnce(() => new HttpResponse(undefined, { status: 403 }));

        connectionStatusQueue = new DeferredQueue();

        activityObserver = jest.fn();
        connectionStatusObserver = jest.fn(connectionStatusQueue.push.bind(connectionStatusQueue));

        directLineJS.connectionStatus$.subscribe(connectionStatusObserver);
        directLineJS.activity$.subscribe(activityObserver);
      });

      describe('wait until 3 connection statuses are observed', () => {
        beforeEach(async () => {
          await connectionStatusQueue.promise;
          await connectionStatusQueue.promise;
          await connectionStatusQueue.promise;
        });

        describe('should call connection status observer', () => {
          test('3 times', () => expect(connectionStatusObserver).toHaveBeenCalledTimes(3));
          test('with "Uninitialized"', () => expect(connectionStatusObserver).toHaveBeenNthCalledWith(1, 0));
          test('with "Connecting"', () => expect(connectionStatusObserver).toHaveBeenNthCalledWith(2, 1));
          test('with "FailedToConnect"', () => expect(connectionStatusObserver).toHaveBeenNthCalledWith(3, 4));
        });
      });
    });
  });
});
