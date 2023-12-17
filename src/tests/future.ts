import { test } from "node:test";
import { strict as assert } from "node:assert";
import { Future, FutureState } from "../concurrency/future";
import * as Utils from "../utils";

let delay = 50;

test("Future", async () => {
    let future = new Future(() => Utils.sleep(delay));
    assert.equal(future.state, FutureState.Created);
    await Utils.sleep(delay);
    assert.equal(future.state, FutureState.Created);
    future.run();
    assert.equal(future.state, FutureState.Running);
    let result = await future;
    assert.equal(future.state, FutureState.Complete);
    assert.equal(result, undefined);
});

test("Future with return", async () => {
    let future = new Future(async () => {
        await Utils.sleep(delay);
        return "success";
    });
    assert.equal(future.state, FutureState.Created);
    future.run();
    assert.equal(future.state, FutureState.Running);
    let result: string | null = null;
    await assert.doesNotReject(async () => result = await future);
    assert.equal(future.state, FutureState.Complete);
    assert.equal(result, "success");
});

test("Failed future", async () => {
    let future = new Future(() => new Promise(async (_, reject) => {
        await Utils.sleep(delay);
        reject(2);
    }));
    assert.equal(future.state, FutureState.Created);
    future.run();
    assert.equal(future.state, FutureState.Running);
    await assert.rejects(future);
    assert.equal(future.state, FutureState.Failed);
});

test("Future auto-run", async () => {
    let future = new Future(() => Utils.sleep(delay));
    assert.equal(future.state, FutureState.Created);
    let result = await future;
    assert.equal(future.state, FutureState.Complete);
    assert.equal(result, undefined);
});

test("Future multiple await", {
    timeout: 1_000
}, async () => {
    let future = new Future(async () => { await Utils.sleep(delay); return 123; });
    assert.equal(future.state, FutureState.Created);
    let promise = future.run();
    assert.equal(future.state, FutureState.Running);
    let result = await future;
    assert.equal(future.state, FutureState.Complete);
    assert.equal(result, 123);
    result = await future;
    assert.equal(future.state, FutureState.Complete);
    assert.equal(result, 123);
});
