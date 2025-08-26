import { HttpClient, HttpContext } from "@angular/common/http";
import { signal, Signal } from "@angular/core";
import { signalState, patchState } from "@ngrx/signals";
import { FilterMetadata } from "primeng/api";
import { Table, TableLazyLoadEvent } from "primeng/table";
import { firstValueFrom } from "rxjs";

import { SkipLoadingSpinner } from "./http-context-tokens";
import {
  DynamicQueryDto,
  DynamicQueryFilterDto,
  DynamicQuerySortDto,
  PagedDataResponse,
  PrimeNgTableState,
  PrimeNgTableStateHelperQueryParam,
  FilterTypeMapped,
  dynamicQueryResponseZodSchema
} from "./types";

/**
 * Initial state factory function for dynamic table
 */
function initialDynamicState<T>(): PrimeNgTableState<T> {
  return {
    data: [],
    isLoading: false,
    totalRecords: 0,
    size: 15,
    page: 1,
    filter: [],
    sort: []
  };
}

/**
 * Options for creating PrimeNgDynamicTableStateHelper
 */
type PrimeNgDynamicTableStateOpts = {
  url: string;
  httpClient: HttpClient;
  skipLoadingSpinner?: boolean;
};

/**
 * PrimeNG Dynamic Table State Helper class for managing table state with lazy loading, filtering, and sorting
 *
 * This helper provides advanced table functionality including:
 * - Lazy loading with pagination
 * - Column filtering with multiple filter types
 * - Multi-column sorting
 * - State management with NgRx Signals
 * - Automatic API integration
 * - Route parameter support
 * - Query parameter management
 *
 * @example
 * ```typescript
 * const tableState = PrimeNgDynamicTableStateHelper.create<User>({
 *   url: '/api/users',
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
export class PrimeNgDynamicTableStateHelper<T> {
  private readonly state = signalState<PrimeNgTableState<T>>(initialDynamicState<T>());
  private urlWithOutRouteParam: string;
  private skipLoadingSpinner: boolean;
  readonly #uniqueKey = signal("id");
  readonly uniqueKey = this.#uniqueKey.asReadonly();
  #queryParams: PrimeNgTableStateHelperQueryParam = {};

  // Public readonly signals
  readonly totalRecords: Signal<number> = this.state.totalRecords;
  readonly isLoading: Signal<boolean> = this.state.isLoading;
  readonly data: Signal<Array<T>> = this.state.data;

  private constructor(
    private url: string,
    private readonly httpClient: HttpClient,
    skipLoadingSpinner: boolean = true
  ) {
    this.urlWithOutRouteParam = url;
    this.skipLoadingSpinner = skipLoadingSpinner;
  }

  /**
   * Creates a new instance of PrimeNgDynamicTableStateHelper
   * @param options - Configuration options
   * @returns New instance of PrimeNgDynamicTableStateHelper
   */
  public static create<T>(
    options: PrimeNgDynamicTableStateOpts
  ): PrimeNgDynamicTableStateHelper<T> {
    return new PrimeNgDynamicTableStateHelper<T>(
      options.url,
      options.httpClient,
      options.skipLoadingSpinner ?? true
    );
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
    if (this.isLoading()) {
      return;
    }
    patchState(this.state, {
      size: event.rows || 15,
      page: Math.floor((event.first || 0) / (event.rows || 15)) + 1,
      filter: this.filterMapper(event.filters || {}),
      sort:
        Object.keys(event.multiSortMeta || {}).length > 0
          ? (event.multiSortMeta || []).map((sort: any) => ({
              field: sort.field,
              dir: (sort.order === 1 ? "asc" : "desc") as "asc" | "desc"
            }))
          : event.sortField
          ? [
              {
                field: event.sortField,
                dir: ((event.sortOrder || 1) === 1 ? "asc" : "desc") as "asc" | "desc"
              }
            ]
          : []
    });

    await this.fetchData(this.dtoBuilder());
  }

  /**
   * Clears table data and resets to first page
   * @param table - Optional PrimeNG Table reference to reset
   */
  public async clearTableData(table?: Table): Promise<void> {
    if (this.isLoading()) {
      return;
    }
    patchState(this.state, {
      data: [],
      totalRecords: 0,
      page: 1,
      filter: [],
      sort: []
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
    if (this.isLoading()) {
      return;
    }
    await this.fetchData(this.dtoBuilder());
  }

  /**
   * Fetches data from the API
   */
  private async fetchData(dto: DynamicQueryDto): Promise<void> {
    try {
      patchState(this.state, { isLoading: true });

      const params = new URLSearchParams();
      Object.entries(this.#queryParams).forEach(([key, value]) => {
        params.append(key, String(value));
      });

      const urlWithParams = params.toString() ? `${this.url}?${params.toString()}` : this.url;

      const response = await firstValueFrom(
        this.httpClient.post(urlWithParams, dto, {
          context: new HttpContext().set(SkipLoadingSpinner, this.skipLoadingSpinner)
        })
      );

      const validatedResponse = dynamicQueryResponseZodSchema.parse(response);

      patchState(this.state, {
        data: validatedResponse.data,
        totalRecords: validatedResponse.last_row,
        isLoading: false
      });
    } catch (error) {
      console.error("Error fetching table data:", error);
      patchState(this.state, {
        data: [],
        totalRecords: 0,
        isLoading: false
      });
    }
  }

  /**
   * Builds the DTO for API requests
   */
  private dtoBuilder(): DynamicQueryDto {
    return {
      size: this.state.size(),
      page: this.state.page(),
      filter: this.state.filter(),
      sort: this.state.sort()
    };
  }

  /**
   * Maps PrimeNG filters to API filter format
   */
  private filterMapper(
    dto: Record<string, FilterMetadata | FilterMetadata[] | undefined>
  ): DynamicQueryFilterDto[] {
    const filters: DynamicQueryFilterDto[] = [];

    Object.entries(dto).forEach(([field, filterData]) => {
      if (!filterData) return;

      const processFilter = (filter: FilterMetadata) => {
        if (filter.value === null || filter.value === undefined || filter.value === "") return;

        const mappedType = this.evaluateInput(filter.matchMode || "contains");
        if (mappedType) {
          filters.push({
            field,
            value: String(filter.value),
            type: mappedType
          });
        }
      };

      if (Array.isArray(filterData)) {
        filterData.forEach(processFilter);
      } else {
        processFilter(filterData);
      }
    });

    return filters;
  }

  /**
   * Maps PrimeNG filter match modes to API filter types
   */
  private evaluateInput(input: string): FilterTypeMapped | null {
    const filterMap: Record<string, FilterTypeMapped> = {
      startsWith: "starts",
      notStartsWith: "!starts",
      endsWith: "ends",
      notEndsWith: "!ends",
      contains: "like",
      notContains: "!like",
      equals: "=",
      notEquals: "!=",
      greaterThan: ">",
      lessThan: "<",
      greaterThanOrEqual: ">=",
      lessThanOrEqual: "<="
    };

    return filterMap[input] || null;
  }
}
