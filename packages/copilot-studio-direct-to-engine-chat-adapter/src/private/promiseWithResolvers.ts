// @ts-expect-error No typing is available for core-js-pure
import coreJSPromiseWithResolvers from 'core-js-pure/features/promise/with-resolvers';

type PromiseWithResolvers<T> = ReturnType<typeof Promise.withResolvers<T>>;

export default function promiseWithResolvers<T>(): PromiseWithResolvers<T> {
  return coreJSPromiseWithResolvers();
}

export type { PromiseWithResolvers };
