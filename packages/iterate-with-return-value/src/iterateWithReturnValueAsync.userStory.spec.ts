import iterateWithReturnValue from './iterateWithReturnValueAsync';

function sleep(durationInMS = 0): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, durationInMS));
}

describe('user story with async', () => {
  const generator: () => AsyncGenerator<number, string> = async function* () {
    await sleep();

    yield 1;

    await sleep();

    yield 2;

    await sleep();

    yield 3;

    await sleep();

    return 'done';
  };

  describe.each([['baseline', 'iterateWithReturnValue']])('%s', type => {
    let iterable: AsyncIterableIterator<number>;
    let getReturnValue: (() => string | undefined) | undefined = undefined;

    beforeEach(() => {
      if (type === 'baseline') {
        iterable = generator();
      } else {
        [iterable, getReturnValue] = iterateWithReturnValue(generator());

        expect(getReturnValue).not.toBeFalsy();
      }
    });

    test('get the return value', async () => {
      const values: number[] = [];

      for await (const value of iterable) {
        values.push(value);
      }

      expect(values).toEqual([1, 2, 3]);

      getReturnValue && expect(getReturnValue()).toEqual('done');
    });
  });
});
