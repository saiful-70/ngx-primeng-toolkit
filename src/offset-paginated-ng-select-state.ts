import { HttpClient, HttpContext, HttpContextToken } from "@angular/common/http";
import {
  assertInInjectionContext,
  computed,
  DestroyRef,
  inject,
  InjectionToken,
  Injector,
  isDevMode,
  isSignal,
  makeEnvironmentProviders,
  Provider,
  runInInjectionContext,
  Signal,
  signal
} from "@angular/core";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import {
  catchError,
  combineLatestWith,
  debounceTime,
  defer,
  filter,
  finalize,
  interval,
  Observable,
  of,
  Subject,
  switchMap,
  takeUntil,
  tap
} from "rxjs";
import { cleanNullishFromObject } from "./utils";

type DataContainer<T> = {
  payload: T[];
  totalCount: number;
};

export type OffsetPaginatedNgSelectStateOptions = {
  searchOnlyMode?: boolean;
  searchQueryParamKey?: string;
  pageQueryParamKey?: string;
  limitQueryParamKey?: string;
  dataArrayKey?: string;
  totalDataCountKey?: string;
  requestMethod?: "GET" | "POST";
  queryParams?: Record<string, string | number | boolean>;
  postRequestBody?: any;
  dataLimitPerRequest?: number;
  debounceTimeMs?: number;
  useCache?: boolean;
  cacheTtlSec?: number;
  disableCacheExpiration?: boolean;
  injector?: Injector;
  httpContext?: HttpContext;
  onError?: (error: Error) => void;
};

export type OffsetPaginatedNgSelectStateConfig = Omit<
  OffsetPaginatedNgSelectStateOptions,
  "injector" | "queryParams" | "postRequestBody"
>;

type OffsetPaginatedNgSelectStateResetOptions = {
  resetQueryParams: boolean;
  resetBody: boolean;
  resetCache: boolean;
};

type CacheKey = {
  url: string;
  queryParams: Record<string, string | number | boolean>;
  body: any;
};

type DefaultOptions = Required<Omit<OffsetPaginatedNgSelectStateOptions, "onError" | "injector">> &
  Pick<OffsetPaginatedNgSelectStateOptions, "onError">;

const OFFSET_PAGINATED_NG_SELECT_STATE_CONFIG =
  new InjectionToken<OffsetPaginatedNgSelectStateConfig>("OFFSET_PAGINATED_NG_SELECT_STATE_CONFIG");

export function provideOffsetPaginatedNgSelectStateConfig(
  config: OffsetPaginatedNgSelectStateConfig
): Provider {
  return {
    provide: OFFSET_PAGINATED_NG_SELECT_STATE_CONFIG,
    useValue: config
  };
}

export const OffsetPaginatedNgSelectNetworkRequest = new HttpContextToken(() => false);

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

const defaultResetOpts = {
  resetQueryParams: false,
  resetBody: false,
  resetCache: false
};

export interface OffsetPaginatedNgSelectStateRef<TData> {
  // Data state
  typeaheadSubject: Subject<string>;
  data: Signal<TData[]>;
  isLoading: Signal<boolean>;
  queryParams: Signal<Record<string, string | number | boolean>>;
  postRequestBody: Signal<any>;

  // Event handler methods
  clearCache(): this;
  onOpen(): void;
  onClose(): void;
  onClear(): void;
  onSearch({ term }: { term: string }): void;
  onScrollToEnd(): void;

  // methods
  reset(options?: OffsetPaginatedNgSelectStateResetOptions): void;
  setBody(value: any): this;
  clearBody(): this;
  patchQueryParam(value: Record<string, string | number | boolean>): this;
  removeQueryParam(key: string): this;
  removeAllQueryParams(): this;
}

