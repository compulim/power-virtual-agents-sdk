import type { ConnectionStatus } from 'botframework-directlinejs';

import type { TurnGenerator } from '../../createHalfDuplexChatAdapter';
import DeferredQueue from '../../private/DeferredQueue';
import type { JestMockOf } from '../../private/types/JestMockOf';
import toDirectLineJS from '../../toDirectLineJS';
import type { Activity } from '../../types/Activity';
import type { DirectLineJSBotConnection } from '../../types/DirectLineJSBotConnection';

const END_TURN = Symbol('END_TURN');

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(jest.fn());
  jest.spyOn(console, 'warn').mockImplementation(jest.fn());
});

describe('with a TurnGenerator', () => {
  let activityObserver: JestMockOf<(activity: Activity) => void>;
  let connectionStatusObserver: JestMockOf<(connectionStatus: ConnectionStatus) => void>;
  let directLineJS: DirectLineJSBotConnection;
  let incomingActivityQueue: DeferredQueue<Activity | typeof END_TURN>;
  let nextTurn: JestMockOf<(activity?: Activity | undefined) => TurnGenerator>;
  let turnGenerator: TurnGenerator;

  beforeEach(() => {
    incomingActivityQueue = new DeferredQueue();

    nextTurn = jest.fn<TurnGenerator, [Activity | undefined]>(() => {
      return (async function* () {
        for (;;) {
          const activity = await incomingActivityQueue.promise;

          if (activity === END_TURN) {
            break;
          } else {
            yield activity;
          }
        }

        return nextTurn;
      })();
    });

    turnGenerator = nextTurn();

    activityObserver = jest.fn();
    connectionStatusObserver = jest.fn();

    directLineJS = toDirectLineJS(turnGenerator);
    directLineJS.connectionStatus$.subscribe(connectionStatusObserver);

    directLineJS.activity$.subscribe(activityObserver);
  });

  describe('when failed to receive first activity', () => {
    beforeEach(() => incomingActivityQueue.reject(new Error('artificial')));

    describe('should call the connection status observer', () => {
      test('3 times', () => expect(connectionStatusObserver).toHaveBeenCalledTimes(3));
      test('with "Uninitialized"', () => expect(connectionStatusObserver).toHaveBeenNthCalledWith(1, 0));
      test('with "Connecting"', () => expect(connectionStatusObserver).toHaveBeenNthCalledWith(2, 1));
      test('with "FailedToConnect"', () => expect(connectionStatusObserver).toHaveBeenNthCalledWith(3, 4));
    });
  });

  describe('when failed to receive second activity', () => {
    beforeEach(async () => {
      incomingActivityQueue.push({ from: { id: 'bot' }, text: 'Hello, World!', type: 'message' });
      incomingActivityQueue.reject(new Error('artificial'));
    });

    describe('should call the activity observer', () => {
      test('once', () => expect(activityObserver).toHaveBeenCalledTimes(1));
    });

    describe('should call the connection status observer', () => {
      test('4 times', () => expect(connectionStatusObserver).toHaveBeenCalledTimes(4));
      test('with "Uninitialized"', () => expect(connectionStatusObserver).toHaveBeenNthCalledWith(1, 0));
      test('with "Connecting"', () => expect(connectionStatusObserver).toHaveBeenNthCalledWith(2, 1));
      test('with "Online"', () => expect(connectionStatusObserver).toHaveBeenNthCalledWith(3, 2));
      test('with "FailedToConnect"', () => expect(connectionStatusObserver).toHaveBeenNthCalledWith(4, 4));
    });
  });
});
