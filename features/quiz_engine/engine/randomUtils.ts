/** Fisher-Yates shuffle (in-place). */
export function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Returns a new array that is a shuffled copy of the input. */
export function shuffled<T>(arr: T[]): T[] {
  return shuffleInPlace([...arr]);
}

/** Pick up to `count` elements without replacement. */
export function sample<T>(source: T[], count: number): T[] {
  if (count >= source.length) return [...source];
  return shuffled(source).slice(0, count);
}
