import { HttpClient, HttpContext, HttpContextToken } from "@angular/common/http";
import {
  assertInInjectionContext,
  computed,
  DestroyRef,
  inject,
  Injector,
  isDevMode,
  isSignal,
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
  tap
} from "rxjs";

export const OffsetPaginatedNgSelectNetworkRequest = new HttpContextToken(() => false);

type DataContainer<T> = {
  payload: T[];
  totalCount: number;
};

interface OffsetPaginatedNgSelectStateChainableMethods {
  setBody(value: any): this;
  clearBody(): this;
  patchQueryParam(value: Record<string, string | number | boolean>): this;
  removeQueryParam(key: string): this;
  removeAllQueryParams(): this;
}

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

type CacheKey = {
  url: string;
  queryParams: Record<string, string | number | boolean>;
  body: any;
};

type DefaultOptions = Required<Omit<OffsetPaginatedNgSelectStateOptions, "onError">> &
  Pick<OffsetPaginatedNgSelectStateOptions, "onError">;

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

export function createOffsetPaginatedNgSelectState<TData>(
  url: string | Signal<string>,
  options?: OffsetPaginatedNgSelectStateOptions
) {
  if (isDevMode() && !options?.injector) {
    assertInInjectionContext(createOffsetPaginatedNgSelectState);
  }

  const assertedInjector = options?.injector ?? inject(Injector);

  const optionsWithDefaultValue: DefaultOptions = {
    searchQueryParamKey: options?.searchQueryParamKey ?? "searchText",
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
    injector: assertedInjector,
    httpContext: options?.httpContext ?? new HttpContext(),
    onError: options?.onError
  };

  const blackListedQueryKeys = [
    optionsWithDefaultValue.searchQueryParamKey,
    optionsWithDefaultValue.pageQueryParamKey,
    optionsWithDefaultValue.limitQueryParamKey
  ].map((elem) => elem.toLowerCase());

  return runInInjectionContext(optionsWithDefaultValue.injector, () => {
    const destroyRef = inject(DestroyRef);
    const http = inject(HttpClient);
    const typeaheadSubject = new Subject<string>();
    const typeAhead$ = typeaheadSubject.asObservable();

    const internalState = Object.seal({
      apiCallNotification: new Subject<void>(),
      currentPage: signal(1),
      currentPageStatus: signal(false),
      isAllDataLoaded: signal(false),
      isLoading: signal(false),
      searchTermFromSearchEvent: signal<string | null>(null),
      isSelectPanelOpen: signal(false),
      loadedData: signal(defaultData<TData>()),
      cache: new Map<string, DataContainer<TData>>(),
      postRequestBody: signal(optionsWithDefaultValue.postRequestBody),
      queryParamsFromUser: signal<Record<string, string | number | boolean>>({}),
      queryParams: signal<Record<string, string | number | boolean>>({
        ...optionsWithDefaultValue.queryParams,
        [optionsWithDefaultValue.pageQueryParamKey]: 1,
        [optionsWithDefaultValue.limitQueryParamKey]: optionsWithDefaultValue.dataLimitPerRequest
      })
    });

    destroyRef.onDestroy(() => {
      if (!typeaheadSubject.closed) {
        typeaheadSubject.complete();
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

    function resetInternalState() {
      internalState.queryParams.set({
        ...internalState.queryParams(),
        [optionsWithDefaultValue.pageQueryParamKey]: 1
      });

      internalState.currentPage.set(1);
      internalState.currentPageStatus.set(false);

      internalState.loadedData.set(defaultData());
      internalState.isAllDataLoaded.set(false);
      internalState.isLoading.set(false);
    }

    const notifyApiCall = () => {
      internalState.apiCallNotification.next();
    };

    const handleApiResponse = (newData: DataContainer<TData>) => {
      internalState.currentPageStatus.set(true);

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
        queryParams: {
          ...internalState.queryParams(),
          ...internalState.queryParamsFromUser()
        }
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
              params: {
                ...internalState.queryParams(),
                ...internalState.queryParamsFromUser()
              },
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
              params: {
                ...internalState.queryParams(),
                ...internalState.queryParamsFromUser()
              },
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
        finalize(() => internalState.isLoading.set(false))
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
        takeUntilDestroyed(destroyRef)
      )
      .subscribe((data) => {
        if (data) {
          handleApiResponse(data);
        } else {
          internalState.currentPageStatus.set(false);
        }
      });

    typeAhead$
      .pipe(
        combineLatestWith(toObservable(internalState.searchTermFromSearchEvent)),
        debounceTime(optionsWithDefaultValue.debounceTimeMs),
        switchMap(([typeaheadValue, searchEventValue]) => {
          if (typeaheadValue === searchEventValue) {
            return of(typeaheadValue);
          }
          if (typeaheadValue !== searchEventValue && searchEventValue === "") {
            return of("");
          }
          return of(null);
        }),
        tap((finalValue) => {
          resetInternalState();
          internalState.queryParams.update((currentValue) => {
            if (!finalValue) {
              delete currentValue[optionsWithDefaultValue.searchQueryParamKey];
              return currentValue;
            }

            return {
              ...currentValue,
              [optionsWithDefaultValue.searchQueryParamKey]: finalValue
            };
          });
        }),
        takeUntilDestroyed(destroyRef)
      )
      .subscribe((finalValue) => {
        if (finalValue === null || (optionsWithDefaultValue.searchOnlyMode && finalValue === "")) {
          return;
        }

        notifyApiCall();
      });

    const publicDataState = {
      typeaheadSubject,
      data: computed(() => {
        return internalState.loadedData().payload;
      }),
      isLoading: internalState.isLoading.asReadonly()
    };

    const eventHandlers = {
      onOpen() {
        internalState.isSelectPanelOpen.set(true);
        if (!optionsWithDefaultValue.searchOnlyMode) {
          notifyApiCall();
        }
      },

      onClose() {
        internalState.isSelectPanelOpen.set(false);
        resetInternalState();
      },

      onClear() {
        resetInternalState();
      },

      onSearch({ term }: { term: string }) {
        internalState.searchTermFromSearchEvent.set(term);
      },

      onScrollToEnd() {
        if (internalState.isAllDataLoaded() || !internalState.isSelectPanelOpen()) {
          return;
        }

        if (internalState.currentPageStatus()) {
          internalState.currentPage.update((currentValue) => {
            return currentValue + 1;
          });

          internalState.queryParams.update((currentValue) => {
            return {
              ...currentValue,
              [optionsWithDefaultValue.pageQueryParamKey]: internalState.currentPage()
            };
          });
        }
        notifyApiCall();
      }
    };

    const chainableMethods = {
      setBody(value: any): OffsetPaginatedNgSelectStateChainableMethods {
        if (optionsWithDefaultValue.requestMethod === "POST") {
          resetInternalState();
          internalState.postRequestBody.set(value);
        }
        return this;
      },
      clearBody(): OffsetPaginatedNgSelectStateChainableMethods {
        if (optionsWithDefaultValue.requestMethod === "POST") {
          resetInternalState();
          internalState.postRequestBody.set(null);
        }
        return this;
      },

      patchQueryParam(
        value: Record<string, string | number | boolean>
      ): OffsetPaginatedNgSelectStateChainableMethods {
        Object.keys(value).forEach((key) => {
          if (blackListedQueryKeys.includes(key.toLowerCase())) {
            delete value[key];
          }
        });

        if (Object.keys(value).length > 0) {
          resetInternalState();

          internalState.queryParamsFromUser.update((currentValue) => {
            return {
              ...currentValue,
              ...value
            };
          });
        }

        return this;
      },

      removeQueryParam(key: string): OffsetPaginatedNgSelectStateChainableMethods {
        resetInternalState();
        internalState.queryParamsFromUser.update((currentValue) => {
          delete currentValue[key];
          return currentValue;
        });

        return this;
      },
      removeAllQueryParams(): OffsetPaginatedNgSelectStateChainableMethods {
        resetInternalState();
        internalState.queryParamsFromUser.set({});
        return this;
      }
    };

    return {
      ...eventHandlers,
      ...publicDataState,
      ...chainableMethods
    };
  });
}
