/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import iterableToAsyncIterable from './iterableToAsyncIterable';

test('convert iterable to async iterable', async () => {
  const asyncIterable = iterableToAsyncIterable(new Set([1, 2, 3]).values());
  const values: number[] = [];

  for await (const value of asyncIterable) {
    values.push(value);
  }

  expect(values).toEqual([1, 2, 3]);
});
