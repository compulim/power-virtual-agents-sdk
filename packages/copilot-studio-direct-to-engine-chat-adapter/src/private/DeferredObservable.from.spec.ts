import DeferredObservable from './DeferredObservable';
import MockObserver from './MockObserver';

test('should create observable', () => {
  // GIVEN: A deferred observable without any values.
  const { complete, error, next, observable } = DeferredObservable.from<number>([]);
  const observer = new MockObserver();

  // WHEN: Subscribe to the observable.
  observable.subscribe(observer);

  // TEST: start and complete should be observed.
  const expectedObservations = [['start', expect.any(Object)], ['complete']];

  expect(observer).toHaveProperty('observations', expectedObservations);

  // WHEN: Call complete().
  complete();

  // TEST: Should be no-op.
  expect(observer).toHaveProperty('observations', expectedObservations);

  // WHEN: Call error().
  error(undefined);

  // TEST: Should be no-op.
  expect(observer).toHaveProperty('observations', expectedObservations);

  // WHEN: Call next().
  next(1);

  // TEST: Should be no-op.
  expect(observer).toHaveProperty('observations', expectedObservations);
});

test('should emit values from iterables', () => {
  // GIVEN: A deferred observable without any values.
  const { observable } = DeferredObservable.from<number>([1, 2, 3]);
  const observer = new MockObserver();

  // WHEN: Subscribe to the observable.
  observable.subscribe(observer);

  // THEN: Should observe start, next, and complete.
  expect(observer).toHaveProperty('observations', [
    ['start', expect.any(Object)],
    ['next', 1],
    ['next', 2],
    ['next', 3],
    ['complete']
  ]);
});
