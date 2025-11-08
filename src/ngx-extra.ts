import { HttpResourceRef } from "@angular/common/http";
import {
  assertInInjectionContext,
  effect,
  inject,
  Injector,
  runInInjectionContext,
  signal
} from "@angular/core";

export class SignalChangeNotification {
  static create() {
    return new SignalChangeNotification();
  }
}

export function throwResourceError<T = any>(resorce: HttpResourceRef<T>, injector?: Injector) {
  !injector && assertInInjectionContext(throwResourceError);
  const assertedInjector = injector ?? inject(Injector);

  runInInjectionContext(assertedInjector, () => {
    effect(() => {
      const status = resorce.status();

      if (status === "error") {
        throw resorce.error();
      }
    });
  });
}

export function createNumericSignalChangeNotifier() {
  const sourceSignal = signal<number | null>(null);

  return {
    notify: () => {
      sourceSignal.update((v) => (v === null ? 1 : v + 1));
    },
    listen: sourceSignal.asReadonly()
  };
}
