import iterateWithReturnValue from './iterateWithReturnValue';

describe('with iterable', () => {
  const next = jest.fn((): IteratorResult<number, string> => {
    const value = queue.shift();

    if (value) {
      return { value };
    }

    return { done: true, value: 'done' };
  });

  const return_ = jest.fn((): IteratorResult<number, string> => ({ done: true, value: 'return' }));
  const throw_ = jest.fn((): IteratorResult<number, string> => ({ done: true, value: 'throw' }));

  const iterator = (): IterableIterator<number> => {
    const iterator: IterableIterator<number> = {
      [Symbol.iterator](): IterableIterator<number> {
        return iterator;
      },
      next,
      return: return_,
      throw: throw_
    };

    return iterator;
  };

  let queue: number[];

  beforeEach(() => {
    jest.clearAllMocks();

    queue = [1, 2, 3];
  });

  describe.each([['baseline', 'iterateWithReturnValue']])('%s', type => {
    let iterable: IterableIterator<number>;
    let getReturnValue: (() => string | undefined) | undefined = undefined;

    beforeEach(() => {
      if (type === 'baseline') {
        iterable = iterator();
      } else {
        [iterable, getReturnValue] = iterateWithReturnValue(iterator());

        expect(getReturnValue).not.toBeFalsy();
      }
    });

    test('get the return value', () => {
      const expectation = jest.fn();

      for (const value of iterable) {
        getReturnValue && expect(getReturnValue).toThrow();

        expectation(value);
      }

      expect(next).toHaveBeenCalledTimes(4);
      expect(next).toHaveNthReturnedWith(1, { value: 1 });
      expect(next).toHaveNthReturnedWith(2, { value: 2 });
      expect(next).toHaveNthReturnedWith(3, { value: 3 });
      expect(next).toHaveNthReturnedWith(4, { done: true, value: 'done' });

      expect(return_).toHaveBeenCalledTimes(0);
      expect(throw_).toHaveBeenCalledTimes(0);

      expect(expectation).toHaveBeenCalledTimes(3);
      expect(expectation).toHaveBeenNthCalledWith(1, 1);
      expect(expectation).toHaveBeenNthCalledWith(2, 2);
      expect(expectation).toHaveBeenNthCalledWith(3, 3);

      getReturnValue && expect(getReturnValue()).toBe('done');
    });

    test('get the return value after break', () => {
      const expectation = jest.fn();

      for (const value of iterable) {
        getReturnValue && expect(getReturnValue).toThrow();

        expectation(value);

        if (value === 2) {
          break;
        }
      }

      expect(next).toHaveBeenCalledTimes(2);
      expect(next).toHaveNthReturnedWith(1, { value: 1 });
      expect(next).toHaveNthReturnedWith(2, { value: 2 });

      expect(return_).toHaveBeenCalledTimes(1);
      expect(return_).toHaveNthReturnedWith(1, { done: true, value: 'return' });

      expect(throw_).toHaveBeenCalledTimes(0);

      expect(expectation).toHaveBeenCalledTimes(2);
      expect(expectation).toHaveBeenNthCalledWith(1, 1);
      expect(expectation).toHaveBeenNthCalledWith(2, 2);

      getReturnValue && expect(getReturnValue()).toBe('return');
    });
  });
});
