import { HttpClient, HttpContext } from "@angular/common/http";
import {
  assertInInjectionContext,
  DestroyRef,
  inject,
  Injector,
  runInInjectionContext,
  signal
} from "@angular/core";
import {
  catchError,
  debounceTime,
  finalize,
  first,
  mergeMap,
  Observable,
  of,
  Subject,
  Subscription,
  switchMap
} from "rxjs";
import { z } from "zod";
import { SkipLoadingSpinner } from "./http-context-tokens";

/**
 * Configuration options for NgSelectHelper
 */
type NgSelectHelperOpts = {
  ajaxUrl: string;
  httpClient: HttpClient;
  destroyRef: DestroyRef;
  usePostRequest?: boolean;
  initialSearchText?: string;
  limit?: number;
  useCache?: boolean;
  skipLoadingSpinner?: boolean;
};

/**
 * Reset options for NgSelectHelper
 */
type NgSelectHelperResetOpts = {
  resetQueryParams: boolean;
  resetBody: boolean;
  resetCache: boolean;
};

/**
 * Query parameter type for NgSelectHelper
 */
type NgSelectHelperQueryParam = Record<string, string | number | boolean>;

/**
 * Body type for NgSelectHelper POST requests
 */
type NgSelectHelperBody =
  | Array<string | number | boolean | null | Record<string, string | number | boolean | null>>
  | Record<
      string,
      | string
      | number
      | boolean
      | null
      | Array<string | number | boolean | null | Record<string, string | number | boolean | null>>
    >;

/**
 * Cache key type for internal caching
 */
type CacheKey = {
  ajaxUrl: string;
  page: number;
  limit: number;
  searchText: string;
  queryParams: NgSelectHelperQueryParam;
  body: NgSelectHelperBody;
};

/**
 * Paged data response specifically for ng-select
 */
export class NgSelectPagedDataResponse<TData> {
  constructor(public readonly payload: Array<TData>, public readonly totalCount: number) {}
}

/**
 * Zod schema for validating ng-select paged response
 */
export const NgSelectPagedDataResponseZodSchema = z.object({
  payload: z.any().array(),
  totalCount: z.number()
});

/**
 * Default reset options
 */
const defaultResetOpts: NgSelectHelperResetOpts = {
  resetQueryParams: false,
  resetBody: false,
  resetCache: false
};

/**
 * NgSelectHelper class for managing ng-select components with HTTP data loading,
 * pagination, caching, and search functionality using Angular signals
 *
 * @template TData The type of data items in the select options
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
 *   selector: 'app-user-select',
 *   template: `
 *     <ng-select
 *       [items]="selectHelper.loadedData().payload"
 *       bindLabel="name"
 *       bindValue="id"
 *       [loading]="selectHelper.isLoading()"
 *       [typeahead]="selectHelper.inputSubject"
 *       (open)="selectHelper.onOpen()"
 *       (close)="selectHelper.onClose()"
 *       (clear)="selectHelper.onClear()"
 *       (scrollToEnd)="selectHelper.onScrollToEnd()">
 *     </ng-select>
 *   `
 * })
 * export class UserSelectComponent implements OnInit {
 *   private httpClient = inject(HttpClient);
 *   private destroyRef = inject(DestroyRef);
 *
 *   selectHelper = NgSelectHelper.create<User>({
 *     ajaxUrl: '/api/users',
 *     httpClient: this.httpClient,
 *     destroyRef: this.destroyRef,
 *     usePostRequest: false,
 *     limit: 20
 *   });
 *
 *   ngOnInit() {
 *     this.selectHelper.init();
 *   }
 * }
 * ```
 */
export class NgSelectHelper<TData> {
  constructor(
    private ajaxUrl: string,
    private readonly httpClient: HttpClient,
    private readonly destroyRef: DestroyRef,
    public readonly usePostRequest = false,
    limit: number = 50,
    private readonly useCache: boolean = true,
    private skipLoadingSpinner: boolean = true,
    initialSearchText: string = ""
  ) {
    this.#searchText = initialSearchText;
    this.#originalAjaxUrl = ajaxUrl;
    this.#limit = limit > 0 ? limit : 50;
    this.destroyRef.onDestroy(() => {
      this.#ajaxErrorSubject.complete();
      this.inputSubject.complete();
      this.#loadMoreDataSubject.complete();
      this.#cache.clear();
      if (this.runningApiReq && !this.runningApiReq.closed) {
        this.runningApiReq.unsubscribe();
      }
    });
  }

