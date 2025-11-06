import { KeyData } from "./types";
import { HttpResourceRef } from "@angular/common/http";
import {
  assertInInjectionContext,
  effect,
  inject,
  Injector,
  runInInjectionContext
} from "@angular/core";
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
  constructor() {}
  static create() {
    return new ReloadNotification();
  }
}

export class GenericNotification<T = any> {
  public readonly payload: T[];

  constructor(...payload: T[]) {
    this.payload = payload;
  }

  static create<T>(...payload: T[]) {
    return new GenericNotification<T>(...payload);
  }
}

export function throwResourceError<T = any>(resorce: HttpResourceRef<T>, injector?: Injector) {
  !injector && assertInInjectionContext(throwResourceError);
  const assertedInjector = injector ?? inject(Injector);

  runInInjectionContext(assertedInjector, () => {
    effect(() => {
      const status = resorce.status();

      if (status === "error") {
        throw resorce.error();
      }
    });
  });
}

/**
 * Represents a tree node structure compatible with PrimeNG TreeNode
 * @template T The type of data stored in the node
 */
export type TreeNode<T> = {
  data: T;
  children?: TreeNode<T>[];
};

/**
 * Creates a hierarchical tree structure from flat array data
 *
 * Converts a flat array of items with parent-child relationships into a tree structure
 * compatible with PrimeNG Tree component.
 *
 * @template T The type of items in the array
 * @param data Array of flat data items
 * @param idKey The property name that contains the unique identifier
 * @param parentIdKey The property name that contains the parent identifier
 * @returns Array of root tree nodes with nested children
 *
 * @example
 * ```typescript
 * interface Category {
 *   id: number;
 *   name: string;
 *   parentCategoryId: number | null;
 * }
 *
 * const categories: Category[] = [
 *   { id: 1, name: 'Electronics', parentCategoryId: null },
 *   { id: 2, name: 'Computers', parentCategoryId: 1 },
 *   { id: 3, name: 'Laptops', parentCategoryId: 2 }
 * ];
 *
 * const tree = createHierarchicalTree(categories, 'id', 'parentCategoryId');
 * // Result: Tree structure with Electronics -> Computers -> Laptops
 * ```
 */
export function createHierarchicalTree<T extends Record<string, any>>(
  data: Array<T>,
  idKey: string,
  parentIdKey: string,
  expanded: boolean = false
): TreeNode<T>[] {
  if (!Array.isArray(data)) {
    throw new Error("data must be an array");
  }

  // Create a map for quick lookup and convert to TreeNode format
  const categoryMap = new Map<string | number, TreeNode<T>>(
    data.map((item) => {
      if (!Object.hasOwn(item, idKey) || !Object.hasOwn(item, parentIdKey)) {
        throw new Error("idKey or parentIdKey is missing", { cause: item });
      }
      return [
        item[idKey],
        {
          data: item,
          children: [],
          expanded
        }
      ];
    })
  );

  const rootNodes: TreeNode<T>[] = [];

  // Build the tree by linking children to their parents
  data.forEach((item) => {
    const parentId = item[parentIdKey];

    if (parentId != null && categoryMap.has(parentId)) {
      // Add to parent's children list
      const parent = categoryMap.get(parentId)!;
      parent.children!.push(categoryMap.get(item[idKey])!);
    } else {
      // No parent means this is a root node
      rootNodes.push(categoryMap.get(item[idKey])!);
    }
  });

  return rootNodes;
}
