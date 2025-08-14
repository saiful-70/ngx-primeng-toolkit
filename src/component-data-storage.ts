import { signal } from "@angular/core";

/**
 * A generic component data storage class using Angular signals
 * Provides reactive data management for both single objects and arrays
 * 
 * @template T The type of data to be stored and managed
 * 
 * @example
 * ```typescript
 * interface User {
 *   id: number;
 *   name: string;
 *   email: string;
 * }
 * 
 * @Component({
 *   selector: 'app-user-list',
 *   template: `
 *     <!-- Single user display -->
 *     @if (dataStorage.singleData(); as user) {
 *       <div>
 *         <h3>{{ user.name }}</h3>
 *         <p>{{ user.email }}</p>
 *       </div>
 *     }
 *     
 *     <!-- Multiple users display -->
 *     @for (user of dataStorage.multipleData(); track user.id) {
 *       <div>{{ user.name }} - {{ user.email }}</div>
 *     }
 *   `
 * })
 * export class UserListComponent {
 *   dataStorage = new ComponentDataStorage<User>();
 *   
 *   ngOnInit() {
 *     // Set initial data
 *     this.dataStorage
 *       .updateSingleData({ id: 1, name: 'John', email: 'john@example.com' })
 *       .updateMultipleData([
 *         { id: 1, name: 'John', email: 'john@example.com' },
 *         { id: 2, name: 'Jane', email: 'jane@example.com' }
 *       ]);
 *   }
 * }
 * ```
 */
export class ComponentDataStorage<T> {
  readonly singleData = signal<T | null>(null);
  readonly multipleData = signal<Array<T>>([]);

  /**
   * Patches multiple data by appending new data to the existing array
   * @param newData - Array of new data to append
   * @returns This instance for method chaining
   * 
   * @example
   * ```typescript
   * const storage = new ComponentDataStorage<User>();
   * storage.updateMultipleData([{ id: 1, name: 'John' }]);
   * storage.patchMultipleData([{ id: 2, name: 'Jane' }]);
   * // Result: [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }]
   * ```
   */
  public patchMultipleData(newData: Array<T>) {
    this.multipleData.update((prevData) => {
      return [...prevData, ...newData];
    }); 

    return this;
  }

  /**
   * Patches single data by merging new properties with existing data
   * If no existing data, creates new object with provided data
   * @param newData - Partial data to merge with existing single data
   * @returns This instance for method chaining
   * 
   * @example
   * ```typescript
   * const storage = new ComponentDataStorage<User>();
   * storage.updateSingleData({ id: 1, name: 'John', email: 'john@example.com' });
   * storage.patchSingleData({ email: 'john.doe@example.com' });
   * // Result: { id: 1, name: 'John', email: 'john.doe@example.com' }
   * ```
   */
  public patchSingleData(newData: Partial<T>) {
    this.singleData.update((prev) => prev ? { ...prev, ...newData } : { ...newData } as T);
    return this;
  }

  /**
   * Replaces the entire multiple data array
   * @param newData - New array of data to replace existing data
   * @returns This instance for method chaining
   */
  public updateMultipleData(newData: Array<T>) {
    this.multipleData.set(newData);
    return this;
  }

  /**
   * Replaces the single data object
   * @param newData - New data object or null to replace existing data
   * @returns This instance for method chaining
   */
  public updateSingleData(newData: T | null) {
    this.singleData.set(newData);
    return this;
  }

  /**
   * Adds a single item to the multiple data array
   * @param item - Single item to add to the array
   * @returns This instance for method chaining
   */
  public addToMultipleData(item: T) {
    this.multipleData.update(prevData => [...prevData, item]);
    return this;
  }

  /**
   * Removes an item from the multiple data array based on a predicate function
   * @param predicate - Function that returns true for items to remove
   * @returns This instance for method chaining
   * 
   * @example
   * ```typescript
   * storage.removeFromMultipleData(user => user.id === 1);
   * ```
   */
  public removeFromMultipleData(predicate: (item: T) => boolean) {
    this.multipleData.update(prevData => prevData.filter(item => !predicate(item)));
    return this;
  }

  /**
   * Updates an item in the multiple data array based on a predicate function
   * @param predicate - Function that returns true for items to update
   * @param updateFn - Function that returns the updated item
   * @returns This instance for method chaining
   * 
   * @example
   * ```typescript
   * storage.updateItemInMultipleData(
   *   user => user.id === 1,
   *   user => ({ ...user, name: 'Updated Name' })
   * );
   * ```
   */
  public updateItemInMultipleData(predicate: (item: T) => boolean, updateFn: (item: T) => T) {
    this.multipleData.update(prevData => 
      prevData.map(item => predicate(item) ? updateFn(item) : item)
    );
    return this;
  }

  /**
   * Clears all data (both single and multiple)
   * @returns This instance for method chaining
   */
  public clearAll() {
    this.singleData.set(null);
    this.multipleData.set([]);
    return this;
  }

  /**
   * Clears only the single data
   * @returns This instance for method chaining
   */
  public clearSingleData() {
    this.singleData.set(null);
    return this;
  }

  /**
   * Clears only the multiple data
   * @returns This instance for method chaining
   */
  public clearMultipleData() {
    this.multipleData.set([]);
    return this;
  }

  /**
   * Checks if single data exists (is not null)
   * @returns true if single data exists, false otherwise
   */
  public hasSingleData(): boolean {
    return this.singleData() !== null;
  }

  /**
   * Checks if multiple data has items
   * @returns true if multiple data array has items, false if empty
   */
  public hasMultipleData(): boolean {
    return this.multipleData().length > 0;
  }

  /**
   * Gets the count of items in multiple data
   * @returns Number of items in the multiple data array
   */
  public getMultipleDataCount(): number {
    return this.multipleData().length;
  }

  /**
   * Finds an item in the multiple data array
   * @param predicate - Function that returns true for the item to find
   * @returns The found item or undefined
   */
  public findInMultipleData(predicate: (item: T) => boolean): T | undefined {
    return this.multipleData().find(predicate);
  }

  /**
   * Checks if an item exists in the multiple data array
   * @param predicate - Function that returns true for the item to check
   * @returns true if item exists, false otherwise
   */
  public existsInMultipleData(predicate: (item: T) => boolean): boolean {
    return this.multipleData().some(predicate);
  }
}
