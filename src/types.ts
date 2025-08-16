import { FilterMetadata } from 'primeng/api';
import { z } from 'zod';

// ===============================================================================
// TypeScript Utility Types
// ===============================================================================

/**
 * Makes all properties of T nullable (T | null)
 * @template T - The type to make nullable
 * @example
 * ```typescript
 * type User = { id: number; name: string; email: string };
 * type NullableUser = RecursiveNullable<User>;
 * // Result: { id: number | null; name: string | null; email: string | null }
 * ```
 */
export type RecursiveNullable<T> = {
  [P in keyof T]: T[P] | null;
};

/**
 * Represents a value that can be null or undefined
 * @template T - The base type
 * @example
 * ```typescript
 * type MaybeString = Nullish<string>; // string | null | undefined
 * ```
 */
export type Nullish<T> = T | null | undefined;

/**
 * Makes all properties of T nullish (T | null | undefined) recursively
 * @template T - The type to make nullish
 * @example
 * ```typescript
 * type User = { id: number; profile: { name: string; age: number } };
 * type NullishUser = RecursiveNullish<User>;
 * // Result: { 
 * //   id: number | null | undefined; 
 * //   profile: { 
 * //     name: string | null | undefined; 
 * //     age: number | null | undefined 
 * //   } | null | undefined 
 * // }
 * ```
 */
export type RecursiveNullish<T> = {
  [P in keyof T]: T[P] extends object
    ? RecursiveNullish<T[P]> | null | undefined
    : T[P] | null | undefined;
};

/**
 * Makes all properties optional recursively, useful for partial updates
 * @template T - The type to make recursively partial
 * @example
 * ```typescript
 * type User = { 
 *   id: number; 
 *   profile: { name: string; age: number }; 
 *   settings: { theme: string; notifications: boolean } 
 * };
 * type PartialUser = RecursivePartial<User>;
 * // Result: { 
 * //   id?: number; 
 * //   profile?: { name?: string; age?: number }; 
 * //   settings?: { theme?: string; notifications?: boolean } 
 * // }
 * ```
 */
export type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends object ? RecursivePartial<T[P]> : T[P];
};

// ===============================================================================
// Core Data Types
// ===============================================================================

/**
 * Enumeration for manipulation types in component operations
 * Used for tracking the current operation state in component management
 * 
 * @example
 * ```typescript
 * // In a component
 * currentOperation: ManipulationType = ManipulationType.Create;
 * 
 * // Check operation type
 * if (this.currentOperation === ManipulationType.Update) {
 *   // Handle update logic
 * }
 * ```
 */
export enum ManipulationType {
  /** Creating a new item */
  Create = "Create",
  /** Updating an existing item */
  Update = "Update", 
  /** Creating a child item */
  CreateChild = "Create Child",
  /** Deleting an item */
  Delete = "Delete",
  /** Viewing item details */
  View = "View"
}

/**
 * Key-value pair type for common data structures
 * @template K The type of the key
 * @template D The type of the data
 */
export interface KeyData<K, D> {
  key: K;
  data: D;
}

/**
 * Common API response wrapper type
 * @template T The type of the data payload
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
  success: boolean;
}

/**
 * Pagination metadata interface
 */
export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Paginated response type
 * @template T The type of the data items
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Query parameters for pagination
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Common sort parameters
 */
export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Combined query parameters for API requests
 */
export type QueryParams = Record<string, string | number | boolean> & 
  Partial<PaginationParams> & 
  Partial<SortParams>;

// ===============================================================================
// Table State Types
// ===============================================================================

/**
 * String filter types for PrimeNG table filtering
 */
export type StringFilterType =
  | "startsWith"
  | "notStartsWith"
  | "endsWith"
  | "notEndsWith"
  | "contains"
  | "notContains";

/**
 * Numeric filter types for PrimeNG table filtering
 */
export type NumericFilterType =
  | "equals"
  | "notEquals"
  | "greaterThan"
  | "lessThan"
  | "greaterThanOrEqual"
  | "lessThanOrEqual";

/**
 * Boolean filter types for PrimeNG table filtering
 */
export type BooleanFilterType = Extract<NumericFilterType, "equals" | "notEquals">;

/**
 * Combined filter types
 */
export type FilterType = StringFilterType | NumericFilterType;

/**
 * Filter type mappings for backend API
 */
export type FilterTypeMapped =
  | "starts"
  | "!starts"
  | "ends"
  | "!ends"
  | "like"
  | "!like"
  | "="
  | "!="
  | ">"
  | "<"
  | ">="
  | "<=";

/**
 * PrimeNG table header configuration interface
 */
