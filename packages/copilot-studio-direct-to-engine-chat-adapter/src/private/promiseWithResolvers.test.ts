import promiseWithResolvers from './promiseWithResolvers';

describe('promiseWithResolvers', () => {
  test('resolve should work', async () => {
    const { promise, resolve } = promiseWithResolvers();

    resolve(1);

    await expect(promise).resolves.toBe(1);
  });

  test('reject should work', async () => {
    const { promise, reject } = promiseWithResolvers();

    reject(1);

    await expect(promise).rejects.toBe(1);
  });
});
