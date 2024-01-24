/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

export default async function* iterableToAsyncIterable<T>(iterable: Iterable<T>): AsyncIterableIterator<T> {
  for await (const value of iterable) {
    yield value;
  }
}
