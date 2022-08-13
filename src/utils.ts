export type Nullable<T> = T | null;

export type AllowedObjectKey = string | number | symbol;

export type Excess<T> = T & { [key: AllowedObjectKey]: unknown }

export type NestedRecord<Key extends AllowedObjectKey, Value>
    = { [key in Key]: Value | NestedRecord<Key, Value> }

export function prefixKeys<T>(obj: Record<string, T>, prefix: string): Record<string, T> {
    let out: Record<string, any> = {};

    for(let key in obj) {
        out[prefix + key] = obj[key];
    }

    return out;
}

export function flattenObject<T>(obj: NestedRecord<string | number, T>): Record<string, T>;
export function flattenObject(obj: any): any;
export function flattenObject(obj: any): any {
    if(typeof obj != "object") return obj.toString();

    let out: Record<string, any> = {};

    for(let key in obj) {
        if(typeof obj[key] == "object") {
            out = { ...out, ...prefixKeys(flattenObject(obj[key]), key + ".") }
        } else {
            out[key] = obj[key];
        }
    }

    return out;
}

// Counts elements of an array that satisfy a predicate.
export function countWhere<T>(arr: T[], predicate: (x: T) => boolean): number {
    let count = 0;

    for(let x of arr) {
        if(predicate(x)) count++;
    }

    return count;
}

/**
 * Converts a timezone offset to a string in the format `±HH[:MM]`.
 * @param offset Offset in minutes.
 */
export function offsetToString(offset: number): string {
    let sign = offset < 0 ? "-" : "+";
    let hours = Math.floor(Math.abs(offset) / 60);
    let minutes = Math.abs(offset) % 60;

    return `${sign}${hours}${minutes ? `:${minutes.toString().padStart(2, "0")}` : ""}`;
}