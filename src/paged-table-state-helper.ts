import { HttpClient, HttpContext } from '@angular/common/http';
import { signal, Signal } from '@angular/core';
import { signalState, patchState } from '@ngrx/signals';
import { Table, TableLazyLoadEvent } from 'primeng/table';
import { firstValueFrom } from 'rxjs';

import { SkipLoadingSpinner } from './http-context-tokens';
import {
  PagedDataResponse,
  PrimeNgPagedTableState,
  PagedDataQueryDto,
  PrimeNgTableStateHelperQueryParam,
  PagedDataResponseZodSchema
} from './types';

/**
 * Initial state factory function for paged table
 */
function initialPagedState<T>(): PrimeNgPagedTableState<T> {
  return {
    data: [],
    isLoading: false,
    totalRecords: 0,
    limit: 15,
    page: 1
  };
}

/**
 * Options for creating PrimengPagedDataTableStateHelper
 */
type PrimeNgPagedTableStateOpts = {
  url: string;
  httpClient: HttpClient;
  skipLoadingSpinner?: boolean;
};

/**
 * Simple paged data table state helper for basic pagination without filtering
 * 
 * This helper provides basic table functionality including:
 * - Simple pagination (page and limit only)
 * - Basic state management with NgRx Signals
 * - API integration for paged data
 * - Route parameter support
 * - Query parameter management
 * 
 * Use this when you need simple pagination without complex filtering and sorting.
 * For advanced features, use PrimeNgDynamicTableStateHelper instead.
 * 
 * @example
 * ```typescript
 * const tableState = PrimengPagedDataTableStateHelper.create<Product>({
 *   url: '/api/products',
 *   httpClient: this.httpClient
 * });
 * 
 * // In template
 * <p-table [value]="tableState.data()"
 *          [lazy]="true"
 *          [loading]="tableState.isLoading()"
 *          [totalRecords]="tableState.totalRecords()"
 *          (onLazyLoad)="tableState.onLazyLoad($event)">
 * </p-table>
 * ```
 */
export class PrimengPagedDataTableStateHelper<T> {
  readonly #state = signalState<PrimeNgPagedTableState<T>>(initialPagedState<T>());
  private urlWithOutRouteParam: string;
  private skipLoadingSpinner: boolean;
  readonly #uniqueKey = signal("id");
  readonly uniqueKey = this.#uniqueKey.asReadonly();
  #queryParams: PrimeNgTableStateHelperQueryParam = {};

  // Public readonly signals
  readonly totalRecords: Signal<number> = this.#state.totalRecords;
  readonly isLoading: Signal<boolean> = this.#state.isLoading;
  readonly data: Signal<Array<T>> = this.#state.data;
  readonly currentPage = this.#state.page;
  readonly currentPageSize = this.#state.limit;

  private constructor(
    private url: string,
    private readonly httpClient: HttpClient,
    skipLoadingSpinner: boolean = true
  ) {
    this.urlWithOutRouteParam = url;
    this.skipLoadingSpinner = skipLoadingSpinner;
  }

  /**
   * Creates a new instance of PrimengPagedDataTableStateHelper
   * @param option - Configuration options
   * @returns New instance of PrimengPagedDataTableStateHelper
   */
  public static create<T>(option: PrimeNgPagedTableStateOpts): PrimengPagedDataTableStateHelper<T> {
    return new PrimengPagedDataTableStateHelper<T>(option.url, option.httpClient, option.skipLoadingSpinner ?? true);
  }

  /**
   * Creates a new instance without initial URL (can be set later)
   * @param option - Configuration options without URL
   * @returns New instance of PrimengPagedDataTableStateHelper
   */
  public static createWithBlankUrl<T>(
    option: Omit<PrimeNgPagedTableStateOpts, "url">
  ): PrimengPagedDataTableStateHelper<T> {
    return new PrimengPagedDataTableStateHelper<T>("", option.httpClient, option.skipLoadingSpinner ?? true);
  }

  /**
   * Sets whether to skip the loading spinner
   * @param skip - Whether to skip the loading spinner
   * @returns This instance for method chaining
   */
  public setSkipLoadingSpinner(skip: boolean): this {
    this.skipLoadingSpinner = skip;
    return this;
  }

