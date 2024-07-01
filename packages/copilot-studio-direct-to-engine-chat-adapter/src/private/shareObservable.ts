import { Observable, type Subscription, type SubscriptionObserver } from 'iter-fest';

import arrayRemove from './arrayRemove';

/**
 * RxJS@5 has a concept of "shared" observable.
 *
 * Only the first subscriber will trigger the constructor logic in observable.
 * Subscribers after the first subscription will not trigger the constructor logic again until all subscribers are unsubscribed.
 *
 * We are using ES Observable and need to replicate this behavior.
 */
export default function shareObservable<T>(observable: Observable<T>): Observable<T> {
  const observers: Array<SubscriptionObserver<T>> = [];
  let subscription: Subscription | undefined;

  return new Observable<T>(observer => {
    observers.push(observer);

    if (!subscription) {
      subscription = observable.subscribe({
        complete() {
          // When complete() or error() is called, Observable will call unsubscribe() automatically.
          // Because our arrayRemove() in unsubscribe will remove the element inline via splice(),
          // the removal will affect the map() function here.
          // We need to clone the array before calling map() to hold its state.
          [...observers].map(obv => obv.complete());
        },
        error(err) {
          [...observers].map(obv => obv.error(err));
        },
        next(value) {
          observers.map(obv => obv.next(value));
        }
      });
    }

    return () => {
      arrayRemove(observers, observer);

      if (!observers.length) {
        subscription?.unsubscribe();
        subscription = undefined;
      }
    };
  });
}
