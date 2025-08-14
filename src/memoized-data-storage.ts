import { signal } from "@angular/core";
import { HttpClient, HttpContext } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { SkipLoadingSpinner } from "./http-context-tokens";

/**
 * A generic class for memoizing data storage with HTTP caching capabilities
 * Provides methods to load and cache single data objects or arrays with automatic loading states
 * 
 * @template T The type of data to be stored and managed
 * 
 * @example
 * ```typescript
 * interface User { id: number; name: string; }
 * 
 * const userStorage = new MemoizedDataStorage<User>(httpClient);
 * await userStorage.loadSingleData('/api/user/1');
 * console.log(userStorage.singleData()); // User data or null
 * 
 * const usersStorage = new MemoizedDataStorage<User>(httpClient);
 * await usersStorage.loadMultipleData('/api/users');
 * console.log(usersStorage.multipleData()); // Array of User data
 * ```
 */
export class MemoizedDataStorage<T> {
  /**
   * Creates a new instance of MemoizedDataStorage
   * @param httpClient Angular HttpClient instance for making HTTP requests
   */
  constructor(readonly httpClient: HttpClient) {}

  // Private signals for internal state management
  readonly #singleData = signal<T | null>(null);
  readonly #multipleData = signal<Array<T>>([]);
  readonly #isLoading = signal<boolean>(false);

  // Public readonly signals for external consumption
  /**
   * Read-only signal containing single data object or null
   */
  readonly singleData = this.#singleData.asReadonly();

  /**
   * Read-only signal containing array of data objects
   */
  readonly multipleData = this.#multipleData.asReadonly();

  /**
   * Read-only signal indicating whether a request is currently loading
   */
  readonly isLoading = this.#isLoading.asReadonly();

  // Private flag to control memoization behavior
  #isMemoizationDisabledOnNextRead = false;

  /**
   * Disables memoization for the next read operation and clears cached data
   * This forces the next loadSingleData or loadMultipleData call to fetch fresh data
   * 
   * @example
   * ```typescript
   * const storage = new MemoizedDataStorage<User>(httpClient);
   * await storage.loadSingleData('/api/user/1'); // Fetches data
   * await storage.loadSingleData('/api/user/1'); // Returns cached data
   * 
   * storage.disableMemoizationOnNextRead();
   * await storage.loadSingleData('/api/user/1'); // Fetches fresh data
   * ```
   */
  disableMemoizationOnNextRead(): void {
    this.#isMemoizationDisabledOnNextRead = true;
    this.#singleData.set(null);
    this.#multipleData.set([]);
  }

  /**
   * Loads a single data object from the specified URL with optional query parameters
   * Uses memoization to avoid redundant requests unless explicitly disabled
   * 
   * @param url The URL to fetch data from
   * @param queryParams Optional query parameters to include in the request
   * @returns Promise that resolves when the data is loaded
   * @throws Error if the HTTP request fails
   * 
   * @example
   * ```typescript
   * const storage = new MemoizedDataStorage<User>(httpClient);
   * await storage.loadSingleData('/api/user/1', { include: 'profile' });
   * const user = storage.singleData(); // User data or null
   * ```
   */
  async loadSingleData(
    url: string,
    queryParams: Record<string, string | number> = {}
  ): Promise<void> {
    // Skip loading if data is already cached and memoization is enabled
    if (!this.#isMemoizationDisabledOnNextRead && this.#singleData() !== null) {
      return;
    }

    try {
      this.#isLoading.set(true);
      const data = await firstValueFrom(
        this.httpClient.get<T>(url, {
          params: queryParams,
          context: new HttpContext().set(SkipLoadingSpinner, true)
        })
      );
      this.#singleData.set(data);
    } catch (error) {
      this.#singleData.set(null);
      throw error;
    } finally {
      this.#isLoading.set(false);
      this.#isMemoizationDisabledOnNextRead = false;
    }
  }

  /**
   * Loads multiple data objects from the specified URL with optional query parameters
   * Uses memoization to avoid redundant requests unless explicitly disabled
   * 
   * @param url The URL to fetch data from
   * @param queryParams Optional query parameters to include in the request
   * @returns Promise that resolves when the data is loaded
   * @throws Error if the HTTP request fails
   * 
   * @example
   * ```typescript
   * const storage = new MemoizedDataStorage<User>(httpClient);
   * await storage.loadMultipleData('/api/users', { page: 1, limit: 10 });
   * const users = storage.multipleData(); // Array of User data
   * ```
   */
  async loadMultipleData(
    url: string,
    queryParams: Record<string, string | number> = {}
  ): Promise<void> {
    // Skip loading if data is already cached and memoization is enabled
    if (
      !this.#isMemoizationDisabledOnNextRead &&
      this.#multipleData().length !== 0
    ) {
      return;
    }

    try {
      this.#isLoading.set(true);
      const data = await firstValueFrom(
        this.httpClient.get<Array<T>>(url, {
          params: queryParams,
          context: new HttpContext().set(SkipLoadingSpinner, true)
        })
      );
      this.#multipleData.set(Array.isArray(data) ? data : []);
    } catch (error) {
      this.#multipleData.set([]);
      throw error;
    } finally {
      this.#isLoading.set(false);
      this.#isMemoizationDisabledOnNextRead = false;
    }
  }

  /**
   * Clears all cached data and resets the storage to initial state
   * 
   * @example
   * ```typescript
   * const storage = new MemoizedDataStorage<User>(httpClient);
   * await storage.loadSingleData('/api/user/1');
   * storage.clear(); // Clears cached data
   * console.log(storage.singleData()); // null
   * console.log(storage.multipleData()); // []
   * ```
   */
  clear(): void {
    this.#singleData.set(null);
    this.#multipleData.set([]);
    this.#isMemoizationDisabledOnNextRead = false;
  }

  /**
   * Checks if single data is currently cached
   * @returns true if single data is cached, false otherwise
   */
  hasSingleData(): boolean {
    return this.#singleData() !== null;
  }

  /**
   * Checks if multiple data is currently cached
   * @returns true if multiple data is cached (non-empty array), false otherwise
   */
  hasMultipleData(): boolean {
    return this.#multipleData().length > 0;
  }
}
