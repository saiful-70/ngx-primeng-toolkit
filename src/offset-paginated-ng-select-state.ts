import {
  HttpClient,
  HttpContext,
  HttpContextToken,
  HttpParams,
  HttpRequest,
  httpResource
} from "@angular/common/http";
import {
  assertInInjectionContext,
  DestroyRef,
  effect,
  inject,
  Injector,
  runInInjectionContext,
  signal,
  untracked
} from "@angular/core";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import {
  catchError,
  debounceTime,
  filter,
  first,
  interval,
  of,
  startWith,
  Subject,
  switchMap,
  tap
} from "rxjs";
import { SignalChangeNotification } from "./ngx-extra";

export const OffsetPaginatedNgSelectNetworkRequest = new HttpContextToken(() => false);

export class OffsetPaginatedDataResponse<TData> {
  constructor(public readonly payload: Array<TData>, public readonly totalCount: number) {}
}

type OffsetPaginatedNgSelectStateOptions = {
  url: string;
  searchQueryParamKey?: string;
  pageQueryParamKey?: string;
  limitQueryParamKey?: string;
  requestMethod?: "GET" | "POST";
  queryParams?: Record<string, string | number | boolean>;
  initialSearchText?: string;
  limit?: number;
  debounceTimeMs?: number;
  cacheTtlMs?: number;
  useCache?: boolean;
  injector?: Injector;
  httpContext?: HttpContext;
  throwUnhandledError?: boolean;
  handleError?: (error?: Error) => void;
};

type DefaultOptions = Required<
  Omit<OffsetPaginatedNgSelectStateOptions, "initialSearchText" | "handleError">
> &
  Pick<OffsetPaginatedNgSelectStateOptions, "initialSearchText" | "handleError">;

