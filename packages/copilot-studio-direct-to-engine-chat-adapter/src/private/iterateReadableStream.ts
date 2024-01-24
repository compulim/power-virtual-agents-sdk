export default async function* <T>(readableStream: ReadableStream<T>): AsyncIterableIterator<T> & AsyncIterator<T, T> {
  const reader = readableStream.getReader();

  for (;;) {
    const response = await reader.read();

    if (response.done) {
      return response.value;
    }

    yield response.value;
  }
}
