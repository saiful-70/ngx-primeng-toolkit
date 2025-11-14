import { HttpResourceRef } from "@angular/common/http";
import {
  assertInInjectionContext,
  DestroyRef,
  effect,
  inject,
  Injector,
  isSignal,
  runInInjectionContext,
  Signal,
  signal
} from "@angular/core";
import { takeUntilDestroyed, toObservable, toSignal } from "@angular/core/rxjs-interop";
import { debounceTime, Observable } from "rxjs";

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
export function debounceSignal<T>(
  source: Signal<T> | Observable<T>,
  ms: number,
  injector?: Injector
) {
  !injector && assertInInjectionContext(debounceSignal);
  const assertedInjector = injector ?? inject(Injector);

  return runInInjectionContext(assertedInjector, () => {
    if (isSignal(source)) {
      return toSignal(toObservable(source).pipe(debounceTime(ms), takeUntilDestroyed()));
    } else if (source instanceof Observable) {
      toSignal(source.pipe(debounceTime(ms), takeUntilDestroyed()));
    } else {
      throw new Error("Invalid source");
    }
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

export function duringDestroy(fn: () => void, injector?: Injector) {
  !injector && assertInInjectionContext(duringDestroy);
  const assertedInjector = injector ?? inject(Injector);

  runInInjectionContext(assertedInjector, () => {
    inject(DestroyRef).onDestroy(fn);
  });
}

type RxSubscriberOptions<T> = {
  source: Observable<T>;
  handleStream: (payload: T) => void;
  injector?: Injector;
};

export function rxSubscriber<T>(options: RxSubscriberOptions<T>) {
  !options.injector && assertInInjectionContext(duringDestroy);
  const assertedInjector = options.injector ?? inject(Injector);

  runInInjectionContext(assertedInjector, () => {
    options.source.pipe(takeUntilDestroyed()).subscribe((payloadFromStream) => {
      options.handleStream(payloadFromStream);
    });
  });
}
