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
  signal,
  Signal
} from "@angular/core";
import { TableLazyLoadEvent } from "primeng/table";
import { catchError, defer, filter, finalize, Observable, of, Subject, switchMap } from "rxjs";
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
};

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
  patchQueryParam(value: Record<string, string | number | boolean>): this;
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

  const optionsWithDefaultValue: Required<OffsetPaginatedPrimeNgTableStateOptions> = {
    predicate: options?.predicate ?? signal(true),
    pageQueryParamKey: options?.pageQueryParamKey ?? "page",
    limitQueryParamKey: options?.limitQueryParamKey ?? "limit",
    dataArrayKey: options?.dataArrayKey ?? "payload",
    totalDataCountKey: options?.totalDataCountKey ?? "totalCount",
    requestMethod: options?.requestMethod ?? "GET",
    queryParams: options?.queryParams ?? {},
    postRequestBody: options?.postRequestBody ?? null,
    injector: assertedInjector,
    httpContext: options?.httpContext ?? new HttpContext()
  };

  const blackListedQueryKeys = [
    optionsWithDefaultValue.pageQueryParamKey,
    optionsWithDefaultValue.limitQueryParamKey
  ].map((elem) => elem.toLowerCase());

  Object.keys(optionsWithDefaultValue.queryParams).forEach((key) => {
    if (blackListedQueryKeys.includes(key.toLowerCase())) {
      delete optionsWithDefaultValue.queryParams[key];
    }
  });

  return runInInjectionContext(optionsWithDefaultValue.injector, () => {
    const http = inject(HttpClient);
    const destroyRef = inject(DestroyRef);

    const internalState = Object.seal({
      apiCallNotification: new Subject<void>(),
      isLoading: signal(false),
      currentPage: signal(1),
      currentLimit: signal(1),
      totalRecords: signal(0),
      loadedData: signal(defaultData<T>()),
      postRequestBody: signal(optionsWithDefaultValue.postRequestBody),
      queryParamsFromUser: signal<Record<string, string | number | boolean>>({})
    });

    const finalQueryParams = computed(() => {
      const val: Record<string, string | number | boolean> = {
        [optionsWithDefaultValue.pageQueryParamKey]: internalState.currentPage(),
        [optionsWithDefaultValue.limitQueryParamKey]: internalState.currentLimit(),
        ...cleanNullishFromObject(internalState.queryParamsFromUser())
      };

      return val;
    });

    destroyRef.onDestroy(() => {
      if (!internalState.apiCallNotification.closed) {
        internalState.apiCallNotification.complete();
      }
    });

    const loadDataFromApi = () => {
      const apiUrl = isSignal(url) ? url() : url;
      let req: Observable<Object>;

      switch (optionsWithDefaultValue.requestMethod) {
        case "GET":
          req = defer(() => {
            internalState.isLoading.set(true);
            return http.get(apiUrl, {
              params: { ...finalQueryParams() },
              context: optionsWithDefaultValue.httpContext.set(
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
              context: optionsWithDefaultValue.httpContext.set(
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

          const dataInContainer: DataContainer<T> = {
            payload: rawData[optionsWithDefaultValue.dataArrayKey] ?? [],
            totalCount: rawData[optionsWithDefaultValue.totalDataCountKey] ?? 0
          };

          return of(dataInContainer);
        }),
        catchError((error) => {
          console.error(error);
          return of(null);
        }),
        finalize(() => internalState.isLoading.set(false))
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
        filter((item) => item !== null),
        switchMap(() => {
          if (internalState.isLoading()) {
            return of(null);
          } else if (!optionsWithDefaultValue.predicate()) {
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
      predicate: optionsWithDefaultValue.predicate,
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
        if (optionsWithDefaultValue.requestMethod === "POST") {
          internalState.postRequestBody.set(value);
        }
        return this;
      },
      clearBody() {
        if (optionsWithDefaultValue.requestMethod === "POST") {
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
        internalState.queryParamsFromUser.update((currentValue) => {
          delete currentValue[key];
          return currentValue;
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