export interface PrimeNgTableHeader {
  identifier: {
    label?: string;
    field: string;
    hasSort?: boolean;
    isBoolean?: boolean;
    styleClass?: string;
  };
  filter?: {
    type: "text" | "numeric" | "boolean" | "date" | "dropdown" | "multiselect";
    placeholder?: string;
    matchModeOptions?: any[];
    defaultMatchMode: FilterType;
    ariaLabel?: string;
    colspan?: number;
    styleClass?: Record<string, string>;
  };
}

/**
 * Dynamic query DTO interface
 */
export interface DynamicQueryDto {
  size: number;
  page: number;
  filter: DynamicQueryFilterDto[];
  sort: DynamicQuerySortDto[];
}

/**
 * Filter DTO for dynamic queries
 */
export interface DynamicQueryFilterDto {
  field: string;
  value: string;
  type: FilterTypeMapped;
}

/**
 * Sort DTO for dynamic queries
 */
export interface DynamicQuerySortDto {
  field: string;
  dir: "asc" | "desc";
}

/**
 * Paged data response interface
 */
export interface PagedDataResponse<T> {
  data: T[];
  last_page: number;
  last_row: number;
}

/**
 * Paged data response interface for simple pagination
 */
export interface SimplePagedDataResponse<T> {
  payload: T[];
  totalCount: number;
}

/**
 * Internal table state interface for dynamic table
 */
export interface PrimeNgTableState<T> {
  data: Array<T>;
  isLoading: boolean;
  size: number;
  page: number;
  totalRecords: number;
  filter: DynamicQueryFilterDto[];
  sort: DynamicQuerySortDto[];
}

/**
 * Internal state interface for paged table
 */
export interface PrimeNgPagedTableState<T> {
  data: Array<T>;
  isLoading: boolean;
  totalRecords: number;
  limit: number;
  page: number;
}

/**
 * Query DTO interface for paged data requests
 */
export interface PagedDataQueryDto {
  limit: number;
  page: number;
}

/**
 * Query parameters type for additional HTTP request parameters
 */
export type PrimeNgTableStateHelperQueryParam = Record<string, string | number | boolean>;

// ===============================================================================
// Zod Schemas
// ===============================================================================

/**
 * Zod schema for dynamic query response validation
 */
export const dynamicQueryResponseZodSchema = z.object({
  data: z.any().array(),
  last_page: z.number(),
  last_row: z.number()
});

/**
 * Zod schema for paged data response validation
 */
export const PagedDataResponseZodSchema = z.object({
  payload: z.any().array(),
  totalCount: z.number()
});

// ===============================================================================
// Utility Functions and Type Guards
// ===============================================================================

/**
 * Error response interface
 */
export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
}

/**
 * Creates a key-value pair object
 * @param key The key value
 * @param data The data value
 * @returns KeyData object
 */
export function createKeyData<K, D>(key: K, data: D): KeyData<K, D> {
  return { key, data };
}

/**
 * Type guard to check if a response is an API response
 * @param response The response to check
 * @returns true if response is ApiResponse, false otherwise
 */
export function isApiResponse<T>(response: any): response is ApiResponse<T> {
  return (
    typeof response === 'object' &&
    response !== null &&
    'data' in response &&
    'status' in response &&
    'success' in response
  );
}

/**
 * Type guard to check if a response is paginated
 * @param response The response to check
 * @returns true if response is PaginatedResponse, false otherwise
 */
export function isPaginatedResponse<T>(response: any): response is PaginatedResponse<T> {
  return (
    typeof response === 'object' &&
    response !== null &&
    'data' in response &&
    Array.isArray(response.data) &&
    'meta' in response &&
    typeof response.meta === 'object'
  );
}

/**
 * Type guard to check if a response is a simple paged response
 * @param response The response to check
 * @returns true if response is SimplePagedDataResponse, false otherwise
 */
export function isSimplePagedResponse<T>(response: any): response is SimplePagedDataResponse<T> {
  return (
    typeof response === 'object' &&
    response !== null &&
    'payload' in response &&
    Array.isArray(response.payload) &&
    'totalCount' in response &&
    typeof response.totalCount === 'number'
  );
}

/**
 * Type guard to check if a response is a dynamic query response
 * @param response The response to check
 * @returns true if response is PagedDataResponse, false otherwise
 */
export function isDynamicQueryResponse<T>(response: any): response is PagedDataResponse<T> {
  return (
    typeof response === 'object' &&
    response !== null &&
    'data' in response &&
    Array.isArray(response.data) &&
    'last_page' in response &&
    'last_row' in response
  );
}
