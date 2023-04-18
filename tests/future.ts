import { test } from "node:test";
import assert = require("node:assert");
import { Future, FutureState } from "../src/future";
import * as Utils from "../src/utils";

test("Future", async () => {
    let future = new Future(() => Utils.sleep(500));
    let result = await Promise.race([future, Utils.sleep(100)]);
    assert.equal(result, undefined);
});

test("Future with return", async () => {
    let future = new Future(async () => {
        await Utils.sleep(500);
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
        await Utils.sleep(500);
        reject(2);
    }));
    assert.equal(future.state, FutureState.Created);
    future.run();
    assert.equal(future.state, FutureState.Running);
    await assert.rejects(future);
    assert.equal(future.state, FutureState.Failed);
});