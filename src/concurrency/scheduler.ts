import {Future} from "./future";

export const enum PriorityConstants {
    Idle = 1000,
    Low = 100,
    Default = 0,
    High = -100,
    Critical = -1000
}

export type Priority = PriorityConstants | number;

export interface Scheduler<P = Priority> {
    schedule<T, F extends Future<T> = Future<T>>(future: F, priority: P): F;
    schedule<T, F extends () => Promise<T> = () => Promise<T>>(action: F, priority: P): Future<T>;
    count(): number;

    start(): void;
    stop(): void;

    get isRunning(): boolean;
}
