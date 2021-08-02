import { notEqual } from 'lit';
import type {
  LitElement,
  ReactiveController,
  ReactiveControllerHost
} from 'lit';

/*
 * Basic controllers
 */

/**
 * Executes the function each time the host is connected to the DOM
 */
export const onHostConnected = (
  host: ReactiveControllerHost & EventTarget,
  fn: () => void | Promise<void>
): void => {
  const reactiveController: ReactiveController = {
    hostConnected: () => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      fn();
    }
  };

  host.addController(reactiveController);
};

/**
 * Executes the function each time the host is disconnected from the DOM
 */
export const onHostDisconnected = (
  host: ReactiveControllerHost & EventTarget,
  fn: () => void | Promise<void>
): void => {
  const reactiveController: ReactiveController = {
    hostDisconnected: () => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      fn();
    }
  };

  host.addController(reactiveController);
};

export interface UseListenConfig <E extends Event> {
  event: string;
  fn: (e: E) => void;
  target?: EventTarget;
}

type Unsubscribe = () => void;

/**
 * Listens to event `event` on `target` and calls `fn`
 *
 * @remarks
 * If target is not defined, `host` is used.
 *
 * Returns a function to unsubscribe
 */
export const useListener = <
  E extends Event
> (
  host: ReactiveControllerHost & EventTarget,
  {
    event,
    target,
    fn
  }: UseListenConfig<E>
): Unsubscribe => {
  const realTarget: EventTarget = target ?? host;

  const reactiveController: ReactiveController = {
    hostConnected: () => {
      realTarget.addEventListener(event, fn as EventListener);
    },
    hostDisconnected: () => {
      realTarget.removeEventListener(event, fn as EventListener);
    }
  };

  host.addController(reactiveController);

  return () => {
    host.removeController(reactiveController);
    realTarget.removeEventListener(event, fn as EventListener);
  };
};

export interface UseStateOptions <T> {
  hasChanged?: (value: T, oldValue: T) => boolean;
}

type StateSetter <T> = (newValue: T) => void;

/**
 * Creates a reactive internal property
 */
export function useState <T> (
  host: ReactiveControllerHost,
  initialValue: T,
  options?: UseStateOptions<T>
): [ReactiveGetter<T>, StateSetter<T>];

export function useState <T extends unknown | undefined> (
  host: ReactiveControllerHost,
  initialValue?: T,
  options?: UseStateOptions<T>
): [ReactiveGetter<T>, StateSetter<T>];

export function useState <T> (
  host: ReactiveControllerHost,
  initialValue: T,
  options?: UseStateOptions<T>
): [ReactiveGetter<T>, StateSetter<T>] {
  let value: T = initialValue;

  const getter: ReactiveGetter<T> = () => value;

  const hasChanged = options?.hasChanged ?? notEqual;

  const setter = (newValue: T) => {
    // If value didn't change, reject the new value to avoid that children and
    // greatchildren react to changes in JS object references. Avoids
    // unnecessary re-renders.
    if (hasChanged(newValue, value)) {
      value = newValue;
      host.requestUpdate();
    }
  };

  return [getter, setter];
}

export type ReactiveGetter <T = unknown> = () => T;

/* eslint-disable @typescript-eslint/no-explicit-any */
type MapEvaluatedDependency <
  KeyOrGetter
> = KeyOrGetter extends ReactiveGetter<any>
  ? ReturnType<KeyOrGetter>
  : never;

/**
 * Evaluated dependencies
 */
/* eslint-disable @typescript-eslint/indent */
type EvaluatedDependencies<
  T extends ReadonlyArray<ReactiveGetter<any>>
> =
  T extends never[] ? never[] :
  T extends readonly [infer T1] ? [MapEvaluatedDependency<T1>] :
  T extends readonly [infer T1, infer T2] ? [MapEvaluatedDependency<T1>, MapEvaluatedDependency<T2>] :
  T extends readonly [infer T1, infer T2, infer T3] ? [MapEvaluatedDependency<T1>, MapEvaluatedDependency<T2>, MapEvaluatedDependency<T3>] :
  T extends readonly [infer T1, infer T2, infer T3, infer T4] ? [MapEvaluatedDependency<T1>, MapEvaluatedDependency<T2>, MapEvaluatedDependency<T3>, MapEvaluatedDependency<T4>] :
  T extends readonly [infer T1, infer T2, infer T3, infer T4, infer T5] ? [MapEvaluatedDependency<T1>, MapEvaluatedDependency<T2>, MapEvaluatedDependency<T3>, MapEvaluatedDependency<T4>, MapEvaluatedDependency<T5>] :
  T extends readonly [infer T1, infer T2, infer T3, infer T4, infer T5, infer T6] ? [MapEvaluatedDependency<T1>, MapEvaluatedDependency<T2>, MapEvaluatedDependency<T3>, MapEvaluatedDependency<T4>, MapEvaluatedDependency<T5>, MapEvaluatedDependency<T6>] :
  T extends readonly [infer T1, infer T2, infer T3, infer T4, infer T5, infer T6, infer T7] ? [MapEvaluatedDependency<T1>, MapEvaluatedDependency<T2>, MapEvaluatedDependency<T3>, MapEvaluatedDependency<T4>, MapEvaluatedDependency<T5>, MapEvaluatedDependency<T6>, MapEvaluatedDependency<T7>] :
  T extends readonly [infer T1, infer T2, infer T3, infer T4, infer T5, infer T6, infer T7, infer T8] ? [MapEvaluatedDependency<T1>, MapEvaluatedDependency<T2>, MapEvaluatedDependency<T3>, MapEvaluatedDependency<T4>, MapEvaluatedDependency<T5>, MapEvaluatedDependency<T6>, MapEvaluatedDependency<T7>, MapEvaluatedDependency<T8>] :
  never;