export function offsetPaginatedNgSelectState<TData>(
  url: string | Signal<string>,
  options?: OffsetPaginatedNgSelectStateOptions
): OffsetPaginatedNgSelectStateRef<TData> {
  if (isDevMode() && !options?.injector) {
    assertInInjectionContext(offsetPaginatedNgSelectState);
  }

  const assertedInjector = options?.injector ?? inject(Injector);

  return runInInjectionContext(assertedInjector, () => {
    const destroyRef = inject(DestroyRef);
    const http = inject(HttpClient);
    const configFromDi = inject(OFFSET_PAGINATED_NG_SELECT_STATE_CONFIG);
    const typeaheadSubject = new Subject<string>();
    const typeAhead$ = typeaheadSubject.asObservable();

    const optionsWithDefaultValue: DefaultOptions = {
      searchQueryParamKey:
        options?.searchQueryParamKey ?? configFromDi.searchQueryParamKey ?? "searchText",
      pageQueryParamKey: options?.pageQueryParamKey ?? "page",
      limitQueryParamKey: options?.limitQueryParamKey ?? "limit",
      dataArrayKey: options?.dataArrayKey ?? "payload",
      totalDataCountKey: options?.totalDataCountKey ?? "totalCount",
      debounceTimeMs: options?.debounceTimeMs ?? 500,
      searchOnlyMode: options?.searchOnlyMode ?? false,
      requestMethod: options?.requestMethod ?? "GET",
      queryParams: options?.queryParams ?? {},
      postRequestBody: options?.postRequestBody ?? null,
      dataLimitPerRequest: options?.dataLimitPerRequest ?? 20,
      useCache: options?.useCache ?? false,
      cacheTtlSec: options?.cacheTtlSec ?? 60,
      disableCacheExpiration: options?.disableCacheExpiration ?? false,
      httpContext: options?.httpContext ?? new HttpContext(),
      onError: options?.onError
    };

    const blackListedQueryKeys = [
      optionsWithDefaultValue.searchQueryParamKey,
      optionsWithDefaultValue.pageQueryParamKey,
      optionsWithDefaultValue.limitQueryParamKey
    ].map((elem) => elem.toLowerCase());

    Object.keys(optionsWithDefaultValue.queryParams).forEach((key) => {
      if (blackListedQueryKeys.includes(key.toLowerCase())) {
        delete optionsWithDefaultValue.queryParams[key];
      }
    });

    const internalState = Object.seal({
      apiCallNotification: new Subject<void>(),
      currentPage: signal(1),
      isCurrentPageSuccessful: signal(false),
      isAllDataLoaded: signal(false),
      isLoading: signal(false),
      searchTermFromSearchEvent: signal<string | null>(null),
      isSelectPanelOpen: signal(false),
      loadedData: signal(defaultData<TData>()),
      cache: new Map<string, DataContainer<TData>>(),
      searchText: signal<string | null>(null),
      apiCallAbortNotifier: new Subject<void>(),
      postRequestBody: signal(optionsWithDefaultValue.postRequestBody),
      queryParamsFromUser: signal<Record<string, string | number | boolean>>({
        ...optionsWithDefaultValue.queryParams
      })
    });

    const finalQueryParams = computed(() => {
      const val: Record<string, string | number | boolean> = {
        [optionsWithDefaultValue.pageQueryParamKey]: internalState.currentPage(),
        [optionsWithDefaultValue.limitQueryParamKey]: optionsWithDefaultValue.dataLimitPerRequest,
        ...cleanNullishFromObject(internalState.queryParamsFromUser())
      };

      const searchText = internalState.searchText();
      if (searchText !== null) {
        val[optionsWithDefaultValue.searchQueryParamKey] = searchText;
      } else {
        delete val[optionsWithDefaultValue.searchQueryParamKey];
      }

      return val;
    });

    destroyRef.onDestroy(() => {
      if (!typeaheadSubject.closed) {
        typeaheadSubject.complete();
      }

      if (!internalState.apiCallAbortNotifier.closed) {
        internalState.apiCallAbortNotifier.next();
        internalState.apiCallAbortNotifier.complete();
      }

      if (!internalState.apiCallNotification.closed) {
        internalState.apiCallNotification.complete();
      }

      internalState.cache.clear();
    });

    if (optionsWithDefaultValue.useCache && !optionsWithDefaultValue.disableCacheExpiration) {
      interval(optionsWithDefaultValue.cacheTtlSec * 1000)
        .pipe(takeUntilDestroyed(destroyRef))
        .subscribe(() => {
          internalState.cache.clear();
        });
    }

    function reset(options: OffsetPaginatedNgSelectStateResetOptions = defaultResetOpts) {
      internalState.apiCallAbortNotifier.next();
      internalState.currentPage.set(1);
      internalState.isCurrentPageSuccessful.set(false);
      internalState.searchText.set(null);

      internalState.loadedData.set(defaultData());
      internalState.isAllDataLoaded.set(false);
      internalState.isLoading.set(false);

      if (options.resetBody) {
        internalState.postRequestBody.set(optionsWithDefaultValue.postRequestBody);
      }

      if (options.resetQueryParams) {
        internalState.queryParamsFromUser.set(optionsWithDefaultValue.queryParams);
      }

      if (options.resetCache) {
        internalState.cache.clear();
      }
    }

    const notifyApiCall = () => {
      internalState.apiCallNotification.next();
    };

    const handleApiResponse = (newData: DataContainer<TData>) => {
      internalState.isCurrentPageSuccessful.set(true);

      if (newData.payload.length > 0) {
        internalState.loadedData.update((val) => {
          return {
            payload: [...val.payload, ...newData.payload],
            totalCount: newData.totalCount
          } satisfies DataContainer<TData>;
        });
      }

      internalState.isAllDataLoaded.set(
        internalState.loadedData().payload.length === newData.totalCount
      );
    };

    const loadDataFromApi = () => {
      const finalUrl = isSignal(url) ? url() : url;
      const key: CacheKey = {
        url: finalUrl,
        body: internalState.postRequestBody(),
        queryParams: finalQueryParams()
      };

      if (optionsWithDefaultValue.requestMethod !== "POST") {
        delete key["body"];
      }

      let strKey: string | null = null;

      if (optionsWithDefaultValue.useCache) {
        strKey = JSON.stringify(key);
        const cacheData = internalState.cache.get(strKey);

        if (cacheData !== undefined) {
          return of(cacheData);
        }
      }

      let req: Observable<Object>;

      switch (optionsWithDefaultValue.requestMethod) {
        case "GET":
          req = defer(() => {
            internalState.isLoading.set(true);
            return http.get(finalUrl, {
              params: finalQueryParams(),
              context: optionsWithDefaultValue.httpContext.set(
                OffsetPaginatedNgSelectNetworkRequest,
                true
              )
            });
          });
          break;

        case "POST":
          req = defer(() => {
            internalState.isLoading.set(true);
            return http.post(finalUrl, internalState.postRequestBody(), {
              params: finalQueryParams(),
              context: optionsWithDefaultValue.httpContext.set(
                OffsetPaginatedNgSelectNetworkRequest,
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
          if (
            !isValidData(
              optionsWithDefaultValue.dataArrayKey,
              optionsWithDefaultValue.totalDataCountKey,
              rawData
            )
          ) {
            throw new Error(
              `The response body must be an object. Valid example: { ${optionsWithDefaultValue.dataArrayKey}: [], ${optionsWithDefaultValue.totalDataCountKey}: 0 }`
            );
          }

          const dataInContainer: DataContainer<TData> = {
            payload: rawData[optionsWithDefaultValue.dataArrayKey] ?? [],
            totalCount: rawData[optionsWithDefaultValue.totalDataCountKey] ?? 0
          };

          return of(dataInContainer);
        }),
        tap((data) => {
          if (optionsWithDefaultValue.useCache && strKey && data) {
            internalState.cache.set(strKey, data);
          }
        }),
        catchError((error) => {
          if (optionsWithDefaultValue.onError) {
            try {
              optionsWithDefaultValue.onError(error);
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

    internalState.apiCallNotification
      .pipe(
        filter((item) => item !== null),
        switchMap(() =>
          internalState.isLoading() ||
          internalState.isAllDataLoaded() ||
          !internalState.isSelectPanelOpen()
            ? of(null)
            : loadDataFromApi()
        ),
        filter((val) => val !== null),
        takeUntilDestroyed(destroyRef)
      )
      .subscribe((data) => {
        handleApiResponse(data);
      });

    typeAhead$
      .pipe(
        combineLatestWith(toObservable(internalState.searchTermFromSearchEvent)),
        debounceTime(optionsWithDefaultValue.debounceTimeMs),
        switchMap(([typeaheadValue, searchEventValue]) => {
          if (typeaheadValue === searchEventValue) {
            return of(typeaheadValue.trim());
          }
          if (typeaheadValue !== searchEventValue && searchEventValue === "") {
            return of("");
          }
          return of(null);
        }),
        filter((val) => val !== null),
        takeUntilDestroyed(destroyRef)
      )
      .subscribe((finalValue) => {
        reset();

        if (optionsWithDefaultValue.searchOnlyMode && finalValue === "") {
          return;
        }

        internalState.searchText.set(finalValue);

        notifyApiCall();
      });

    return Object.seal({
      // data state
      reset,
      queryParams: finalQueryParams,
      postRequestBody: internalState.postRequestBody.asReadonly(),
      typeaheadSubject,
      data: computed(() => {
        return internalState.loadedData().payload;
      }),
      isLoading: internalState.isLoading.asReadonly(),
      // event handlers
      clearCache() {
        internalState.cache.clear();
        return this;
      },

      onOpen() {
        internalState.isSelectPanelOpen.set(true);
        if (!optionsWithDefaultValue.searchOnlyMode) {
          notifyApiCall();
        }
      },

      onClose() {
        internalState.isSelectPanelOpen.set(false);
      },

      onClear() {
        reset();
      },

      onSearch(event: Record<string, unknown> & { term: string }) {
        if (Object.hasOwn(event, "term")) {
          internalState.searchTermFromSearchEvent.set(event.term);
        }
      },

      onScrollToEnd() {
        if (
          internalState.isAllDataLoaded() ||
          internalState.isLoading() ||
          !internalState.isSelectPanelOpen()
        ) {
          return;
        }

        if (internalState.isCurrentPageSuccessful()) {
          internalState.currentPage.update((currentValue) => {
            return currentValue + 1;
          });
        }

        notifyApiCall();
      },
      // chainable methods
      setBody(value: any) {
        if (optionsWithDefaultValue.requestMethod === "POST") {
          reset();
          internalState.postRequestBody.set(value);
        }
        return this;
      },
      clearBody() {
        if (optionsWithDefaultValue.requestMethod === "POST") {
          reset();
          internalState.postRequestBody.set(null);
        }
        return this;
      },

      patchQueryParam(value: Record<string, string | number | boolean>) {
        Object.keys(value).forEach((key) => {
          if (blackListedQueryKeys.includes(key.toLowerCase())) {
            delete value[key];
          }
        });

        if (Object.keys(value).length > 0) {
          reset();

          internalState.queryParamsFromUser.update((currentValue) => {
            return {
              ...currentValue,
              ...value
            };
          });
        }

        return this;
      },

      removeQueryParam(key: string) {
        reset();
        internalState.queryParamsFromUser.update((currentValue) => {
          delete currentValue[key];
          return currentValue;
        });

        return this;
      },
      removeAllQueryParams() {
        reset();
        internalState.queryParamsFromUser.set({});
        return this;
      }
    });
  });
}
