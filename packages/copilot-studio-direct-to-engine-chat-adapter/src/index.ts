// /* globals console */

// async function* generate() {
//   try {
//     console.log('BEFORE 1');
//     yield 1;
//     console.log('AFTER 1');

//     console.log('BEFORE 2');
//     yield 2;
//     console.log('AFTER 2');

//     console.log('BEFORE 3');
//     return 3;
//   } finally {
//     console.log('FINALLY');
//   }
// }

// function withLastValue<T>(iterator: AsyncIterator<T>): readonly [AsyncIterable<T>, () => T | undefined] {
//   let lastValue: T | undefined;
//   let lastValueSet: boolean = false;

//   const invoke =
//     <TFn extends (...args: unknown[]) => Promise<{ done: boolean; value: T }>>(fn: TFn) =>
//     async (...args: Parameters<TFn>): Promise<{ done: boolean; value: T }> => {
//       const result = await fn(...args);

//       if (result.done && !lastValueSet) {
//         lastValue = result.value;
//         lastValueSet = true;
//       }

//       return result;
//     };

//   return Object.freeze([
//     {
//       [Symbol.asyncIterator]: () => ({
//         next: invoke(iterator.next.bind(iterator)),
//         return: iterator.return && invoke(iterator.return.bind(iterator)),
//         throw: iterator.throw && invoke(iterator.throw.bind(iterator))
//       })
//     },
//     (): T | undefined => lastValue
//   ]);
// }

// (async () => {
//   const [iterator, getLastValue] = withLastValue(generate());

//   for await (const value of iterator) {
//     console.log(value);

//     // break;
//   }

//   console.log({ lastValue: getLastValue() });
// })();
