import { HttpClient, HttpContext, HttpContextToken } from "@angular/common/http";
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
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { cleanNullishFromObject } from "./utils";

export const OffsetPaginatedPrimeNgTableStateNetworkRequest = new HttpContextToken(() => false);

type DataContainer<T> = {
  payload: T[];
  totalCount: number;
};

export type OffsetPaginatedPrimeNgTableStateOptions = {
  predicate?: Signal<boolean>;
  pageQueryParamKey?: string;
  limitQueryParamKey?: string;
  dataArrayKey?: string;
  totalDataCountKey?: string;
  requestMethod?: "GET" | "POST";
  queryParams?: Record<string, string | number | boolean>;
  postRequestBody?: any;
  injector?: Injector;
  httpContext?: HttpContext;
  onError?: (error: Error) => void;
};

export type OffsetPaginatedPrimeNgTableStateConfig = Omit<
  OffsetPaginatedPrimeNgTableStateOptions,
  "injector" | "httpContext" | "predicate" | "queryParams" | "postRequestBody"
>;

type DefaultOptions = Omit<
  Required<OffsetPaginatedPrimeNgTableStateOptions>,
  "injector" | "httpContext" | "predicate" | "onError"
> & {
  onError?: (error: Error) => void;
};

const optionsWithDefaultValue: DefaultOptions = {
  pageQueryParamKey: "page",
  limitQueryParamKey: "limit",
  dataArrayKey: "payload",
  totalDataCountKey: "totalCount",
  requestMethod: "GET",
  queryParams: {},
  postRequestBody: null
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
  postRequestBody: Signal<any>;
  onLazyLoad(event: TableLazyLoadEvent): void;
  setBody(value: any): this;
  clearBody(): this;
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
      postRequestBody: signal(mergedOptions.postRequestBody),
      queryParamsFromUser: signal<Record<string, string | number | boolean>>(
        mergedOptions.queryParams
      )
    });

    const finalQueryParams = computed(() => {
      const val: Record<string, string | number | boolean> = {
        [mergedOptions.pageQueryParamKey]: internalState.currentPage(),
        [mergedOptions.limitQueryParamKey]: internalState.currentLimit(),
        ...cleanNullishFromObject(internalState.queryParamsFromUser())
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
            return http.post(apiUrl, internalState.postRequestBody(), {
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
      postRequestBody: internalState.postRequestBody.asReadonly(),
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

        internalState.apiCallNotification.next();
      },
      // chainable methods
      setBody(value: any) {
        if (mergedOptions.requestMethod === "POST") {
          internalState.postRequestBody.set(value);
        }
        return this;
      },
      clearBody() {
        if (mergedOptions.requestMethod === "POST") {
          internalState.postRequestBody.set(null);
        }
        return this;
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
