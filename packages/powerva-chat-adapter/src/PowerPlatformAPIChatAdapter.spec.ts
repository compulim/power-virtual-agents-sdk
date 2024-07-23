/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

// TODO: This test need to be expanded. It is currently testing very limited scope of the unit.

import noop from 'lodash/noop';

import PowerPlatformAPIChatAdapter from './PowerPlatformAPIChatAdapter';

import type { TurnBasedChatAdapterAPIStrategy } from './types/TurnBasedChatAdapterAPIStrategy';

// TODO: Add MockedFetch to globalThis.fetch, so we don't need to cast it every time we want to touch the mock.
type MockedFetch = jest.Mock<ReturnType<typeof fetch>, Parameters<typeof fetch>, typeof fetch>;

beforeEach(() => {
  // The option `advanceTimers` does not work with the `retry`/`p-retry` package.
  jest.useFakeTimers();
  jest.spyOn(globalThis, 'fetch');
});

afterEach(() => (globalThis.fetch as MockedFetch).mockRestore());

describe('client with telemetry', () => {
  let abortController: AbortController;
  let client: PowerPlatformAPIChatAdapter;
  let strategy: TurnBasedChatAdapterAPIStrategy;
  let telemetry: { trackException: jest.Mock<void, [unknown, Record<string, unknown>]> };

  beforeEach(() => {
    abortController = new AbortController();

    strategy = {
      prepareContinueTurn() {
        return Promise.resolve({
          baseURL: new URL(`https://dummy/abc/?api-version=1`),
          body: { test: 'dummy' },
          headers: { 'x-test': 'dummy' }
        });
      },
      prepareExecuteTurn() {
        return Promise.resolve({
          baseURL: new URL(`https://dummy/abc/?api-version=1`),
          body: { test: 'dummy' },
          headers: { 'x-test': 'dummy' }
        });
      },
      prepareStartNewConversation() {
        return Promise.resolve({
          baseURL: new URL(`https://dummy/abc/?api-version=1`),
          body: { test: 'dummy' },
          headers: { 'x-test': 'dummy' }
        });
      }
    };

    telemetry = {
      trackException: jest.fn()
    };

    client = new PowerPlatformAPIChatAdapter(strategy, { telemetry });
  });

  describe('when startNewConversation() is called', () => {
    beforeEach(() => {
      // TODO: [P0] This won't work on Node.js 20 because "fetch" is read only property.
      (globalThis.fetch as MockedFetch).mockImplementation(() => Promise.resolve(new Response('{}', { status: 200 })));

      client.startNewConversation(true, {
        correlationId: '1234',
        locale: 'zh-HAnt-HK',
        signal: abortController.signal
      });
    });

    test('fetch should be called once', () => expect(globalThis.fetch).toBeCalledTimes(1));
    test('fetch should be called with AbortSignal', () =>
      expect((globalThis.fetch as MockedFetch).mock.calls[0][1]).toHaveProperty('signal', abortController.signal));
    test('fetch should be called with URL', () =>
      expect((globalThis.fetch as MockedFetch).mock.calls[0][0]).toBe('https://dummy/abc/conversations?api-version=1'));
    test('fetch should be called with headers', () =>
      expect((globalThis.fetch as MockedFetch).mock.calls[0][1]).toHaveProperty(
        'headers',
        expect.objectContaining({
          'x-ms-correlationid': '1234',
          'x-test': 'dummy'
        })
      ));
    test('fetch should be called with body', () =>
      expect(JSON.parse((globalThis.fetch as MockedFetch).mock.calls[0][1]?.body as string)).toEqual({
        emitStartConversationEvent: true,
        locale: 'zh-HAnt-HK',
        test: 'dummy'
      }));
  });

  describe('when fetch always reject', () => {
    let promise: Promise<unknown>;

    beforeEach(async () => {
      (globalThis.fetch as MockedFetch).mockImplementation(() => Promise.reject(new Error('Artificial.')));

      promise = client.startNewConversation(true, {});
      promise.catch(noop); // No unhandled rejections.

      // We cannot auto-advance the fake timers.
      await jest.advanceTimersByTimeAsync(31_000);
    });

    test('startNewConversation() call should reject', () => expect(() => promise).rejects.toThrow('Artificial.'));

    describe('after startNewConversation() call rejected', () => {
      beforeEach(() => expect(() => promise).rejects.toThrow('Artificial.'));

      test('fetch should be called 5 times', () => expect(globalThis.fetch).toBeCalledTimes(5));
      test('should call trackException once', () => expect(telemetry.trackException).toBeCalledTimes(1));
      test('should call trackException with the error', () => {
        expect(telemetry.trackException).toHaveBeenNthCalledWith(
          1,
          expect.objectContaining({ error: expect.any(Error) }),
          expect.anything()
        );
        expect(telemetry.trackException.mock.calls[0][0]).toHaveProperty('error.message', 'Artificial.');
      });
    });
  });

  describe('when fetch resolve with 400', () => {
    let promise: Promise<unknown>;

    beforeEach(async () => {
      (globalThis.fetch as MockedFetch).mockImplementation(() =>
        Promise.resolve(new Response(undefined, { status: 400 }))
      );

      promise = client.startNewConversation(true, {});
      promise.catch(noop); // No unhandled rejections.

      // We cannot auto-advance the fake timers.
      await jest.advanceTimersByTimeAsync(31_000);
    });

    test('startNewConversation() call should reject', () =>
      expect(() => promise).rejects.toThrow('Server returned 400 while calling the service.'));

    describe('after startNewConversation() call rejected', () => {
      beforeEach(() => expect(() => promise).rejects.toThrow());

      test('fetch should be called 1 times', () => expect(globalThis.fetch).toBeCalledTimes(1));
      test('should call trackException once', () => expect(telemetry.trackException).toBeCalledTimes(1));
      test('should call trackException with the error', () => {
        expect(telemetry.trackException).toHaveBeenNthCalledWith(
          1,
          expect.objectContaining({ error: expect.any(Error) }),
          expect.anything()
        );
        expect(telemetry.trackException.mock.calls[0][0]).toHaveProperty(
          'error.message',
          'Server returned 400 while calling the service.'
        );
      });
    });
  });

  describe('when executeTurn() is called', () => {
    beforeEach(() => {
      (globalThis.fetch as MockedFetch).mockImplementation(() => Promise.resolve(new Response('{}', { status: 200 })));

      client.executeTurn(
        'c-00001',
        { from: { id: 'u-00001' }, text: 'Hello, World!', type: 'message' },
        { correlationId: '1234', signal: abortController.signal }
      );
    });

    test('fetch should be called once', () => expect(globalThis.fetch).toBeCalledTimes(1));
    test('fetch should be called with AbortSignal', () =>
      expect((globalThis.fetch as MockedFetch).mock.calls[0][1]).toHaveProperty('signal', abortController.signal));
    test('fetch should be called with URL', () =>
      expect((globalThis.fetch as MockedFetch).mock.calls[0][0]).toBe(
        'https://dummy/abc/conversations/c-00001?api-version=1'
      ));
    test('fetch should be called with headers', () =>
      expect((globalThis.fetch as MockedFetch).mock.calls[0][1]).toHaveProperty(
        'headers',
        expect.objectContaining({
          'Content-Type': 'application/json',
          'x-ms-correlationid': '1234',
          'x-test': 'dummy'
        })
      ));
    test('fetch should be called with body', () => {
      expect(JSON.parse((globalThis.fetch as MockedFetch).mock.calls[0][1]?.body as string)).toEqual({
        activity: {
          from: { id: 'u-00001' },
          text: 'Hello, World!',
          type: 'message'
        },
        test: 'dummy'
      });
    });
  });

  describe('when continueTurn() is called', () => {
    beforeEach(() => {
      (globalThis.fetch as MockedFetch).mockImplementation(() => Promise.resolve(new Response('{}', { status: 200 })));

      client.continueTurn('c-00001', { signal: abortController.signal, correlationId: '1234' });
    });

    test('fetch should be called once', () => expect(globalThis.fetch).toBeCalledTimes(1));
    test('fetch should be called with AbortSignal', () =>
      expect((globalThis.fetch as MockedFetch).mock.calls[0][1]).toHaveProperty('signal', abortController.signal));
    test('fetch should be called with URL', () =>
      expect((globalThis.fetch as MockedFetch).mock.calls[0][0]).toBe(
        'https://dummy/abc/conversations/c-00001/continue?api-version=1'
      ));
    test('fetch should be called with headers', () =>
      expect((globalThis.fetch as MockedFetch).mock.calls[0][1]).toHaveProperty(
        'headers',
        expect.objectContaining({
          'x-ms-correlationid': '1234',
          'x-test': 'dummy'
        })
      ));
    test('fetch should be called with body', () =>
      expect((globalThis.fetch as MockedFetch).mock.calls[0][1]).toHaveProperty(
        'body',
        JSON.stringify({
          test: 'dummy'
        })
      ));
  });

  describe('when startNewConversation() is called without correlationId', () => {
    beforeEach(() => {
      (globalThis.fetch as MockedFetch).mockImplementation(() => Promise.resolve(new Response('{}', { status: 200 })));

      client.startNewConversation(true, {});
    });

    test('fetch should be called without correlationId header', () =>
      expect((globalThis.fetch as MockedFetch).mock.calls[0][1]).toHaveProperty(
        'headers',
        expect.not.objectContaining({
          'x-ms-correlationid': expect.anything()
        })
      ));
  });

  describe('when executeTurn() is called without correlationId', () => {
    beforeEach(() => {
      (globalThis.fetch as MockedFetch).mockImplementation(() => Promise.resolve(new Response('{}', { status: 200 })));

      client.executeTurn('c-00001', { from: { id: 'u-00001' }, text: 'Hello, World!', type: 'message' }, {});
    });

    test('fetch should be called without correlationId header', () =>
      expect((globalThis.fetch as MockedFetch).mock.calls[0][1]).toHaveProperty(
        'headers',
        expect.not.objectContaining({
          'x-ms-correlationid': expect.anything()
        })
      ));
  });

  describe('when continueTurn() is called without correlationId', () => {
    beforeEach(() => {
      (globalThis.fetch as MockedFetch).mockImplementation(() => Promise.resolve(new Response('{}', { status: 200 })));

      client.continueTurn('c-00001', {});
    });

    test('fetch should be called without correlationId header', () =>
      expect((globalThis.fetch as MockedFetch).mock.calls[0][1]).toHaveProperty(
        'headers',
        expect.not.objectContaining({
          'x-ms-correlationid': expect.anything()
        })
      ));
  });
});
