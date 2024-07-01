import DeferredObservable from './DeferredObservable';
import MockObserver from './MockObserver';

describe('when subscribe', () => {
  let deferredObservable: DeferredObservable<number>;
  let observer: MockObserver<number>;

  beforeEach(() => {
    observer = new MockObserver();

    // GIVEN: A deferred observable.
    deferredObservable = new DeferredObservable<number>();
    deferredObservable.observable.subscribe(observer);

    // THEN: It should observe start().
    expect(observer).toHaveProperty('observations', [['start', expect.any(Object)]]);
  });

  test('calling next -> next', async () => {
    // WHEN: Call next().
    deferredObservable.next(1);

    // THEN: It should observe next().
    expect(observer).toHaveProperty('observations', [
      ['start', expect.any(Object)],
      ['next', 1]
    ]);

    // WHEN: Call next() again.
    deferredObservable.next(2);

    // THEN: It should observe another next().
    expect(observer).toHaveProperty('observations', [
      ['start', expect.any(Object)],
      ['next', 1],
      ['next', 2]
    ]);
  });

  test('calling next -> complete -> error', async () => {
    // WHEN: Call next().
    deferredObservable.next(1);

    // THEN: It should observe next().
    expect(observer).toHaveProperty('observations', [
      ['start', expect.any(Object)],
      ['next', 1]
    ]);

    // WHEN: Call complete().
    deferredObservable.complete();

    // THEN: It should observe complete().
    expect(observer).toHaveProperty('observations', [['start', expect.any(Object)], ['next', 1], ['complete']]);

    // WHEN: Call error().
    deferredObservable.error(new Error('Aloha!'));

    // THEN: It should not observe error() because complete() has been called.
    expect(observer).toHaveProperty('observations', [['start', expect.any(Object)], ['next', 1], ['complete']]);
  });

  test('calling next -> complete -> next', async () => {
    // WHEN: Call next().
    deferredObservable.next(1);

    // THEN: It should observe next().
    expect(observer).toHaveProperty('observations', [
      ['start', expect.any(Object)],
      ['next', 1]
    ]);

    // WHEN: Call complete().
    deferredObservable.complete();

    // THEN: It should observe complete().
    expect(observer).toHaveProperty('observations', [['start', expect.any(Object)], ['next', 1], ['complete']]);

    // WHEN: Call next() again.
    deferredObservable.next(2);

    // THEN: It should not observe next() because complete() has been called.
    expect(observer).toHaveProperty('observations', [['start', expect.any(Object)], ['next', 1], ['complete']]);
  });

  test('calling next -> error -> complete', async () => {
    // WHEN: Call next().
    deferredObservable.next(1);

    // THEN: It should observe next().
    expect(observer).toHaveProperty('observations', [
      ['start', expect.any(Object)],
      ['next', 1]
    ]);

    // WHEN: Call error().
    deferredObservable.error('Aloha!');

    // THEN: It should observe next().
    expect(observer).toHaveProperty('observations', [
      ['start', expect.any(Object)],
      ['next', 1],
      ['error', 'Aloha!']
    ]);

    // WHEN: Call complete().
    deferredObservable.complete();

    // THEN: It should not observe complete() because error() has been called.
    expect(observer).toHaveProperty('observations', [
      ['start', expect.any(Object)],
      ['next', 1],
      ['error', 'Aloha!']
    ]);
  });

  test('calling next -> error -> next', async () => {
    // WHEN: Call next().
    deferredObservable.next(1);

    // THEN: It should observe next().
    expect(observer).toHaveProperty('observations', [
      ['start', expect.any(Object)],
      ['next', 1]
    ]);

    // WHEN: Call error().
    deferredObservable.error('Aloha!');

    // THEN: It should observe next().
    expect(observer).toHaveProperty('observations', [
      ['start', expect.any(Object)],
      ['next', 1],
      ['error', 'Aloha!']
    ]);

    // WHEN: Call next() again.
    deferredObservable.next(2);

    // THEN: It should not observe next() because error() has been called.
    expect(observer).toHaveProperty('observations', [
      ['start', expect.any(Object)],
      ['next', 1],
      ['error', 'Aloha!']
    ]);
  });
});

test('subscribe later should not call next() with previous values', () => {
  const observer1 = new MockObserver();
  const observer2 = new MockObserver();

  // GIVEN: A deferred observable.
  const deferredObservable: DeferredObservable<number> = new DeferredObservable<number>();

  deferredObservable.observable.subscribe(observer1);

  // WHEN: Call next().
  deferredObservable.next(1);

  // THEN: It should observe next().
  expect(observer1).toHaveProperty('observations', [
    ['start', expect.any(Object)],
    ['next', 1]
  ]);

  // WHEN: Another observer subscribed and call next().
  deferredObservable.observable.subscribe(observer2);
  deferredObservable.next(2);

  // THEN: The first observer should observe the first and second next().
  expect(observer1).toHaveProperty('observations', [
    ['start', expect.any(Object)],
    ['next', 1],
    ['next', 2]
  ]);

  // THEN: The second observer should observe second next() only.
  expect(observer2).toHaveProperty('observations', [
    ['start', expect.any(Object)],
    ['next', 2]
  ]);
});

test('calling complete() outside of DeferredObservable should throw', () => {
  const { complete } = new DeferredObservable<void>();

  expect(() => complete()).toThrow('complete() cannot be called on a non-DeferredObservable object.');
});

test('calling error() outside of DeferredObservable should throw', () => {
  const { error } = new DeferredObservable<void>();

  expect(() => error(new Error('Artificial.'))).toThrow('error() cannot be called on a non-DeferredObservable object.');
});

test('calling next() outside of DeferredObservable should throw', () => {
  const { next } = new DeferredObservable<void>();

  expect(() => next()).toThrow('next() cannot be called on a non-DeferredObservable object.');
});
