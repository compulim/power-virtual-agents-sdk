import { asyncGeneratorWithLastValue } from 'iter-fest';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function asyncGeneratorToArray<T, TReturn = any>(
  asyncGenerator: AsyncGenerator<T, TReturn>
): Promise<[T[], TReturn]> {
  const array: T[] = [];
  const iterator = asyncGeneratorWithLastValue(asyncGenerator);

  for await (const item of iterator) {
    array.push(item);
  }

  return [array, iterator.lastValue()];
}
