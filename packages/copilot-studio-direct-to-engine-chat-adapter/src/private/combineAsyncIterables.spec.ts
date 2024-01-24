/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import combineAsyncIterables from './combineAsyncIterables';
import iterableToAsyncIterable from './iterableToAsyncIterable';

test('combining 2 iterables', async () => {
  const iterable1: AsyncIterableIterator<number> = iterableToAsyncIterable<number>(new Set<number>([1, 2]).values());
  const iterable2: AsyncIterableIterator<number> = iterableToAsyncIterable<number>(new Set<number>([3, 4]).values());
  const values: number[] = [];

  for await (const value of combineAsyncIterables<number>(iterableToAsyncIterable([iterable1, iterable2]))) {
    values.push(value);
  }

  expect(values).toEqual([1, 2, 3, 4]);
});

test('combining no iterables', async () => {
  const values: number[] = [];

  for await (const value of combineAsyncIterables<number>(iterableToAsyncIterable([]))) {
    values.push(value);
  }

  expect(values).toEqual([]);
});
