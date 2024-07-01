import promiseWithResolvers from '../private/promiseWithResolvers';

export default class DeferredQueue<T> {
  constructor() {
    this.#deferred = promiseWithResolvers();
  }

  #deferred: PromiseWithResolvers<T>;
  #queue: T[] = [];

  public get promise(): Promise<T> {
    return this.#queue.length
      ? Promise.resolve(this.#queue.shift() as T)
      : this.#deferred.promise.then(value => {
          this.#queue.shift();

          return value;
        });
  }

  public push(value: T) {
    this.#queue.push(value);
    this.#deferred.resolve(value);
    this.#deferred = promiseWithResolvers();
  }

  public reject(error: unknown) {
    this.#deferred.promise.catch(() => {});
    this.#deferred.reject(error);
  }
}
