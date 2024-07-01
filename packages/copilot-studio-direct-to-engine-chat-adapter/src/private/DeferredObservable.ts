/* eslint max-classes-per-file: "off" */

import { Observable, type SubscriberFunction } from 'iter-fest';

import arrayRemove from './arrayRemove';

type SubscriptionObserver<T> = Parameters<SubscriberFunction<T>>[0];

interface DeferredObservableConstructor {
  readonly prototype: DeferredObservable<unknown>;
  new <T>(subscribe?: SubscriberFunction<T>): DeferredObservable<T>;

  from<T>(iterable: Iterable<T>): DeferredObservable<T>;
}

interface DeferredObservable<T> {
  complete: Required<SubscriptionObserver<T>>['complete'];
  error: Required<SubscriptionObserver<T>>['error'];
  next: Required<SubscriptionObserver<T>>['next'];
  observable: Observable<T>;
}

class DeferredObservableImpl<T> implements DeferredObservable<T> {
  constructor(subscribe?: SubscriberFunction<T>) {
    this.#observable = new Observable((observer: SubscriptionObserver<T>) => {
      const subscription = subscribe?.(observer);

      this.#observers.push(observer);

      return () => {
        arrayRemove(this.#observers, observer);

        typeof subscription === 'function' ? subscription() : subscription?.unsubscribe();
      };
    });
  }

  #observable: Observable<T>;
  #observers: Array<SubscriptionObserver<T>> = [];

  public get observable(): Observable<T> {
    return this.#observable;
  }

  public complete() {
    if (!(this instanceof DeferredObservableImpl)) {
      throw new Error('complete() cannot be called on a non-DeferredObservable object.');
    }

    this.#observers.forEach(observer => observer.complete());
  }

  public error(reason: unknown) {
    if (!(this instanceof DeferredObservableImpl)) {
      throw new Error('error() cannot be called on a non-DeferredObservable object.');
    }

    this.#observers.forEach(observer => observer.error(reason));
  }

  public next(value: T) {
    if (!(this instanceof DeferredObservableImpl)) {
      throw new Error('next() cannot be called on a non-DeferredObservable object.');
    }

    this.#observers.forEach(observer => observer.next(value));
  }

  public static from<T>(iterable: Iterable<T>): DeferredObservable<T> {
    return new FixedDeferredObservable(Observable.from(iterable));
  }
}

class FixedDeferredObservable<T> implements DeferredObservable<T> {
  constructor(observable: Observable<T>) {
    this.#observable = observable;
  }

  #observable: Observable<T>;

  public get observable(): Observable<T> {
    return this.#observable;
  }

  public complete() {
    // Intentionally left blank.
  }

  public error() {
    // Intentionally left blank.
  }

  public next() {
    // Intentionally left blank.
  }
}

// This variable name "DeferredObservable" must match the interface name "DeferredObservable".
// This is a technique for creating static interface.
// eslint-disable-next-line @typescript-eslint/no-redeclare
const DeferredObservable: DeferredObservableConstructor = DeferredObservableImpl as DeferredObservableConstructor;

export default DeferredObservable;
