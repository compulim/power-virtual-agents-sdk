import arrayRemove from './arrayRemove';

test('should remove element', () => {
  // GIVEN: An array.
  const array = [1, 2, 3];

  // WHEN: Remove an element from the array.
  arrayRemove(array, 2);

  // THEN: The element should be removed.
  expect(array).toEqual([1, 3]);
});

test('should not throw when remove non existing element', () => {
  // GIVEN: An array.
  const array = [1, 2, 3];

  // WHEN: Remove an element which is not in the array.
  arrayRemove(array, 4);

  // THEN: Should keep the array as-is.
  expect(array).toEqual([1, 2, 3]);
});

test('should remove first instance of an element', () => {
  // GIVEN: An array with 2 elements of same value.
  const array = [1, 2, 3, 1];

  // WHEN: Remove the duplicated element.
  arrayRemove(array, 1);

  // THEN: Should remove the first instance of the duplicated element.
  expect(array).toEqual([2, 3, 1]);
});

test('should handle empty array', () => {
  // GIVEN: An empty array.
  const array: number[] = [];

  // WHEN: Remove an element which is not in the array.
  arrayRemove(array, 1);

  // THEN: Should keep the array as-is.
  expect(array).toEqual([]);
});

test('should ignore non-arrays', () => {
  // @ts-expect-error testing handling invalid input
  arrayRemove(1);
  // @ts-expect-error testing handling invalid input
  arrayRemove('Aloha!');
  // @ts-expect-error testing handling invalid input
  arrayRemove(() => void 0);
  // @ts-expect-error testing handling invalid input
  arrayRemove(new Map());
  // @ts-expect-error testing handling invalid input
  arrayRemove(new Set());
});
