import iterateReadableStream from './iterateReadableStream';

test('iterate readable stream', async () => {
  const stream = new ReadableStream({
    pull(controller) {
      controller.close();
    },
    start(controller) {
      controller.enqueue(1);
      controller.enqueue(2);
      controller.enqueue(3);
    }
  });

  const values: number[] = [];

  for await (const value of iterateReadableStream(stream)) {
    values.push(value);
  }

  expect(values).toEqual([1, 2, 3]);
});

test('iterate readable stream with error', async () => {
  const stream = new ReadableStream({
    pull(controller) {
      // We need to send error in pull(), otherwise, calling error() in start() will throw immediately.
      controller.error(new Error('Artificial.'));
    },
    start(controller) {
      controller.enqueue(1);
    }
  });

  const iterable = iterateReadableStream(stream);

  await expect(iterable.next()).resolves.toEqual({ done: false, value: 1 });
  await expect(() => iterable.next()).rejects.toThrowError('Artificial.');
});
