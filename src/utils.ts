import { KeyData } from "./types";

/**
 * Utility function to remove null and undefined values from an object
 *
 * This is particularly useful when setting query parameters, as null/undefined
 * values should typically be filtered out before sending to APIs.
 *
 * @param o The object to clean
 * @returns A new object with null and undefined values removed
 *
 * @example
 * ```typescript
 * const queryParams = {
 *   name: 'John',
 *   age: null,
 *   email: 'john@example.com',
 *   phone: undefined
 * };
 *
 * const cleaned = cleanNullishFromObject(queryParams);
 * // Result: { name: 'John', email: 'john@example.com' }
 *
 * // Use case with table state
 * this.tableState.setQueryParams(cleanNullishFromObject(queryParams));
 * ```
 */
export function cleanNullishFromObject(o: object): Record<string, any> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v != null));
}

export function hasNullishInObject(obj: object): boolean {
  return Object.values(obj).some((val) => val === null || val === undefined);
}

export function routeParamConcat(baseUrl: string, routeParam: number | string) {
  if (routeParam === undefined || routeParam === null) {
    throw new Error("routeParam cannot be null or undefined");
  }

  if (baseUrl.endsWith("/")) {
    return baseUrl.concat(routeParam.toString());
  }
  return baseUrl.concat(`/${routeParam.toString()}`);
}

export function binarySearch<TItem>(arr: TItem[], val: TItem): number {
  if (arr.length === 0) {
    return -1;
  }
  let left = 0;
  let right = arr.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === val) {
      return mid;
    } else if (arr[mid] < val) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  return -1;
}

export function emptyCallback() {}

export function nullableKeyData<TKey, TData>(
  key: TKey | null,
  data: TData | null
): KeyData<TKey, TData> | null {
  if (key && data) {
    return { key, data };
  }
  return null;
}

export class ReloadNotification {
  static create() {
    return new ReloadNotification();
  }
}
