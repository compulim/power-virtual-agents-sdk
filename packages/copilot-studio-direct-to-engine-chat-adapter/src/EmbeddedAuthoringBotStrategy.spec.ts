import EmbeddedAuthoringBotStrategy from './EmbeddedAuthoringBotStrategy';
import type { StrategyRequestInit } from './types/Strategy';

describe.each([['with deltaToken' as const], ['without deltaToken' as const]])('%s', variant => {
  let getDeltaToken: jest.Mock<Promise<string>, []> | undefined;
  let getToken: jest.Mock<Promise<string>, []>;
  let strategy: EmbeddedAuthoringBotStrategy;

  beforeEach(() => {
    getDeltaToken = variant === 'with deltaToken' ? jest.fn(() => Promise.resolve('delta token')) : undefined;
    getToken = jest.fn(() => Promise.resolve('token'));

    strategy = new EmbeddedAuthoringBotStrategy({
      baseURL: new URL('https://aka.ms/something'),
      botSchema: 'bot-schema',
      getDeltaToken,
      getToken
    });
  });

  describe('when prepareStartNewConversation() is called', () => {
    let request: StrategyRequestInit;

    beforeEach(async () => {
      request = await strategy.prepareStartNewConversation();
    });

    test('request should set baseURL properly', () =>
      expect(request).toHaveProperty(
        'baseURL.href',
        'https://aka.ms/copilotstudio/embedded-authoring/authenticated/bots/bot-schema/?api-version=1'
      ));

    test('request should set headers properly', () =>
      expect(Array.from(request.headers?.entries() || [])).toEqual([['authorization', 'Bearer token']]));

    if (variant === 'with deltaToken') {
      test('request should set body properly', () =>
        expect(request).toHaveProperty('body', { deltaToken: 'delta token' }));
    } else {
      test('request should not set body', () => expect(request).toHaveProperty('body', undefined));
    }

    if (variant === 'with deltaToken') {
      test('getDeltaToken should have been called once', () => expect(getDeltaToken).toHaveBeenCalledTimes(1));
    }

    test('getToken should have been called once', () => expect(getToken).toHaveBeenCalledTimes(1));
  });

  describe('when prepareExecuteTurn() is called', () => {
    let request: StrategyRequestInit;

    beforeEach(async () => {
      request = await strategy.prepareExecuteTurn();
    });

    test('request should set baseURL properly', () =>
      expect(request).toHaveProperty(
        'baseURL.href',
        'https://aka.ms/copilotstudio/embedded-authoring/authenticated/bots/bot-schema/execute?api-version=1'
      ));

    test('request should set headers properly', () =>
      expect(Array.from(request.headers?.entries() || [])).toEqual([['authorization', 'Bearer token']]));

    if (variant === 'with deltaToken') {
      test('request should set body properly', () =>
        expect(request).toHaveProperty('body', { deltaToken: 'delta token' }));
    } else {
      test('request should not set body', () => expect(request).toHaveProperty('body', undefined));
    }

    if (variant === 'with deltaToken') {
      test('getDeltaToken should have been called once', () => expect(getDeltaToken).toHaveBeenCalledTimes(1));
    }

    test('getToken should have been called once', () => expect(getToken).toHaveBeenCalledTimes(1));
  });
});
