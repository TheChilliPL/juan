import {Priority, Scheduler} from "./scheduler";
import {Future, FutureState} from "./future";
import {PriorityQueue} from "../priorityQueue";

interface SchedulerTask {
    future: Future<unknown>;
    priority: Priority;
}

enum SchedulerState {
    Stopped,
    Idle,
    Running
}

export class SimpleScheduler implements Scheduler {
    private _state = SchedulerState.Stopped;
    private _queue = new PriorityQueue<SchedulerTask>((a, b) => a.priority - b.priority);

    schedule<T>(future: Future<T> | (() => Promise<T>), priority: Priority): Future<T> {
        if(typeof future === "function") {
            future = new Future(future);
        }

        if(future.state !== FutureState.Created) {
            throw new Error("Future must be in Created state.");
        }
        future["_state"] = FutureState.Queued;
        let task: SchedulerTask = {
            future,
            priority
        };
        this._queue.enqueue(task);
        if(this._state === SchedulerState.Idle) {
            this._run().then();
        }
        return future;
    }

    public count(): number {
        return this._queue.length;
    }

    public start(): void {
        if (this.isRunning) {
            return;
        }

        this._state = SchedulerState.Idle;
        this._run().then();
    }

    public stop(): void {
        this._state = SchedulerState.Stopped;
    }

    public get isRunning(): boolean {
        return this._state == SchedulerState.Running || this._state == SchedulerState.Idle;
    }

    private async _run(): Promise<void> {
        if(this._state == SchedulerState.Stopped) return;

        this._state = SchedulerState.Running;

        const task = this._queue.dequeue();
        if (task) {
            await task.future.run();
            this._run().then();
        } else {
            this._state = SchedulerState.Idle;
        }
    }
}
