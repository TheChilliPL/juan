export const enum FutureState {
    Created, Queued, Running, Complete, Failed
}

export class Future<T> implements Promise<T> {
    constructor(action: () => Promise<T>) {
        this.action = action;
    }

    private action: () => Promise<T>;
    private _state: FutureState = FutureState.Created; 
    public get state(): FutureState {
        return this._state;
    }
    
    private promise: Promise<T> | undefined;

    run(): this {
        if(![FutureState.Created, FutureState.Queued].includes(this._state)) return this;

        this._state = FutureState.Running;
        this.promise = this.action();
        this.promise.then(
            () => this._state = FutureState.Complete,
            () => this._state = FutureState.Failed
        );
        return this;
    }

    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined): Promise<TResult1 | TResult2> {
        if([FutureState.Created, FutureState.Queued].includes(this._state))
            this.run();

        if(![FutureState.Running, FutureState.Complete, FutureState.Failed].includes(this._state))
            throw new Error("Failed starting the promise.");

        return this.promise!.then(onfulfilled, onrejected);
    }
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined): Promise<T | TResult> {
        return this.then(null, onrejected);
    }
    finally(onfinally?: (() => void) | null | undefined): Promise<T> {
        return this.then(
            result => {
                onfinally?.();
                return result;
            },
            error => {
                onfinally?.();
                return error;
            }
        );
    }
    [Symbol.toStringTag]: string = "Future";
}