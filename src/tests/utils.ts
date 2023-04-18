import {strict as assert} from "node:assert";
import {test} from "node:test";
import * as Utils from "../utils";

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
    let emotes = Utils.getEmotes("Hello 😄 👋 there<:vampysmug:1005433502751272960>");
    assert.deepEqual(emotes, ["😄", "👋", "<:vampysmug:1005433502751272960>"]);
});

test("Sorted index", () => {
    let array = [1, 2, 4, 5];

    // Before any
    assert.equal(Utils.sortedIndex(array, 0), 0);
    // Existing element
    assert.equal(Utils.sortedIndex(array, 4), 2);
    // After any
    assert.equal(Utils.sortedIndex(array, 6), 4);
    // In between
    assert.equal(Utils.sortedIndex(array, 3), 2);
});

test("Sorted index with changed 0", () => {
    let array = [1, 2, 4, 5];

    // Before any
    assert.equal(Utils.sortedIndex(array, 0, undefined, true), 0);
    // Existing element: should return AFTER the existing element
    assert.equal(Utils.sortedIndex(array, 4, undefined, true), 3);
    // After any
    assert.equal(Utils.sortedIndex(array, 6, undefined, true), 4);
    // In between
    assert.equal(Utils.sortedIndex(array, 3, undefined, true), 2);
});

test("Sorted index with comparator", () => {
    let array = ["a", "bb", "dddd", "eeeee"];

    let comparator = (a: string, b: string) => a.length - b.length;
    // Before any
    assert.equal(Utils.sortedIndex(array, "", comparator), 0);
    // Existing element
    assert.equal(Utils.sortedIndex(array, "dddd", comparator), 2);
    // After any
    assert.equal(Utils.sortedIndex(array, "ffffff", comparator), 4);
    // In between
    assert.equal(Utils.sortedIndex(array, "ccc", comparator), 2);
});
