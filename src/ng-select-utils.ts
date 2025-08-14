import { DestroyRef } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Observable } from "rxjs";
import { NgSelectHelper } from "./ng-select-helper";

/**
 * Utility function to initialize NgSelect helpers with error handling
 * 
 * This function streamlines the initialization process for multiple NgSelect helpers
 * by automatically initializing them and setting up error handling subscriptions.
 * 
 * @param helpers$ Observable of NgSelectHelper instances
 * @param destroyRef Angular DestroyRef for automatic cleanup
 * @param onAjaxError Callback function to handle AJAX errors
 * 
 * @example
 * ```typescript
 * import { Component, inject, signal } from '@angular/core';
 * import { HttpClient } from '@angular/common/http';
 * import { DestroyRef } from '@angular/core';
 * import { toObservable } from '@angular/core/rxjs-interop';
 * import { NgSelectHelper, initNgSelect } from 'ngx-primeng-toolkit';
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
 *   constructor() {
 *     initNgSelect(
 *       toObservable(this.ngSelectHelpers),
 *       this.destroyRef,
 *       (err) => this.toastService.showAjaxErrorToast(err)
 *     );
 *   }
 * }
 * ```
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
          elem.ajaxError$
            .pipe(takeUntilDestroyed(destroyRef))
            .subscribe(onAjaxError);
        });
    }
  });
}
