const IterationNotCompleted = Symbol();

class IterableIteratorWithReturnValue<T, TReturn, TNext> implements IterableIterator<T> {
  constructor(iterator: Iterator<T, TReturn, TNext>) {
    this.next = this.#spy(iterator.next.bind(iterator));
    this.return = iterator.return && this.#spy(iterator.return.bind(iterator));
    this.throw = iterator.throw && this.#spy(iterator.throw.bind(iterator));
  }

  [Symbol.iterator]() {
    return this;
  }

  #returnValue: TReturn | typeof IterationNotCompleted = IterationNotCompleted;

  #spy<TFn extends (...args: unknown[]) => IteratorResult<T, TReturn>>(fn: TFn) {
    return (...args: Parameters<TFn>): IteratorResult<T, TReturn> => {
      const result = fn(...args);

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

  next: () => IteratorResult<T>;
  return?(value?: TReturn): IteratorResult<T, TReturn>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  throw?(e?: any): IteratorResult<T, TReturn>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function literateWithReturnValue<T, TReturn = any, TNext = unknown>(
  iterator: Iterator<T, TReturn, TNext>
): readonly [IterableIterator<T>, () => TReturn] {
  const iterable = new IterableIteratorWithReturnValue(iterator);

  return Object.freeze([iterable, (): TReturn => iterable.getReturnValue()]);
}
