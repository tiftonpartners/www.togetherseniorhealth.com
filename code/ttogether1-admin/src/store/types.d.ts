import { StateType, ActionType } from 'typesafe-actions';

declare module 'redux' {
    export interface Store {
        sagaTask?: Task;
    }
}

declare module 'typesafe-actions' {
    export type Store = StateType<typeof import('./index').default>;

    export type RootState = StateType<typeof import('./reducers').default>;

    export type RootAction = ActionType<typeof import('./actions').default>;

    interface Types {
        RootAction: RootAction;
    }
}

/** Strip any saga effects from a type; this is typically useful to get the return type of a saga. */
type StripEffects<T> = T extends IterableIterator<infer E>
    ? E extends Effect | SimpleEffect<any, any>
        ? never
        : E
    : never;

/** Unwrap the type to be consistent with the runtime behavior of a call. */
type DecideReturn<T> = T extends Promise<infer R>
    ? R // If it's a promise, return the promised type.
    : T extends IterableIterator<any>
    ? StripEffects<T> // If it's a generator, strip any effects to get the return type.
    : T; // Otherwise, it's a normal function and the return type is unaffected.

/** Determine the return type of yielding a call effect to the provided function.
 *
 * Usage: const foo: CallReturnType&lt;typeof func&gt; = yield call(func, ...)
 */
export type CallReturnType<T extends (...args: any[]) => any> = DecideReturn<
    ReturnType<T>
>;

/** Get the return type of a saga, stripped of any effects the saga might yield, which will be handled by Saga. */
export type SagaReturnType<T extends (...args: any[]) => any> = StripEffects<
    ReturnType<T>
>;
