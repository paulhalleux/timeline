/**
 * Animates a number from a starting value to an ending value over a specified duration.
 * @param from - starting number
 * @param to - ending number
 * @param callback - function to call with the updated number
 * @param duration - duration of the animation in milliseconds (default is 300ms)
 */
export const animateNumber = (
  from: number,
  to: number,
  callback: (value: number) => void,
  duration = 300,
) => {
  const startTime = performance.now();

  const step = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const value = from + (to - from) * progress;
    callback(value);
    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };

  requestAnimationFrame(step);
};
