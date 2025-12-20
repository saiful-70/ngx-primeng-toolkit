import { HttpClient, HttpContext, HttpContextToken, HttpParams } from "@angular/common/http";
import {
  assertInInjectionContext,
  computed,
  DestroyRef,
  effect,
  inject,
  InjectionToken,
  Injector,
  isDevMode,
  isSignal,
  Provider,
  runInInjectionContext,
  signal,
  Signal,
  untracked
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { LazyLoadMeta } from "primeng/api";
import { TableLazyLoadEvent } from "primeng/table";
import {
  catchError,
  defer,
  filter,
  finalize,
  Observable,
  of,
  Subject,
  switchMap,
  takeUntil
} from "rxjs";
import { cleanNullishFromObject } from "./utils";

export const OffsetPaginatedPrimeNgTableStateNetworkRequest = new HttpContextToken(() => false);

type DataContainer<T> = {
  payload: T[];
  totalCount: number;
};
export class PostRequestBody {
  constructor(public readonly payload: any) {}
}

export type FilterAndSortFn = (meta: LazyLoadMeta) => HttpParams | PostRequestBody;

export type OffsetPaginatedPrimeNgTableStateOptions = {
  predicate?: Signal<boolean>;
  pageQueryParamKey?: string;
  limitQueryParamKey?: string;
  dataArrayKey?: string;
  totalDataCountKey?: string;
  requestMethod?: "GET" | "POST";
  queryParams?: Record<string, string | number | boolean>;
  injector?: Injector;
  httpContext?: HttpContext;
  filterAndSortHandler?: FilterAndSortFn;
  onError?: (error: Error) => void;
};

export type OffsetPaginatedPrimeNgTableStateConfig = Omit<
  OffsetPaginatedPrimeNgTableStateOptions,
  "injector" | "httpContext" | "predicate" | "queryParams"
>;

type DefaultOptions = Omit<
  Required<OffsetPaginatedPrimeNgTableStateOptions>,
  "injector" | "httpContext" | "predicate" | "onError" | "filterAndSortHandler"
> & {
  onError?: (error: Error) => void;
};

const optionsWithDefaultValue: DefaultOptions = {
  pageQueryParamKey: "page",
  limitQueryParamKey: "limit",
  dataArrayKey: "payload",
  totalDataCountKey: "totalCount",
  requestMethod: "GET",
  queryParams: {}
};

const OFFSET_PAGINATED_PRIME_NG_TABLE_STATE_CONFIG = new InjectionToken<DefaultOptions>(
  "OFFSET_PAGINATED_PRIME_NG_TABLE_STATE_CONFIG",
  {
    providedIn: "root",
    factory: () => optionsWithDefaultValue
  }
);

export function provideOffsetPaginatedPrimeNgTableStateConfig(
  configFactory: () => OffsetPaginatedPrimeNgTableStateConfig
): Provider {
  return {
    provide: OFFSET_PAGINATED_PRIME_NG_TABLE_STATE_CONFIG,
    useFactory: () => {
      const config = configFactory();
      return { ...optionsWithDefaultValue, ...config };
    }
  };
}

export interface OffsetPaginatedPrimeNgTableStateRef<T> {
  predicate: Signal<boolean>;
  totalRecords: Signal<number>;
  data: Signal<T[]>;
  isLoading: Signal<boolean>;
  queryParams: Signal<Record<string, string | number | boolean>>;
  onLazyLoad(event: TableLazyLoadEvent): void;
  patchQueryParams(value: Record<string, string | number | boolean>): this;
  removeQueryParam(key: string): this;
  removeAllQueryParams(): this;
}

function isValidData(dataArrayKey: string, dataCountKey: string, rawData: any): boolean {
  if (typeof rawData !== "object" || rawData === null || Array.isArray(rawData)) {
    return false;
  }

  if (!(dataArrayKey in rawData) || !(dataCountKey in rawData)) {
    return false;
  }

  if (!Array.isArray(rawData[dataArrayKey])) {
    return false;
  }

  if (typeof rawData[dataCountKey] !== "number") {
    return false;
  }

  return true;
}

function defaultData<T>() {
  return {
    payload: [] as T[],
    totalCount: 0
  } satisfies DataContainer<T>;
}

export function offsetPaginatedPrimeNgTableState<T>(
  url: string | Signal<string>,
  options?: OffsetPaginatedPrimeNgTableStateOptions
): OffsetPaginatedPrimeNgTableStateRef<T> {
  if (isDevMode() && !options?.injector) {
    assertInInjectionContext(offsetPaginatedPrimeNgTableState);
  }

  const assertedInjector = options?.injector ?? inject(Injector);

  return runInInjectionContext(assertedInjector, () => {
    const http = inject(HttpClient);
    const destroyRef = inject(DestroyRef);
    const configFromDi = inject(OFFSET_PAGINATED_PRIME_NG_TABLE_STATE_CONFIG);

    const mergedOptions: DefaultOptions & {
      httpContext: HttpContext;
      predicate?: Signal<boolean>;
      filterAndSortHandler?: FilterAndSortFn;
    } = {
      ...configFromDi,
      ...cleanNullishFromObject(options),
      httpContext: options?.httpContext ?? new HttpContext(),
      onError: options?.onError ?? configFromDi.onError
    };

    const blackListedQueryKeys = [
      mergedOptions.pageQueryParamKey,
      mergedOptions.limitQueryParamKey
    ].map((elem) => elem.toLowerCase());

    Object.keys(mergedOptions.queryParams).forEach((key) => {
      if (blackListedQueryKeys.includes(key.toLowerCase())) {
        delete mergedOptions.queryParams[key];
      }
    });

    const internalState = Object.seal({
      apiCallNotification: new Subject<void>(),
      apiCallAbortNotifier: new Subject<void>(),
      isLoading: signal(false),
      currentPage: signal(1),
      currentLimit: signal(15),
      totalRecords: signal(0),
      loadedData: signal(defaultData<T>()),
      predicate: mergedOptions.predicate ?? signal(true),
      queryParamsFromUser: signal<Record<string, string | number | boolean>>(
        mergedOptions.queryParams
      ),
      postRequestBodyFromLazyLoad: signal<any>(null),
      queryParamsFromLazyLoad: signal<HttpParams | null>(null)
    });

    const finalQueryParams = computed(() => {
      const val: Record<string, string | number | boolean> = {
        [mergedOptions.pageQueryParamKey]: internalState.currentPage(),
        [mergedOptions.limitQueryParamKey]: internalState.currentLimit(),
        ...cleanNullishFromObject(internalState.queryParamsFromUser()),
        ...cleanNullishFromObject(internalState.queryParamsFromLazyLoad() ?? {})
      };

      return val;
    });

    effect(() => {
      const predicate = internalState.predicate();
      untracked(() => {
        if (!predicate) {
          internalState.apiCallAbortNotifier.next();
        }
      });
    });

    destroyRef.onDestroy(() => {
      if (!internalState.apiCallNotification.closed) {
        internalState.apiCallNotification.complete();
      }

      if (!internalState.apiCallAbortNotifier.closed) {
        internalState.apiCallAbortNotifier.next();
        internalState.apiCallAbortNotifier.complete();
      }
    });

    const loadDataFromApi = () => {
      const apiUrl = isSignal(url) ? url() : url;
      let req: Observable<Object>;

      switch (mergedOptions.requestMethod) {
        case "GET":
          req = defer(() => {
            internalState.isLoading.set(true);
            return http.get(apiUrl, {
              params: { ...finalQueryParams() },
              context: mergedOptions.httpContext.set(
                OffsetPaginatedPrimeNgTableStateNetworkRequest,
                true
              )
            });
          });
          break;

        case "POST":
          req = defer(() => {
            internalState.isLoading.set(true);
            return http.post(apiUrl, internalState.postRequestBodyFromLazyLoad(), {
              params: { ...finalQueryParams() },
              context: mergedOptions.httpContext.set(
                OffsetPaginatedPrimeNgTableStateNetworkRequest,
                true
              )
            });
          });
          break;

        default:
          throw new Error("Invalid/unsupported request method");
      }

      return req.pipe(
        switchMap((rawData: any) => {
          if (!isValidData(mergedOptions.dataArrayKey, mergedOptions.totalDataCountKey, rawData)) {
            throw new Error(
              `The response body must be an object. Valid example: { ${mergedOptions.dataArrayKey}: [], ${mergedOptions.totalDataCountKey}: 0 }`
            );
          }

          const dataInContainer: DataContainer<T> = {
            payload: rawData[mergedOptions.dataArrayKey] ?? [],
            totalCount: rawData[mergedOptions.totalDataCountKey] ?? 0
          };

          return of(dataInContainer);
        }),
        catchError((error) => {
          if (mergedOptions.onError) {
            try {
              mergedOptions.onError(error);
            } catch (errorFromHandler) {
              console.warn(
                "Exception in onError is handled internally to keep observable running.",
                errorFromHandler
              );
            }
          }
          console.error(error);
          return of(null);
        }),
        finalize(() => internalState.isLoading.set(false)),
        takeUntil(internalState.apiCallAbortNotifier)
      );
    };

    const handleApiResponse = (newData: DataContainer<T>) => {
      internalState.loadedData.set({
        payload: newData.payload,
        totalCount: newData.totalCount
      } satisfies DataContainer<T>);

      internalState.totalRecords.set(newData.totalCount);
    };

    internalState.apiCallNotification
      .pipe(
        switchMap(() => {
          if (internalState.isLoading()) {
            return of(null);
          } else if (!internalState.predicate()) {
            return of(defaultData<T>());
          } else {
            return loadDataFromApi();
          }
        }),
        filter((val) => val !== null),
        takeUntilDestroyed(destroyRef)
      )
      .subscribe((data) => {
        handleApiResponse(data);
      });

    return Object.seal({
      queryParams: finalQueryParams,
      predicate: internalState.predicate,
      totalRecords: internalState.totalRecords.asReadonly(),
      data: computed(() => {
        return internalState.loadedData().payload;
      }),
      isLoading: internalState.isLoading.asReadonly(),
      onLazyLoad(event: TableLazyLoadEvent) {
        const offset = event.first || 0;
        const limit = event.rows || 15;
        const currentPage = Math.floor(offset / limit) + 1;

        internalState.currentPage.set(currentPage);
        internalState.currentLimit.set(limit);

        if (mergedOptions.filterAndSortHandler) {
          const handledResult = mergedOptions.filterAndSortHandler(event);
          if (handledResult instanceof HttpParams) {
            internalState.queryParamsFromLazyLoad.set(handledResult);
          } else if (handledResult instanceof PostRequestBody) {
            internalState.postRequestBodyFromLazyLoad.set(handledResult.payload);
          }
        }

        internalState.apiCallNotification.next();
      },

      patchQueryParams(value: Record<string, string | number | boolean>) {
        const newValue = { ...value };

        Object.keys(newValue).forEach((key) => {
          if (blackListedQueryKeys.includes(key.toLowerCase())) {
            delete newValue[key];
          }
        });

        if (Object.keys(newValue).length > 0) {
          internalState.queryParamsFromUser.update((currentValue) => {
            return {
              ...currentValue,
              ...newValue
            };
          });
        }

        return this;
      },
      removeQueryParam(key: string) {
        internalState.queryParamsFromUser.update((currentValue) => {
          const { [key]: _, ...rest } = currentValue;
          return rest;
        });
        return this;
      },
      removeAllQueryParams() {
        internalState.queryParamsFromUser.set({});
        return this;
      }
    });
  });
}

export const UrlBasedDynamicQuery = {
  Contains: "con",
  NotContains: "ntcon",
  StartsWith: "sw",
  NotStartsWith: "ntsw",
  EndsWith: "ew",
  NotEndsWith: "ntew",
  Equal: "eq",
  NotEquals: "nteq",
  GreaterThan: "gt",
  GreaterThanEqual: "gte",
  LessThan: "lt",
  LessThanEqual: "lte"
} as const;

interface FilterDto {
  field: string;
  type: string;
  value: string;
}

interface SortDto {
  field: string;
  isDesc: boolean;
  serial: number;
}

interface DynamicQueryRequest {
  filters: FilterDto[];
  sorts: SortDto[];
}

function evaluateFilter(input: string): string | null {
  const filterMap: Record<string, string> = {
    startsWith: UrlBasedDynamicQuery.StartsWith,
    notStartsWith: UrlBasedDynamicQuery.NotStartsWith,
    endsWith: UrlBasedDynamicQuery.EndsWith,
    notEndsWith: UrlBasedDynamicQuery.NotEndsWith,
    contains: UrlBasedDynamicQuery.Contains,
    notContains: UrlBasedDynamicQuery.NotContains,
    equals: UrlBasedDynamicQuery.Equal,
    notEquals: UrlBasedDynamicQuery.NotEquals,
    greaterThan: UrlBasedDynamicQuery.GreaterThan,
    lessThan: UrlBasedDynamicQuery.LessThan,
    greaterThanOrEqual: UrlBasedDynamicQuery.GreaterThanEqual,
    lessThanOrEqual: UrlBasedDynamicQuery.LessThanEqual
  };

  return filterMap[input] || null;
}

function extractMeta(dto: LazyLoadMeta): DynamicQueryRequest {
  const filters: FilterDto[] = [];
  const sorts: SortDto[] = [];

  // Process filters
  if (dto.filters) {
    for (const [field, filterData] of Object.entries(dto.filters)) {
      if (!filterData) {
        continue;
      }

      // Handle both single filter and array of filters
      const filterArray = Array.isArray(filterData) ? filterData : [filterData];

      filterArray.forEach((filter) => {
        if (
          !filter.matchMode ||
          filter.value === null ||
          filter.value === undefined ||
          filter.value === ""
        ) {
          return;
        }

        const filterType = evaluateFilter(filter.matchMode);

        if (filterType) {
          filters.push({
            field,
            type: filterType,
            value: String(filter.value)
          });
        }
      });
    }
  }

  // Process sorting
  if (dto.multiSortMeta && dto.multiSortMeta.length > 0) {
    dto.multiSortMeta.forEach((sort, index) => {
      sorts.push({
        field: sort.field,
        isDesc: sort.order === 1 ? false : true,
        serial: index + 1
      });
    });
  } else if (dto.sortField && dto.sortOrder) {
    // Handle single column sort
    const field = Array.isArray(dto.sortField) ? dto.sortField[0] : dto.sortField;
    sorts.push({
      field,
      isDesc: dto.sortOrder === 1 ? false : true,
      serial: 1
    });
  }

  return { filters, sorts };
}

const DynamicUrlBuilder: FilterAndSortFn = (meta: LazyLoadMeta): HttpParams => {
  const dto = extractMeta(meta);
  const usp = new HttpParams();

  dto.filters.forEach((item) => {
    const paramKey = `${item.field}__${item.type}`;
    usp.append(paramKey, item.value);
  });

  dto.sorts.forEach((item) => {
    const paramKey = `$sort__${item.serial}__${item.isDesc ? "desc" : "asc"}`;
    usp.append(paramKey, item.field);
  });

  return usp;
};
