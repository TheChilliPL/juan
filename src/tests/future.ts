import { test } from "node:test";
import { strict as assert } from "node:assert";
import { Future, FutureState } from "../future";
import * as Utils from "../utils";

let delay = 50;

test("Future", async () => {
    let future = new Future(() => Utils.sleep(delay));
    assert.equal(future.state, FutureState.Created);
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
    let result = null;
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
