import {
  assertInInjectionContext,
  DestroyRef,
  inject,
  Injector,
  runInInjectionContext,
  Signal
} from "@angular/core";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import { Observable } from "rxjs";
import { NgSelectHelper } from "./ng-select-helper";

/**
 * @deprecated Use `initNgSelectHelper` instead.
 */
export function initNgSelect(
  helpers$: Observable<NgSelectHelper<unknown>[]>,
  destroyRef: DestroyRef,
  onAjaxError: (err: Error) => void
): void {
  helpers$.pipe(takeUntilDestroyed(destroyRef)).subscribe({
    next: (helpers) => {
      helpers
        .filter((elem) => elem instanceof NgSelectHelper && !elem.isInitDone)
        .forEach((elem) => {
          elem.init();
          elem.ajaxError$.pipe(takeUntilDestroyed(destroyRef)).subscribe(onAjaxError);
        });
    }
  });
}

type InitNgSelectHelperOptions = {
  /** Optional Callback function to handle AJAX errors */
  onAjaxError?: (err: Error) => void;
  /** Optional Angular DestroyRef for automatic cleanup */
  destroyRef?: DestroyRef;
  /** Optional Angular Injector */
  injector?: Injector;
};

/**
 * Utility function to initialize NgSelect helpers with error handling
 *
 * This function streamlines the initialization process for multiple NgSelect helpers
 * by automatically initializing them and setting up error handling subscriptions.

 * @example
 * ```typescript
 * import { Component, inject, signal } from '@angular/core';
 * import { HttpClient } from '@angular/common/http';
 * import { DestroyRef } from '@angular/core';
 * import { toObservable } from '@angular/core/rxjs-interop';
 * import { NgSelectHelper, initNgSelectHelper } from 'ngx-primeng-toolkit';
 *
 * @Component({
 *   selector: 'app-example'
 * })
 * export class ExampleComponent {
 *   private readonly httpClient = inject(HttpClient);
 *   private readonly destroyRef = inject(DestroyRef);
 *   private readonly toastService = inject(ToastService);
 *
 *   readonly userSelectHelper = new NgSelectHelper<User>(
 *     '/api/users',
 *     this.httpClient,
 *     this.destroyRef,
 *     false, // requiresSearch
 *     50,    // pageSize
 *     false  // isLazyLoad
 *   );
 *
 *   readonly departmentSelectHelper = new NgSelectHelper<Department>(
 *     '/api/departments',
 *     this.httpClient,
 *     this.destroyRef,
 *     true,  // requiresSearch
 *     25,    // pageSize
 *     true   // isLazyLoad
 *   );
 *
 *   readonly ngSelectHelpers = signal([
 *     this.userSelectHelper,
 *     this.departmentSelectHelper
 *   ]);
 *
 * constructor() {
 *   initNgSelectHelper(this.ngSelectHelpers, {
 *     onAjaxError: (err) => this.toastService.showAjaxErrorToast(err)
 *   });
 * }
 * }
 * ```
 */

export function initNgSelectHelper<T = any>(
  items: Signal<NgSelectHelper<T>[]>,
  options: InitNgSelectHelperOptions
): void {
  !options.injector && assertInInjectionContext(initNgSelectHelper);
  const assertedInjector = options.injector ?? inject(Injector);

  if (!options.destroyRef) {
    options.destroyRef = inject(DestroyRef);
  }

  runInInjectionContext(assertedInjector, () => {
    toObservable(items)
      .pipe(takeUntilDestroyed(options.destroyRef))
      .subscribe({
        next: (elem) => {
          elem
            .filter((elem) => elem instanceof NgSelectHelper && !elem.isInitDone)
            .forEach((elem) => {
              elem.init();

              if (options.onAjaxError) {
                elem.ajaxError$
                  .pipe(takeUntilDestroyed(options.destroyRef))
                  .subscribe(options.onAjaxError);
              }
            });
        }
      });
  });
}