  readonly #cache: Map<string, NgSelectPagedDataResponse<TData>> = new Map();
  readonly #originalAjaxUrl: string;
  #queryParams: NgSelectHelperQueryParam = {};
  #body: NgSelectHelperBody = {};
  #initDone = false;
  #searchText = "";
  readonly #limit: number;
  #page = 1;
  #debounceTimeInSec: number = 1;
  #totalCount = -1;
  #isLastApiCallSuccessful = true;
  #limitReached = false;

  readonly #loadMoreDataSubject = new Subject<void>();

  public readonly inputSubject = new Subject<string>();
  readonly #ajaxErrorSubject = new Subject<Error>();
  public readonly ajaxError$ = this.#ajaxErrorSubject.asObservable();
  readonly #loadedData = signal<NgSelectPagedDataResponse<TData>>(
    new NgSelectPagedDataResponse<TData>([], 0)
  );
  public readonly loadedData = this.#loadedData.asReadonly();
  readonly #isLoading = signal(false);
  public readonly isLoading = this.#isLoading.asReadonly();
  private runningApiReq: Subscription | null = null;

  /**
   * Creates a new instance of NgSelectHelper
   * @param options Configuration options
   * @returns New NgSelectHelper instance
   */
  public static create<T>({
    ajaxUrl,
    httpClient,
    destroyRef,
    usePostRequest = false,
    limit = 50,
    useCache = true,
    skipLoadingSpinner = true,
    initialSearchText = ""
  }: NgSelectHelperOpts): NgSelectHelper<T> {
    return new NgSelectHelper<T>(
      ajaxUrl,
      httpClient,
      destroyRef,
      usePostRequest,
      limit,
      useCache,
      skipLoadingSpinner,
      initialSearchText
    );
  }

  /**
   * Sets whether to skip the loading spinner for HTTP requests
   * @param skip Whether to skip the loading spinner
   * @returns This instance for method chaining
   */
  public setSkipLoadingSpinner(skip: boolean): this {
    this.skipLoadingSpinner = skip;
    return this;
  }

  /**
   * Sets the debounce time for search input in seconds
   * @param debounceTimeInSecond Debounce time in seconds
   * @returns This instance for method chaining
   */
  public setDebounceTimeInSecond(debounceTimeInSecond: number): this {
    this.#debounceTimeInSec = debounceTimeInSecond > 0 ? debounceTimeInSecond : 1;
    return this;
  }

  /**
   * Patches the request body (only works with POST requests)
   * @param value Body data to merge
   * @returns This instance for method chaining
   */
  public patchBody(value: NgSelectHelperBody): this {
    if (this.usePostRequest) {
      this.resetAll();
      this.#body = Object.assign(this.#body, value);
    }
    return this;
  }

  /**
   * Sets the request body (only works with POST requests)
   * @param newBody New body data
   * @returns This instance for method chaining
   */
  public setBody(newBody: NgSelectHelperBody): this {
    if (this.usePostRequest) {
      this.resetAll();
      this.#body = newBody;
    }
    return this;
  }

  /**
   * Clears the internal cache
   * @returns This instance for method chaining
   */
  public clearCache(): this {
    this.#cache.clear();
    return this;
  }

  /**
   * Sets route parameters for the URL
   * @param newRouteParam Route parameter to append
   * @returns This instance for method chaining
   */
  public setRouteParam(newRouteParam: string): this {
    const baseUrl = this.#originalAjaxUrl.endsWith("/")
      ? this.#originalAjaxUrl.slice(0, -1)
      : this.#originalAjaxUrl;

    let routeParam = newRouteParam.startsWith("/") ? newRouteParam.slice(1) : newRouteParam;

    this.ajaxUrl = `${baseUrl}/${routeParam}`;

    return this;
  }

  /**
   * Patches query parameters
   * @param value Query parameters to merge
   * @returns This instance for method chaining
   */
  public patchQueryParams(value: NgSelectHelperQueryParam): this {
    this.resetAll();
    this.#queryParams = Object.assign(this.#queryParams, value);
    return this;
  }

  /**
   * Removes a query parameter
   * @param key Query parameter key to remove
   * @returns This instance for method chaining
   */
  public removeQueryParam(key: string): this {
    this.resetAll();
    delete this.#queryParams[key];
    return this;
  }

  /**
   * Sets query parameters
   * @param newQueryParams New query parameters
   * @returns This instance for method chaining
   */
  public setQueryParams(newQueryParams: NgSelectHelperQueryParam): this {
    this.resetAll();
    this.#queryParams = newQueryParams;
    return this;
  }

  /**
   * Handler for ng-select blur event
   */
  public onBlur(): void {
    this.resetAll();
  }

  /**
   * Handler for ng-select close event
   */
  public onClose(): void {
    this.resetSearchText();
    if (this.runningApiReq && !this.runningApiReq.closed) {
      this.runningApiReq.unsubscribe();
      this.runningApiReq = null;
    }
  }

  /**
   * Handler for ng-select clear event
   */
  public async onClear(): Promise<void> {
    this.resetAll();
  }

  /**
   * Handler for ng-select open event
   */
  public onOpen(): void {
    this.#loadMoreDataSubject.next();
  }

  /**
   * Handler for ng-select scroll to end event
   */
  public onScrollToEnd(): void {
    if (this.#isLoading()) {
      return;
    }
    this.runProbablePageCounterUpdate();
    this.#loadMoreDataSubject.next();
  }

  /**
   * Gets whether the last API call was successful
   */
  public get isLastApiCallSuccessful(): boolean {
    return this.#isLastApiCallSuccessful;
  }

  /**
   * Gets whether the limit has been reached
   */
  public get limitReached(): boolean {
    return this.#limitReached;
  }

  /**
   * Gets current query parameters
   */
  public get queryParams(): NgSelectHelperQueryParam {
    return this.#queryParams;
  }

  /**
   * Gets current request body
   */
  public get body(): NgSelectHelperBody {
    return this.#body;
  }

  /**
   * Gets current page number
   */
  public get page(): number {
    return this.#page;
  }

  /**
   * Gets total count of available items
   */
  public get totalCount(): number {
    return this.#totalCount;
  }

  /**
   * Gets whether initialization is complete
   */
  public get isInitDone(): boolean {
    return this.#initDone;
  }

  /**
   * Initializes the NgSelectHelper with event handlers
   * Should be called in ngOnInit or similar lifecycle method
   */
  public init(): void {
    if (this.#initDone) {
      return;
    }
    this.#initDone = true;

    // Handle search input with debouncing
    this.inputSubject
      .pipe(
        debounceTime(this.#debounceTimeInSec * 500),
        switchMap((term) => {
          this.resetAll();
          this.#searchText = term;
          return this.loadDataFromApi(this.page, this.#limit, term).pipe(
            catchError(() => of(null))
          );
        })
      )
      .subscribe({
        next: (res) => {
          if (res) {
            this.updateStateOnSuccessfulInitialApiCall(res);
          } else {
            this.updateStateOnFailedApiCall();
          }
        }
      });

    // Trigger initial search if initialSearchText was provided
    if (this.#searchText !== "") {
      this.inputSubject.next(this.#searchText);
    }

    // Handle load more requests
    this.#loadMoreDataSubject
      .pipe(
        switchMap(() => {
          if (this.#isLoading()) {
            return of(null);
          }

          this.runLimitReachedCheck();

          if (this.limitReached) {
            return of(null);
          }

          return this.loadDataFromApi(this.page, this.#limit, this.#searchText).pipe(
            catchError(() => of(null))
          );
        })
      )
      .subscribe({
        next: (res) => {
          if (res) {
            this.updateStateOnSuccessfulSubsequentApiCall(res);
          } else {
            this.updateStateOnFailedApiCall();
          }
        }
      });
  }

  /**
   * Loads data from the API
   * @param page Page number
   * @param limit Items per page
   * @param searchText Search term
   * @returns Observable of paged data response
   */
  private loadDataFromApi(
    page: number,
    limit: number,
    searchText?: string
  ): Observable<NgSelectPagedDataResponse<TData> | null> {
    const queryParams: Record<string, string | number> = { page, limit };

    if (searchText) {
      queryParams["searchText"] = searchText;
    }

    const key: CacheKey = {
      ajaxUrl: this.ajaxUrl,
      page: page,
      limit: limit,
      searchText: searchText ?? "",
      queryParams: { ...queryParams, ...this.#queryParams },
      body: this.#body
    };

    let strKey: string | null = null;

    if (this.useCache) {
      strKey = JSON.stringify(key);
      const cacheData = this.#cache.get(strKey);

      if (cacheData !== undefined) {
        return of(cacheData);
      }
    }

    this.#isLoading.set(true);

    let req: Observable<NgSelectPagedDataResponse<TData> | null>;

    if (this.usePostRequest) {
      req = this.httpClient.post<NgSelectPagedDataResponse<TData>>(key.ajaxUrl, key.body, {
        params: key.queryParams,
        context: new HttpContext().set(SkipLoadingSpinner, this.skipLoadingSpinner)
      });
    } else {
      req = this.httpClient.get<NgSelectPagedDataResponse<TData>>(key.ajaxUrl, {
        params: key.queryParams,
        context: new HttpContext().set(SkipLoadingSpinner, this.skipLoadingSpinner)
      });
    }

    return req.pipe(
      first(),
      mergeMap((val) => {
        const result = NgSelectPagedDataResponseZodSchema.safeParse(val);
        if (!result.success) {
          throw new Error("Invalid response body for ng-select");
        }
        if (this.useCache && strKey && val) {
          this.#cache.set(strKey, val);
        }
        return of(val);
      }),
      catchError((error) => {
        this.#ajaxErrorSubject.next(error);
        return of(null);
      }),
      finalize(() => this.#isLoading.set(false))
    );
  }

  /**
   * Updates page counter if conditions are met
   */
  private runProbablePageCounterUpdate(): void {
    if (this.isLastApiCallSuccessful && !this.limitReached) {
      this.#page += 1;
    }
  }

  /**
   * Checks if the limit has been reached
   */
  private runLimitReachedCheck(): void {
    if (this.totalCount != -1) {
      this.#limitReached = this.#loadedData().payload.length >= this.totalCount;
    }
  }

  /**
   * Updates state after successful initial API call
   * @param data Response data
   */
  private updateStateOnSuccessfulInitialApiCall(data: NgSelectPagedDataResponse<TData>): void {
    this.#loadedData.set(new NgSelectPagedDataResponse(data.payload, data.totalCount));
    this.#totalCount = data.totalCount;
    this.#isLastApiCallSuccessful = true;
  }

  /**
   * Updates state after successful subsequent API call
   * @param data Response data
   */
  private updateStateOnSuccessfulSubsequentApiCall(data: NgSelectPagedDataResponse<TData>): void {
    this.#loadedData.update((val) => {
      return new NgSelectPagedDataResponse<TData>(
        [...val.payload, ...data.payload],
        data.totalCount
      );
    });

    this.#totalCount = data.totalCount;
    this.#isLastApiCallSuccessful = true;
  }

  /**
   * Updates state after failed API call
   */
  private updateStateOnFailedApiCall(): void {
    this.#isLastApiCallSuccessful = false;
  }

  /**
   * Resets all state to initial values
   * @param opts Reset options
   */
  public resetAll(opts: NgSelectHelperResetOpts = defaultResetOpts): void {
    // Cancel any running request
    if (this.runningApiReq && !this.runningApiReq.closed) {
      this.runningApiReq.unsubscribe();
      this.runningApiReq = null;
    }

    this.#isLastApiCallSuccessful = true;
    this.#page = 1;
    this.#totalCount = -1;
    this.#limitReached = false;
    this.#searchText = "";

    if (opts.resetCache) {
      this.#cache.clear();
    }

    this.#loadedData.set(new NgSelectPagedDataResponse<TData>([], 0));
    this.#isLoading.set(false);

    if (opts.resetQueryParams) {
      this.#queryParams = {};
    }

    if (opts.resetBody) {
      this.#body = {};
    }
  }

  /**
   * Resets search text
   */
  private resetSearchText(): void {
    this.#searchText = "";
  }
}

export function createNgSelectHelper<T>(
  options: Omit<NgSelectHelperOpts, "httpClient" | "destroyRef"> & { injector?: Injector }
) {
  !options.injector && assertInInjectionContext(createNgSelectHelper);
  const assertedInjector = options.injector ?? inject(Injector);

  return runInInjectionContext(assertedInjector, () => {
    const httpClient = inject(HttpClient);
    const destroyRef = inject(DestroyRef);
    return NgSelectHelper.create<T>({
      ...options,
      httpClient,
      destroyRef
    });
  });
}
