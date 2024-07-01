import { Observable, type SubscriptionObserver } from 'iter-fest';

import MockObserver from './MockObserver';

describe('a subscribed observer on a completed sequence', () => {
  let observable: Observable<number>;
  let observer: MockObserver<number>;

  beforeEach(() => {
    observable = Observable.from([1, 2, 3]);
    observer = new MockObserver<number>();

    observable.subscribe(observer);
  });

  test('should have observations', () =>
    expect(observer).toHaveProperty('observations', [
      ['start', expect.anything()],
      ['next', 1],
      ['next', 2],
      ['next', 3],
      ['complete']
    ]));

  test('should have called observe()', () => {
    expect(observer.observe).toBeCalledTimes(5);
    expect(observer.observe).toHaveBeenNthCalledWith(1, 'start', expect.anything());
    expect(observer.observe).toHaveBeenNthCalledWith(2, 'next', 1);
    expect(observer.observe).toHaveBeenNthCalledWith(3, 'next', 2);
    expect(observer.observe).toHaveBeenNthCalledWith(4, 'next', 3);
    expect(observer.observe).toHaveBeenNthCalledWith(5, 'complete');
  });
});

describe('a subscribed observer', () => {
  let observable: Observable<number>;
  let observer: MockObserver<number>;

  beforeEach(() => {
    observable = new Observable((o: SubscriptionObserver<number>) => o.next(123));
    observer = new MockObserver<number>();
    observable.subscribe(observer);
  });

  test('should have observations', () =>
    expect(observer).toHaveProperty('observations', [
      ['start', expect.anything()],
      ['next', 123]
    ]));

  test('should have called observe()', () => {
    expect(observer.observe).toBeCalledTimes(2);
    expect(observer.observe).toHaveBeenNthCalledWith(1, 'start', expect.anything());
    expect(observer.observe).toHaveBeenNthCalledWith(2, 'next', 123);
  });
});

describe('a subscribed observer on an errored sequence', () => {
  let observable: Observable<number>;
  let observer: MockObserver<number>;

  beforeEach(() => {
    observable = new Observable((o: SubscriptionObserver<number>) => o.error(new Error('Artificial')));
    observer = new MockObserver<number>();
    observable.subscribe(observer);
  });

  test('should have observations', () => {
    expect(observer).toHaveProperty('observations', [
      ['start', expect.anything()],
      ['error', expect.any(Error)]
    ]);
    expect((observer.observations[1] as ['error', Error])[1].message).toBe('Artificial');
  });

  test('should have called observe()', () => {
    expect(observer.observe).toBeCalledTimes(2);
    expect(observer.observe).toHaveBeenNthCalledWith(1, 'start', expect.anything());
    expect(observer.observe).toHaveBeenNthCalledWith(2, 'error', expect.any(Error));
    expect(observer.observe.mock.calls[1][1]).toHaveProperty('message', 'Artificial');
  });
});
