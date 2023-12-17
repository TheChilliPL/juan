import {test} from "node:test";
import {SimpleScheduler} from "../concurrency/simpleScheduler";
import {PriorityConstants, Scheduler} from "../concurrency/scheduler";
import {strict as assert} from "node:assert";
import {Future, FutureState} from "../concurrency/future";

test("Simple scheduler: one task", async () => {
    let scheduler: Scheduler = new SimpleScheduler();
    assert.equal(scheduler.count(), 0);
    assert.equal(scheduler.isRunning, false);

    let delayPromiseGenerator = () => new Promise(resolve => setTimeout(resolve, 100));

    let future1 = scheduler.schedule(new Future(delayPromiseGenerator), PriorityConstants.Default);
    assert.equal(scheduler.count(), 1);
    assert.equal(scheduler.isRunning, false);
    assert.equal(future1.state, FutureState.Queued);

    scheduler.start();

    assert.equal(scheduler.count(), 0);
    assert.equal(scheduler.isRunning, true);
    assert.equal(future1.state, FutureState.Running);

    await future1;

    assert.equal(scheduler.count(), 0);
    assert.equal(scheduler.isRunning, true);
    assert.equal(future1.state, FutureState.Complete);

    scheduler.stop();

    assert.equal(scheduler.isRunning, false);
});

test("Simple scheduler: multiple tasks", async () => {
    let scheduler: Scheduler = new SimpleScheduler();
    assert.equal(scheduler.count(), 0);
    assert.equal(scheduler.isRunning, false);

    let delayPromiseGenerator = () => new Promise(resolve => setTimeout(resolve, 100));

    let future1 = scheduler.schedule(new Future(delayPromiseGenerator), PriorityConstants.Default);
    let future2 = scheduler.schedule(new Future(delayPromiseGenerator), PriorityConstants.High);
    let future3 = scheduler.schedule(new Future(delayPromiseGenerator), PriorityConstants.Low);

    assert.equal(scheduler.count(), 3);
    assert.equal(scheduler.isRunning, false);
    assert.equal(future1.state, FutureState.Queued);
    assert.equal(future2.state, FutureState.Queued);
    assert.equal(future3.state, FutureState.Queued);

    scheduler.start();

    assert.equal(scheduler.count(), 2);
    assert.equal(scheduler.isRunning, true);
    assert.equal(future1.state, FutureState.Queued);
    assert.equal(future2.state, FutureState.Running);
    assert.equal(future3.state, FutureState.Queued);

    await future2;

    assert.equal(scheduler.count(), 1);
    assert.equal(scheduler.isRunning, true);
    assert.equal(future1.state, FutureState.Running);
    assert.equal(future2.state, FutureState.Complete);
    assert.equal(future3.state, FutureState.Queued);

    await future1;

    assert.equal(scheduler.count(), 0);
    assert.equal(scheduler.isRunning, true);
    assert.equal(future1.state, FutureState.Complete);
    assert.equal(future2.state, FutureState.Complete);
    assert.equal(future3.state, FutureState.Running);

    await future3;

    assert.equal(scheduler.count(), 0);
    assert.equal(scheduler.isRunning, true);
    assert.equal(future1.state, FutureState.Complete);
    assert.equal(future2.state, FutureState.Complete);
    assert.equal(future3.state, FutureState.Complete);

    scheduler.stop();

    assert.equal(scheduler.isRunning, false);
});