export function createOffsetPaginatedNgSelectState<TData>(
  options: OffsetPaginatedNgSelectStateOptions
) {
  !options.injector && assertInInjectionContext(createOffsetPaginatedNgSelectState);
  const assertedInjector = options.injector ?? inject(Injector);

  const optionsWithDefaultValue: DefaultOptions = {
    searchQueryParamKey: options.searchQueryParamKey ?? "searchText",
    url: options.url,
    pageQueryParamKey: options.pageQueryParamKey ?? "page",
    limitQueryParamKey: options.limitQueryParamKey ?? "limit",
    requestMethod: options.requestMethod ?? "GET",
    queryParams: options.queryParams ?? {},
    limit: options.limit ?? 15,
    debounceTimeMs: options.debounceTimeMs ?? 500,
    cacheTtlMs: 60000,
    useCache: options.useCache ?? true,
    injector: assertedInjector,
    initialSearchText: options.initialSearchText,
    httpContext: options.httpContext
      ? options.httpContext.set(OffsetPaginatedNgSelectNetworkRequest, true)
      : new HttpContext().set(OffsetPaginatedNgSelectNetworkRequest, true),
    throwUnhandledError: options.throwUnhandledError ?? true,
    handleError: options.handleError
  };

  return runInInjectionContext(optionsWithDefaultValue.injector, () => {
    const destroyRef = inject(DestroyRef);
    const http = inject(HttpClient);
    const fallbackValue = new OffsetPaginatedDataResponse<TData>([], 0);

    const typeAheadSubject = new Subject<string>();
    const typeAhead$ = typeAheadSubject.asObservable();

    destroyRef.onDestroy(() => {
      if (!typeAheadSubject.closed) {
        typeAheadSubject.complete();
      }
    });

    const internalState = Object.seal({
      loadMoreWithSameStateNotification: signal<SignalChangeNotification | null>(null),
      currentPage: signal(1),
      isAllDataLoaded: signal(false),
      isLoading: signal(false),
      isSelectPanelOpen: signal(false),
      loadedData: signal(fallbackValue),
      pageHistory: new Map<number, "success" | "failed" | "pending">(),
      cache: new Map<string, OffsetPaginatedDataResponse<TData>>(),
      queryParams: signal({
        ...optionsWithDefaultValue.queryParams,
        [optionsWithDefaultValue.pageQueryParamKey]: 1,
        [optionsWithDefaultValue.limitQueryParamKey]: optionsWithDefaultValue.limit
      })
    });

    // if (optionsWithDefaultValue.initialSearchText) {
    //   typeAhead$.pipe(startWith(optionsWithDefaultValue.initialSearchText));
    // }

    interval(optionsWithDefaultValue.cacheTtlMs)
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(() => {
        internalState.cache.clear();
      });

    function resetInternalState(resetOptions = { resetCache: false }) {
      internalState.queryParams.set({
        ...internalState.queryParams(),
        [optionsWithDefaultValue.pageQueryParamKey]: 1
      });

      internalState.currentPage.set(1);
      internalState.pageHistory.clear();

      internalState.loadedData.set(fallbackValue);
      internalState.isAllDataLoaded.set(false);
      internalState.isLoading.set(false);

      if (resetOptions.resetCache) {
        internalState.cache.clear();
      }
    }

    function patchQueryParams(value: Record<string, string | number | boolean>) {
      internalState.queryParams.update((prev) => {
        return Object.assign({}, prev, value);
      });
    }

    function onNewDataFromApi(newData: OffsetPaginatedDataResponse<TData> | null) {
      if (newData) {
        internalState.loadedData.update((val) => {
          return new OffsetPaginatedDataResponse<TData>(
            [...val.payload, ...newData.payload],
            newData.totalCount
          );
        });

        internalState.isAllDataLoaded.set(
          internalState.loadedData().payload.length === newData.totalCount
        );
      }
    }

    function loadDataFromApi() {
      const req = http.get<OffsetPaginatedDataResponse<TData>>(optionsWithDefaultValue.url, {
        params: optionsWithDefaultValue.queryParams,
        context: optionsWithDefaultValue.httpContext
      });

      return req.pipe(
        tap(() => internalState.isLoading.set(true)),
        first(),
        switchMap((elem) => {
          const checkOne = !elem;
          const checkTwo = !Object.hasOwn(elem, "payload") || !Object.hasOwn(elem, "totalCount");
          const checkThree = !Array.isArray(Reflect.get(elem, "payload"));

          if (checkOne || checkTwo || checkThree) {
            throw new Error("Invalid response body for ng-select");
          }

          return of(elem);
        }),

        catchError((error) => {
          if (optionsWithDefaultValue.handleError) {
            optionsWithDefaultValue.handleError(error);
          }
          return of(null);
        }),
        tap(() => internalState.isLoading.set(false)),
        takeUntilDestroyed(destroyRef)
      );
    }

    typeAhead$
      .pipe(
        debounceTime(optionsWithDefaultValue.debounceTimeMs),
        tap((searchTextValue) => {
          resetInternalState();
          patchQueryParams({
            [optionsWithDefaultValue.searchQueryParamKey]: searchTextValue
          });
        }),
        switchMap(() => loadDataFromApi()),
        takeUntilDestroyed(destroyRef)
      )
      .subscribe((newData) => {
        onNewDataFromApi(newData);
      });

    toObservable(internalState.loadMoreWithSameStateNotification)
      .pipe(
        filter((item) => item !== null),
        switchMap(() =>
          internalState.isLoading() || internalState.isAllDataLoaded()
            ? of(null)
            : loadDataFromApi()
        ),
        takeUntilDestroyed(destroyRef)
      )
      .subscribe((newData) => {
        onNewDataFromApi(newData);
      });

    function onOpen() {
      internalState.isSelectPanelOpen.set(true);
    }

    function onClose() {
      internalState.isSelectPanelOpen.set(false);
      resetInternalState();
    }

    function onScrollToEnd() {
      if (internalState.isAllDataLoaded() || !internalState.isSelectPanelOpen()) {
        return;
      }

      if (internalState.pageHistory.get(internalState.currentPage()) === "success") {
        internalState.currentPage.update((prev) => prev + 1);
      }
    }

    function onClear() {
      resetInternalState();
    }

    function onBlur() {
      resetInternalState();
    }

    const publicState = {
      onOpen,
      onClose,
      onBlur,
      onScrollToEnd,
      onClear,
      typeAheadSubject,
      queryParams: optionsWithDefaultValue.queryParams,
      data: internalState.loadedData.asReadonly(),
      isLoading: internalState.isLoading
    };

    return publicState;
  });
}
