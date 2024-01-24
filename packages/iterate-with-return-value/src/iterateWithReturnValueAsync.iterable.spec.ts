import iterateWithReturnValue from './iterateWithReturnValueAsync';

function sleep(durationInMS = 0): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, durationInMS));
}

describe('with async iterable', () => {
  const next = jest.fn((): IteratorResult<number, string> => {
    const value = queue.shift();

    if (value) {
      return { value };
    }

    return { done: true, value: 'done' };
  });

  const return_ = jest.fn((): IteratorResult<number, string> => {
    return { done: true, value: 'return' };
  });

  const throw_ = jest.fn((): IteratorResult<number, string> => {
    return { done: true, value: 'throw' };
  });

  const iterator = (): AsyncIterableIterator<number> => {
    const iterator: AsyncIterableIterator<number> = {
      [Symbol.asyncIterator](): AsyncIterableIterator<number> {
        return iterator;
      },
      next: async (): Promise<IteratorResult<number, string>> => {
        await sleep();

        return next();
      },
      return: async (): Promise<IteratorResult<number, string>> => {
        await sleep();

        return return_();
      },
      throw: async (): Promise<IteratorResult<number, string>> => {
        await sleep();

        return throw_();
      }
    };

    return iterator;
  };

  let queue: number[];

  beforeEach(() => {
    jest.clearAllMocks();

    queue = [1, 2, 3];
  });

  describe.each([['baseline', 'iterateWithReturnValue']])('%s', type => {
    let iterable: AsyncIterableIterator<number>;
    let getReturnValue: (() => string | undefined) | undefined = undefined;

    beforeEach(() => {
      if (type === 'baseline') {
        iterable = iterator();
      } else {
        [iterable, getReturnValue] = iterateWithReturnValue(iterator());

        expect(getReturnValue).not.toBeFalsy();
      }
    });

    test('get the return value', async () => {
      const expectation = jest.fn();

      for await (const value of iterable) {
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

    test('get the return value after break', async () => {
      const expectation = jest.fn();

      for await (const value of iterable) {
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
