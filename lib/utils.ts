
export function forEach<T>(
  arr: Array<T>,
  fn: (item: T, idx?: number) => any
): void {
  let item: T;
  for(let i = 0, len = arr.length; i < len; i++) {
    item = arr[i];
    fn(item, i);
  }
}
