function* getAvailableDurationMills(): Generator<number, void, unknown> {
  // milliseconds
  yield 100; // 100 milliseconds
  yield 500; // 500 milliseconds
  // seconds
  for (const number of [1, 2, 5, 10, 15, 20, 30]) {
    yield number * 1000;
  }
  // minutes
  for (const number of [1, 2, 5, 10, 15, 20, 30]) {
    yield number * 60 * 1000;
  }
  // hours
  for (const number of [1, 2, 3, 4, 6, 8, 12]) {
    yield number * 60 * 60 * 1000;
  }
  // days
  for (const number of [1, 2, 3, 4, 5, 6, 7]) {
    yield number * 24 * 60 * 60 * 1000;
  }
  // weeks
  for (const number of [1, 2, 3, 4, 5]) {
    yield number * 7 * 24 * 60 * 60 * 1000;
  }
  // months
  for (const number of [1, 2, 3, 4, 5]) {
    yield number * 30 * 24 * 60 * 60 * 1000;
  }
  // years
  for (const number of [1, 2, 3, 4, 5]) {
    yield number * 365 * 24 * 60 * 60 * 1000;
  }
}

export function getTickIntervalTime(
  unitToPx: (time: number) => number,
  expectedWidth: number,
): number {
  for (const duration of getAvailableDurationMills()) {
    const width = unitToPx(duration);
    if (width >= expectedWidth) {
      return duration;
    }
  }
  return 0;
}
