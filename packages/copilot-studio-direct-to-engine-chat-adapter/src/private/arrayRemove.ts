export default function arrayRemove<T>(array: T[], searchElement: T): void {
  if (!Array.isArray(array)) {
    return;
  }

  const index = array.indexOf(searchElement);

  if (index > -1) {
    array.splice(index, 1);
  }
}
