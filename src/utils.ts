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
