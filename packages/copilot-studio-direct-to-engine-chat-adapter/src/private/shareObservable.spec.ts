/** @jest-environment ./src/private/JestEnvironmentWithJSDOMAndWritableStream */

import { waitFor } from '@testing-library/dom';
import { Observable, type SubscriberFunction } from 'iter-fest/observable';
import noop from 'lodash/noop';

import MockObserver from './MockObserver';
import shareObservable from './shareObservable';

type SubscriptionObserver<T> = Parameters<SubscriberFunction<T>>[0];

test('should only subscribe when there is at least one subscriber', () => {
  // GIVEN: A shared observable.
  const unsubscribe = jest.fn<void, void[]>(noop);
  const observerCallback = jest.fn<(() => void) | undefined, [SubscriptionObserver<void>]>(() => unsubscribe);
  const parent = new Observable(observerCallback);
  const sharedParent = shareObservable(parent);

  // THEN: The observer should not be called yet because there are no subscriptions.
  expect(observerCallback).toHaveBeenCalledTimes(0);

  // WHEN: Subscribe.
  const subscription1 = sharedParent.subscribe(noop);

  // THEN: The observer should be called.
  expect(observerCallback).toHaveBeenCalledTimes(1);

  // WHEN: Subscribe again.
  const subscription2 = sharedParent.subscribe(noop);

  // THEN: The observer should not be called.
  expect(observerCallback).toHaveBeenCalledTimes(1);

  // WHEN: The first subscription is unsubscribed.
  subscription1.unsubscribe();

  // THEN: unsubscribe() should not be called.
  expect(unsubscribe).toBeCalledTimes(0);

  // WHEN: The second (and the last) subscription is unsubscribed.
  subscription2.unsubscribe();

  // THEN: unsubscribe() should be called.
  expect(unsubscribe).toBeCalledTimes(1);
});

test('should unsubscribe when there are no subscribers', () => {
  // GIVEN: A shared observable.
  const unsubscribe = jest.fn<void, void[]>();
  const observerCallback = jest.fn<(() => void) | undefined, [SubscriptionObserver<void>]>(() => () => unsubscribe());
  const parent = new Observable(observerCallback);
  const sharedParent = shareObservable(parent);

  // WHEN: Subscribe.
  const subscriptions = sharedParent.subscribe(noop);

  // THEN: unsubscribe() should not be called.
  expect(unsubscribe).toHaveBeenCalledTimes(0);

  // WHEN: Unsubscribe.
  subscriptions.unsubscribe();

  // THEN: unsubscribe() should be called.
  expect(unsubscribe).toHaveBeenCalledTimes(1);
});

test('should call next/complete for all subscribers', async () => {
  // GIVEN: A shred observable.
  const observerCallback = jest.fn<(() => void) | undefined, [SubscriptionObserver<string>]>();
  const parent = new Observable<string>(observerCallback);
  const shared = shareObservable(parent);

  const observer1 = new MockObserver();
  const observer2 = new MockObserver();

  // WHEN: Subscribe twice.
  shared.subscribe(observer1);
  shared.subscribe(observer2);

  // THEN: next() should not be observed.
  expect(observer1).toHaveProperty('observations', [['start', expect.any(Object)]]);
  expect(observer2).toHaveProperty('observations', [['start', expect.any(Object)]]);

  const [[observer]] = observerCallback.mock.calls;

  // WHEN: Call next().
  observer.next('Hello, World!');

  // THEN: next() should be observed.
  expect(observer1).toHaveProperty('observations', [
    ['start', expect.any(Object)],
    ['next', 'Hello, World!']
  ]);
  expect(observer2).toHaveProperty('observations', [
    ['start', expect.any(Object)],
    ['next', 'Hello, World!']
  ]);

  // WHEN: Call complete().
  observer.complete();

  // THEN: complete() should be observed.
  await waitFor(() =>
    expect(observer1).toHaveProperty('observations', [
      ['start', expect.any(Object)],
      ['next', 'Hello, World!'],
      ['complete']
    ])
  );
  await waitFor(() =>
    expect(observer2).toHaveProperty('observations', [
      ['start', expect.any(Object)],
      ['next', 'Hello, World!'],
      ['complete']
    ])
  );
});

test('should call error for all subscribers', () => {
  // GIVEN: A shared observable.
  const observerCallback = jest.fn<(() => void) | undefined, [SubscriptionObserver<void>]>();
  const parent = new Observable(observerCallback);
  const shared = shareObservable(parent);

  const observer1 = new MockObserver();
  const observer2 = new MockObserver();

  // WHEN: Subscribe twice.
  shared.subscribe(observer1);
  shared.subscribe(observer2);

  // THEN: error() should not be observed.
  expect(observer1).toHaveProperty('observations', [['start', expect.any(Object)]]);
  expect(observer2).toHaveProperty('observations', [['start', expect.any(Object)]]);

  // WHEN: Call error().
  const error = new Error('artificial');

  const [[observer]] = observerCallback.mock.calls;

  observer.error(error);

  // THEN: error() should be observed.
  expect(observer1).toHaveProperty('observations', [
    ['start', expect.any(Object)],
    ['error', error]
  ]);
  expect(observer2).toHaveProperty('observations', [
    ['start', expect.any(Object)],
    ['error', error]
  ]);
});
