import * as Utils from "./utils";

export class PriorityQueue<T> {
    /**
     * Creates a new priority queue.
     * @param {(a: T, b: T) => number} comparer
     * A function that compares two items and returns a number indicating their
     * relative priority.
     * If the number is negative, `a` has higher priority than `b`.
     * If the number is positive, `b` has higher priority than `a`.
     * If the number is zero, `a` and `b` have equal priority.
     */
    constructor(comparer: (a: T, b: T) => number) {
        this.comparer = comparer;
    }

    private comparer: (a: T, b: T) => number;
    private queue: T[] = [];

    /**
     * Gets the number of items in the queue.
     */
    public get length(): number {
        return this.queue.length;
    }

    /**
     * Enqueues an item into the queue.
     *
     * **Note:** If the item priority changes *after* it has been enqueued, the queue will not be sorted.
     *
     * @param {T} item The item to enqueue.
     * @returns {number} The index at which the item was inserted.
     */
    public enqueue(item: T): number {
        let index = Utils.sortedIndex(this.queue, item, this.comparer, true);
        this.queue.splice(index, 0, item);
        return index;
    }

    /**
     * Dequeues an item from the queue.
     *
     * Removes the item with the lowest priority value from the queue and returns it.
     * @returns {T | undefined} The dequeued item, or `undefined` if the queue is empty.
     */
    public dequeue(): T | undefined {
        return this.queue.shift();
    }

    public peek(): T | undefined {
        return this.queue[0];
    }
}
