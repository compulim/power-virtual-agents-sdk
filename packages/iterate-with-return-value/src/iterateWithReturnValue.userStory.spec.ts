import iterateWithReturnValue from './iterateWithReturnValue';

describe('user story', () => {
  const generator: () => Generator<number, string> = function* () {
    yield 1;
    yield 2;
    yield 3;

    return 'done';
  };

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
      const values: number[] = [];

      for (const value of iterable) {
        values.push(value);
      }

      expect(values).toEqual([1, 2, 3]);

      getReturnValue && expect(getReturnValue()).toEqual('done');
    });
  });
});
