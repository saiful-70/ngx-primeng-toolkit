import { HttpResourceRef } from "@angular/common/http";
import {
  assertInInjectionContext,
  DestroyRef,
  effect,
  inject,
  Injector,
  runInInjectionContext,
  signal
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Observable } from "rxjs";

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

export function afterDestroy(fn: () => void, injector?: Injector) {
  !injector && assertInInjectionContext(afterDestroy);
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
  !options.injector && assertInInjectionContext(afterDestroy);
  const assertedInjector = options.injector ?? inject(Injector);

  runInInjectionContext(assertedInjector, () => {
    options.source.pipe(takeUntilDestroyed()).subscribe((payloadFromStream) => {
      options.handleStream(payloadFromStream);
    });
  });
}
