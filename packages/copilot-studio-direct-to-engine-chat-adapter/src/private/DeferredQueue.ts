import { DeferredPromise } from 'powerva-turn-based-chat-adapter-framework';

export default class DeferredQueue<T> {
  constructor() {
    this.#deferred = new DeferredPromise();
    this.#deferred.promise.catch(() => {});
  }

  #deferred: DeferredPromise<T>;
  #queue: T[] = [];

  public get promise(): Promise<T> {
    const value = this.#queue.shift();

    return value
      ? Promise.resolve(value)
      : this.#deferred.promise.then(value => {
          this.#queue.shift();

          return value;
        });
  }

  public push(value: T) {
    this.#queue.push(value);
    this.#deferred.resolve(value);
    this.#deferred = new DeferredPromise();
    this.#deferred.promise.catch(() => {});
  }

  public reject(error: unknown) {
    this.#deferred.reject(error);
  }
}