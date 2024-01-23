## How to use

```ts
import iterateWithReturnValue from './iterateWithReturnValue';

const generator: () => Generator<number, string> = function* () {
  yield 1;
  yield 2;
  yield 3;

  return 'done';
};

const [iterable, getReturnValue] = iterateWithReturnValue(generator());

for (const value of iterable) {
  console.log(value); // 1, 2, 3
}

console.log(getReturnValue()); // 'done'
```
