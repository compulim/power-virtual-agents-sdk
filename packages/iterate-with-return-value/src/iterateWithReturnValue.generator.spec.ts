import iterateWithReturnValue from './iterateWithReturnValue';

describe('with generator', () => {
  const next = jest.fn<number, [number]>(value => value);
  const return_ = jest.fn<string, [string]>(value => value);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const throw_ = jest.fn<any, [any]>(value => value);
  const finally_ = jest.fn<void, []>(() => {});

  const generator: () => Generator<number, string> = function* () {
    try {
      yield next(1);
      yield next(2);
      yield next(3);

      return return_('done');
    } catch (error) {
      throw throw_(error);
    } finally {
      finally_();
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe.each([['baseline', 'iterateWithReturnValue']])('%s', type => {
    let iterable: IterableIterator<number>;
    let getReturnValue: (() => string | undefined) | undefined = undefined;

    beforeEach(() => {
      if (type === 'baseline') {
        iterable = generator();
      } else {
        [iterable, getReturnValue] = iterateWithReturnValue(generator());

        expect(getReturnValue).not.toBeFalsy();
      }
    });

    test('get the return value', () => {
      const expectation = jest.fn();

      for (const value of iterable) {
        getReturnValue && expect(getReturnValue).toThrow();

        expectation(value);
      }

      expect(next).toHaveBeenCalledTimes(3);
      expect(next).toHaveBeenNthCalledWith(1, 1);
      expect(next).toHaveBeenNthCalledWith(2, 2);
      expect(next).toHaveBeenNthCalledWith(3, 3);

      expect(return_).toHaveBeenCalledTimes(1);
      expect(return_).toHaveBeenNthCalledWith(1, 'done');

      expect(throw_).toHaveBeenCalledTimes(0);
      expect(finally_).toHaveBeenCalledTimes(1);

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
      expect(next).toHaveBeenNthCalledWith(1, 1);
      expect(next).toHaveBeenNthCalledWith(2, 2);

      expect(return_).toHaveBeenCalledTimes(0);

      expect(throw_).toHaveBeenCalledTimes(0);
      expect(finally_).toHaveBeenCalledTimes(1);

      expect(expectation).toHaveBeenCalledTimes(2);
      expect(expectation).toHaveBeenNthCalledWith(1, 1);
      expect(expectation).toHaveBeenNthCalledWith(2, 2);

      getReturnValue && expect(getReturnValue).toThrow();
    });
  });
});
