export function* filterIterable<T>(iterable: Iterable<T>, predicate: (value: T) => boolean): Iterable<T> {
    for (const value of iterable) {
        if (predicate(value)) {
            yield value;
        }
    }
    return iterable;
}

export function* filterGenerator<T, TReturn>(generator: Generator<T, TReturn>, predicate: (value: T) => boolean): Generator<T, TReturn> {
    while(true) {
        const {value, done} = generator.next();
        if(done) {
            return value;
        }
        if(predicate(value)) {
            yield value;
        }
    }
}
