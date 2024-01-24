/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

export default async function* combineAsyncIterables<T>(
  iterables: AsyncIterable<AsyncIterable<T>>
): AsyncIterableIterator<T> {
  for await (const iterable of iterables) {
    for await (const value of iterable) {
      yield value;
    }
  }
}
