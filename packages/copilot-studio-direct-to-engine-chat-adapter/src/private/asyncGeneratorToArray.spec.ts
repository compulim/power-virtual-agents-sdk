import asyncGeneratorToArray from './asyncGeneratorToArray';

describe('asyncGeneratorToArray', () => {
  describe('with all resolvable values and return value', () => {
    let result: [number[], string];

    beforeEach(async () => {
      result = await asyncGeneratorToArray(
        (async function* () {
          await new Promise(resolve => setTimeout(resolve, 0));
          yield 1;

          await new Promise(resolve => setTimeout(resolve, 0));
          yield 2;

          await new Promise(resolve => setTimeout(resolve, 0));
          yield 3;

          await new Promise(resolve => setTimeout(resolve, 0));
          return 'done';
        })()
      );
    });

    test('should return all values including the return value', () => expect(result).toEqual([[1, 2, 3], 'done']));
  });

  describe('with all resolvable values and no return value', () => {
    let result: [number[], void];

    beforeEach(async () => {
      result = await asyncGeneratorToArray(
        (async function* () {
          await new Promise(resolve => setTimeout(resolve, 0));
          yield 1;

          await new Promise(resolve => setTimeout(resolve, 0));
          yield 2;

          await new Promise(resolve => setTimeout(resolve, 0));
          yield 3;

          await new Promise(resolve => setTimeout(resolve, 0));
        })()
      );
    });

    test('should return all values', () => expect(result).toEqual([[1, 2, 3]]));
  });

  describe('with rejecting values', () => {
    let result: Promise<unknown>;

    beforeEach(() => {
      result = asyncGeneratorToArray(
        // eslint-disable-next-line require-yield
        (async function* (): AsyncGenerator<number> {
          throw new Error('Artificial');
        })()
      );
    });

    test('should throw', () => expect(result).rejects.toThrow('Artificial'));
  });
});
