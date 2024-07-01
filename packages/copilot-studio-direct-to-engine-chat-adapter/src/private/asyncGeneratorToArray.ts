import { asyncGeneratorWithLastValue, asyncIteratorToArray } from 'iter-fest';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function asyncGeneratorToArray<T, TReturn = any>(
  asyncGenerator: AsyncGenerator<T, TReturn>
): Promise<[T[], TReturn]> {
  const iterator = asyncGeneratorWithLastValue(asyncGenerator);

  return [await asyncIteratorToArray(iterator), iterator.lastValue()];
}
