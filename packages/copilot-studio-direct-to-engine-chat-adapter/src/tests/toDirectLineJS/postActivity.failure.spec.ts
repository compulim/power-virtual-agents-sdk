import { type ConnectionStatus } from 'botframework-directlinejs';

import { type TurnGenerator } from '../../createHalfDuplexChatAdapter';
import DeferredQueue from '../../private/DeferredQueue';
import { type JestMockOf } from '../../private/types/JestMockOf';
import toDirectLineJS from '../../toDirectLineJS';
import { type Activity } from '../../types/Activity';
import { type DirectLineJSBotConnection } from '../../types/DirectLineJSBotConnection';

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
  let turnGenerator: TurnGenerator;
  let nextTurn: JestMockOf<(activity?: Activity | undefined) => TurnGenerator>;

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

  describe('when an activity arrive and end the turn', () => {
    beforeEach(() => {
      incomingActivityQueue.push({ from: { id: 'bot' }, text: 'Hello, World!', type: 'message' });
      incomingActivityQueue.push(END_TURN);
    });

    test('should call the activity observer', () => expect(activityObserver).toHaveBeenCalledTimes(1));

    describe('when post activity', () => {
      let postActivityObserver: JestMockOf<(id: string) => void>;

      beforeEach(() => {
        postActivityObserver = jest.fn();

        directLineJS
          .postActivity({
            from: { id: 'u-00001' },
            text: 'Aloha!',
            type: 'message'
          })
          .subscribe(postActivityObserver);
      });

      describe('when failed to receive activity', () => {
        beforeEach(() => incomingActivityQueue.reject(new Error('artificial')));

        test('should not call the post activity observer', () => expect(postActivityObserver).toHaveBeenCalledTimes(0));

        describe('should call the connection status observer', () => {
          test('once', () => expect(connectionStatusObserver).toHaveBeenCalledTimes(4));
          test('with "Uninitialized"', () => expect(connectionStatusObserver).toHaveBeenNthCalledWith(1, 0));
          test('with "Connecting"', () => expect(connectionStatusObserver).toHaveBeenNthCalledWith(2, 1));
          test('with "Online"', () => expect(connectionStatusObserver).toHaveBeenNthCalledWith(3, 2));
          test('with "FailedToConnect"', () => expect(connectionStatusObserver).toHaveBeenNthCalledWith(4, 4));
        });
      });
    });
  });
});