  /**
   * Sets the unique key field for table rows
   * @param newUniqueKey - The field name to use as unique identifier
   * @returns This instance for method chaining
   */
  public setUniqueKey(newUniqueKey: string): this {
    this.#uniqueKey.set(newUniqueKey);
    return this;
  }

  /**
   * Updates the API URL
   * @param newUrl - The new API URL
   * @returns This instance for method chaining
   */
  public setUrl(newUrl: string): this {
    this.url = newUrl;
    this.urlWithOutRouteParam = newUrl;
    return this;
  }

  /**
   * Appends a route parameter to the URL
   * @param newRouteParam - The route parameter to append
   * @returns This instance for method chaining
   */
  public setRouteParam(newRouteParam: string): this {
    this.url = `${this.urlWithOutRouteParam}/${newRouteParam}`;
    return this;
  }

  /**
   * Patches existing query parameters
   * @param value - Query parameters to merge
   * @returns This instance for method chaining
   */
  public patchQueryParams(value: PrimeNgTableStateHelperQueryParam): this {
    this.#queryParams = { ...this.#queryParams, ...value };
    return this;
  }

  /**
   * Removes a specific query parameter
   * @param key - The key to remove
   * @returns This instance for method chaining
   */
  public removeQueryParam(key: string): this {
    delete this.#queryParams[key];
    return this;
  }

  /**
   * Removes all query parameters
   * @returns This instance for method chaining
   */
  public removeAllQueryParams(): this {
    this.#queryParams = {};
    return this;
  }

  /**
   * Sets all query parameters (replaces existing)
   * @param newQueryParams - New query parameters
   * @returns This instance for method chaining
   */
  public setQueryParams(newQueryParams: PrimeNgTableStateHelperQueryParam): this {
    this.#queryParams = newQueryParams;
    return this;
  }

  /**
   * Handles PrimeNG table lazy load events
   * @param event - The lazy load event from PrimeNG table
   */
  public async onLazyLoad(event: TableLazyLoadEvent): Promise<void> {
    const newPage = Math.floor((event.first || 0) / (event.rows || 15)) + 1;
    const newLimit = event.rows || 15;

    patchState(this.#state, {
      limit: newLimit,
      page: newPage
    });

    await this.fetchData(this.dtoBuilder());
  }

  /**
   * Clears table data and resets to first page
   * @param table - Optional PrimeNG Table reference to reset
   */
  public async clearTableData(table?: Table): Promise<void> {
    patchState(this.#state, {
      data: [],
      totalRecords: 0,
      page: 1
    });

    if (table) {
      table.reset();
    }

    await this.fetchData(this.dtoBuilder());
  }

  /**
   * Manually triggers data refresh with current state
   */
  public async refresh(): Promise<void> {
    await this.fetchData(this.dtoBuilder());
  }

  /**
   * Fetches data from the API
   */
  private async fetchData(dto: PagedDataQueryDto): Promise<void> {
    try {
      patchState(this.#state, { isLoading: true });

      const params = new URLSearchParams();
      Object.entries(this.#queryParams).forEach(([key, value]) => {
        params.append(key, String(value));
      });
      Object.entries(dto).forEach(([key, value]) => {
        params.append(key, String(value));
      });

      const urlWithParams = params.toString() 
        ? `${this.url}?${params.toString()}`
        : this.url;

      const response = await firstValueFrom(
        this.httpClient.get(urlWithParams, { context: new HttpContext().set(SkipLoadingSpinner, this.skipLoadingSpinner) })
      );

      const validatedResponse = PagedDataResponseZodSchema.parse(response);

      patchState(this.#state, {
        data: validatedResponse.payload,
        totalRecords: validatedResponse.totalCount,
        isLoading: false
      });
    } catch (error) {
      console.error('Error fetching paged data:', error);
      patchState(this.#state, {
        data: [],
        totalRecords: 0,
        isLoading: false
      });
    }
  }

  /**
   * Builds the DTO for API requests
   */
  private dtoBuilder(): PagedDataQueryDto {
    return {
      limit: this.#state.limit(),
      page: this.#state.page()
    };
  }
}