/* eslint-enable @typescript-eslint/indent */

const evaluateDependencies = <
  K extends readonly ReactiveGetter[]
>(
  keys: K
): EvaluatedDependencies<K> => {
  return keys.map(key => {
    if (typeof key === 'function') {
      return key();
    } else {
      throw new Error(`Invalid dependency: ${String(key)}`);
    }
  }) as unknown as EvaluatedDependencies<K>;
};

export interface UseComputedOptions <T> {
  hasChanged?: (a: T, b: T) => boolean;
}

/**
 * Memoizer. Returns the result of evaluating `fn` and only recomputes when `observedDeps` changes
 *
 * @remarks
 * Each dependency of `observedDeps` needs to be composed of reactive primitives,
 * that is, either a declared property or a internal variable created with
 * `useState`
 */
export const useComputed = <
  T,
  K extends readonly ReactiveGetter[],
  H extends object
> (
  host: H,
  fn: (args: EvaluatedDependencies<K>) => T,
  observedDeps: K,
  {
    hasChanged
  }: UseComputedOptions<T> = {}
): ReactiveGetter<T> => {
  let lastCall: {
    args: EvaluatedDependencies<K>;
    result: T;
  } | undefined;

  const getter = () => {
    const args = evaluateDependencies(observedDeps);

    if (
      lastCall &&
      lastCall.args.length === args.length &&
      lastCall.args.every((val, index) => !notEqual(val, args[index]))
    ) {
      return lastCall.result;
    }

    const computedResult = fn(args);
    const result = hasChanged && lastCall && !hasChanged(computedResult, lastCall.result)
      ? lastCall.result
      : computedResult;

    lastCall = { args, result };
    return result;
  };

  return getter;
};

export interface UseObserverOptions {
  skipFirstRender?: boolean;
}

/**
 * Observes an array of dependencies and calls `fn` when a change is detected
 *
 * @remarks
 * Each dependency of `observedDeps` needs to be composed of reactive primitives,
 * that is, either a declared property or a internal variable created with
 * `useState`
 */
export const useObserver = <
  K extends readonly ReactiveGetter[],
  H extends ReactiveControllerHost
> (
  host: H,
  fn: (
    args: EvaluatedDependencies<K>,
    oldArgs?: EvaluatedDependencies<K>
  ) => void,
  observedDeps: K,
  options?: UseObserverOptions
): void => {
  /** Evaluated arguments of previous render cycle */
  let prevArgs: EvaluatedDependencies<K> | undefined;
  /** Evaluated arguments of current render cycle */
  let args: EvaluatedDependencies<K> | undefined;

  /** Indicates if this cycle is the first render cycle */
  let firstRender = true;

  const reactiveController: ReactiveController = {
    hostUpdate: () => {
      // First, evaluate all arguments without executing effects, in order not
      // to have side-effects contaminate the evaluation of other observed
      // variables directly or through dependencies.
      args = evaluateDependencies(observedDeps);
    },
    hostUpdated: () => {
      const shouldSkip = firstRender && (options?.skipFirstRender ?? false);
      if (firstRender) firstRender = false;

      if (args === undefined) {
        throw new Error('Missing evaluatedDependencies');
      }

      // After all observers have evaluated all of their dependencies, run the
      // effects function without worring about side-effects
      if (
        !shouldSkip && (
          prevArgs === undefined ||
          prevArgs.length !== args.length ||
          prevArgs.some((val, index) =>
            notEqual(val, (args as EvaluatedDependencies<K>)[index]))
        )
      ) {
        fn(args, prevArgs);
      }

      prevArgs = args;
      args = undefined;
    }
  };

  host.addController(reactiveController);
};

export interface UseConditionalListenConfig <E extends Event> extends UseListenConfig <E> {
  getCondition: ReactiveGetter<boolean>;
}

/**
 * Listens to event `event` on `target` and calls `fn` only when `getCondition()` returns true
 *
 * @remarks
 * `getCondition` needs to be composed of reactive primitives, that is, either
 * a declared property or a internal variable created with `useState`
 */
export const useConditionalListener = <E extends Event> (
  host: ReactiveControllerHost & Pick<LitElement, 'isConnected'> & EventTarget,
  {
    getCondition,
    ...listenerOptions
  }: UseConditionalListenConfig<E>
): void => {
  let unsubscribe: Unsubscribe | undefined;

  if (host.isConnected && getCondition()) {
    unsubscribe = useListener(host, listenerOptions);
  }

  // Reevaluar la suscripción cada vez que cambia la condición
  useObserver(host, () => {
    if (host.isConnected && getCondition()) {
      if (!unsubscribe) {
        unsubscribe = useListener(host, listenerOptions);
      }
    } else {
      unsubscribe?.();
      unsubscribe = undefined;
    }
  }, [getCondition]);

  // Suscribirse y desuscribirse al conectar o desconectar el nodo
  const reactiveController: ReactiveController = {
    hostConnected: () => {
      if (unsubscribe !== undefined || !getCondition()) return;

      unsubscribe = useListener(host, listenerOptions);
    },
    hostDisconnected: () => {
      unsubscribe?.();
      unsubscribe = undefined;
    }
  };

  host.addController(reactiveController);
};
