class IterableIteratorWithReturnValue<T, TReturn, TNext> implements IterableIterator<T> {
  constructor(iterator: Iterator<T, TReturn, TNext>) {
    this.next = this.#spy(iterator.next.bind(iterator));
    this.return = iterator.return && this.#spy(iterator.return.bind(iterator));
    this.throw = iterator.throw && this.#spy(iterator.throw.bind(iterator));
  }

  [Symbol.iterator]() {
    return this;
  }

  #returnValue: TReturn | undefined = undefined;
  #returnValueSet: boolean = false;

  #spy<TFn extends (...args: unknown[]) => IteratorResult<T, TReturn>>(fn: TFn) {
    return (...args: Parameters<TFn>): IteratorResult<T, TReturn> => {
      const result = fn(...args);

      if (result.done && !this.#returnValueSet) {
        this.#returnValue = result.value;
        this.#returnValueSet = true;
      }

      return result;
    };
  }

  next: () => IteratorResult<T>;
  return?(value?: TReturn): IteratorResult<T, TReturn>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  throw?(e?: any): IteratorResult<T, TReturn>;

  get returnValue() {
    return this.#returnValue;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function literateWithReturnValue<T, TReturn = any, TNext = unknown>(
  iterator: Iterator<T, TReturn, TNext>
): readonly [IterableIterator<T>, () => TReturn | undefined] {
  const iterable = new IterableIteratorWithReturnValue(iterator);

  return Object.freeze([iterable, (): TReturn | undefined => iterable.returnValue]);
}
