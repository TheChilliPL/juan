import { test } from "node:test";
import assert = require("node:assert");
import * as Utils from "../src/utils";

test("Key prefixing", () => {
    let original = {
        "key1": {
            "child1": 1,
            "child2": 2
        },
        "key2": 3
    };

    let expected = {
        "prefix_key1": {
            "child1": 1,
            "child2": 2
        },
        "prefix_key2": 3
    };

    assert.deepEqual(Utils.prefixKeys(original, "prefix_"), expected);
});

test("Flattening object", () => {
    let original = {
        "key1": {
            "child1": 1,
            "child2": 2
        },
        "key2": 3
    };

    let expected = {
        "key1.child1": 1,
        "key1.child2": 2,
        "key2": 3
    };

    assert.deepEqual(Utils.flattenObject(original), expected);
});

test("Count where", () => {
    let testArray = [
        "apple",
        "banana",
        "corn",
        "potato",
        "cucumber"
    ];

    assert.equal(Utils.countWhere(testArray, x => x.includes("a")), 3);
});

test("Offset to string", () => {
    assert.equal(Utils.offsetToString(0), "+00");
    assert.equal(Utils.offsetToString(60), "+01");
    assert.equal(Utils.offsetToString(90), "+01:30");
    assert.equal(Utils.offsetToString(-75), "-01:15");
});

test("Get emotes", () => {
    //TODO
});