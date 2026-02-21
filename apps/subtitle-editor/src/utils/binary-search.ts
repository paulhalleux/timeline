export const binarySearchMatchingTime = <T>(
  arr: readonly T[],
  time: number,
  getTime: (item: T) => number,
): number => {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midTime = getTime(arr[mid]);

    if (midTime === time) {
      return mid; // Found an exact match
    } else if (midTime < time) {
      left = mid + 1; // Search in the right half
    } else {
      right = mid - 1; // Search in the left half
    }
  }

  // If no exact match is found, return the index of the closest item
  return left < arr.length ? left : arr.length - 1;
};
