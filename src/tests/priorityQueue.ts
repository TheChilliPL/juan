import {test} from "node:test";
import {strict as assert} from "node:assert";
import { PriorityQueue } from "../priorityQueue";

test("Number priority queue", () => {
    let queue = new PriorityQueue<number>((a, b) => a - b);
    queue.enqueue(1);
    queue.enqueue(3);
    queue.enqueue(2);

    assert.equal(queue.length, 3);
    assert.equal(queue.peek(), 1);
    assert.equal(queue.dequeue(), 1);
    assert.equal(queue.dequeue(), 2);
    assert.equal(queue.dequeue(), 3);
    assert.equal(queue.dequeue(), undefined);
    assert.equal(queue.length, 0);
});

test("String priority queue", () => {
    let queue = new PriorityQueue<string>((a, b) => a.localeCompare(b, "en-US"));
    queue.enqueue("apple");
    queue.enqueue("banana");
    queue.enqueue("corn");

    assert.equal(queue.length, 3);
    assert.equal(queue.peek(), "apple");
    assert.equal(queue.dequeue(), "apple");
    assert.equal(queue.dequeue(), "banana");
    assert.equal(queue.dequeue(), "corn");
    assert.equal(queue.dequeue(), undefined);
    assert.equal(queue.length, 0);
});

test("Equal priority elements in queue", () => {
    let queue = new PriorityQueue<string>((a, b) => a.length - b.length);

    queue.enqueue("apple");
    queue.enqueue("banana");
    queue.enqueue("corn");
    queue.enqueue("potato");
    queue.enqueue("orange");
    queue.enqueue("cucumber");

    assert.equal(queue.length, 6);
    assert.equal(queue.dequeue(), "corn");
    assert.equal(queue.dequeue(), "apple");
    assert.equal(queue.dequeue(), "banana");
    assert.equal(queue.dequeue(), "potato");
    assert.equal(queue.dequeue(), "orange");
    assert.equal(queue.dequeue(), "cucumber");
    assert.equal(queue.dequeue(), undefined);
    assert.equal(queue.length, 0);
});
