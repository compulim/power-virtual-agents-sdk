/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

const IterationNotCompleted = Symbol();

class AsyncIterableIteratorWithReturnValue<T, TReturn, TNext> implements AsyncIterableIterator<T> {
  constructor(iterator: AsyncIterator<T, TReturn, TNext>) {
    this.next = this.#spy(iterator.next.bind(iterator));
    this.return = iterator.return && this.#spy(iterator.return.bind(iterator));
    this.throw = iterator.throw && this.#spy(iterator.throw.bind(iterator));
  }

  [Symbol.asyncIterator]() {
    return this;
  }

  #returnValue: TReturn | typeof IterationNotCompleted = IterationNotCompleted;

  #spy<TFn extends (...args: unknown[]) => Promise<IteratorResult<T, TReturn>>>(fn: TFn) {
    return async (...args: Parameters<TFn>): Promise<IteratorResult<T, TReturn>> => {
      const result = await fn(...args);

      if (result.done) {
        this.#returnValue = result.value;
      }

      return result;
    };
  }

  getReturnValue(): TReturn {
    if (this.#returnValue === IterationNotCompleted) {
      throw new Error('Cannot get return value before iteration completed.');
    }

    return this.#returnValue;
  }

  next: () => Promise<IteratorResult<T>>;
  return?(value?: TReturn): Promise<IteratorResult<T, TReturn>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  throw?(e?: any): Promise<IteratorResult<T, TReturn>>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function literateWithReturnValue<T, TReturn = any, TNext = unknown>(
  iterator: AsyncIterator<T, TReturn, TNext>
): readonly [AsyncIterableIterator<T>, () => TReturn] {
  const iterable = new AsyncIterableIteratorWithReturnValue(iterator);

  return Object.freeze([iterable, (): TReturn => iterable.getReturnValue()]);
}
