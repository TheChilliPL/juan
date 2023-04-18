import { client } from "./bot";
import * as Discord from "discord.js";

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

    return `${sign}${hours.toString().padStart(2, "0")}${minutes ? `:${minutes.toString().padStart(2, "0")}` : ""}`;
}

const emojiRegexPart = "\\p{Extended_Pictographic}";
const emoteRegex = new RegExp(`<a?:.+?:\\d+>|${emojiRegexPart}`, "gu");

export function getEmotes(str: string): string[] {
    return [...str.matchAll(emoteRegex)].map(x => x[0]);
}

export function canReceiveMessageContent(): boolean {
    let applicationFlags = client.application.flags;
    if(applicationFlags.has(Discord.ApplicationFlags.GatewayMessageContent))
        return true;
    // noinspection RedundantIfStatementJS
    if(applicationFlags.has(Discord.ApplicationFlags.GatewayMessageContentLimited))
        return true;
    return false;
}

export function sleep(ms: number) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

export function sortedIndex<T extends number | bigint>(array: T[], value: T, comp?: (a: T, b: T) => number, existingAfter?: boolean): number;
export function sortedIndex<T>(array: T[], value: T, comp: (a: T, b: T) => number, existingAfter?: boolean): number;
export function sortedIndex<T>(array: T[], value: T, comp?: (a: T, b: T) => number, existingAfter: boolean = false): number {
    if(!comp) {
        if (typeof value == "number")
            comp = ((a: any, b: any) => a - b);
        else
            throw new Error("No comparator provided for non-numeric values.");
    }

    let low = 0;
    let high = array.length;

    while(low < high) {
        let mid = (low + high) >>> 1;
        let c = comp(array[mid], value);
        if(c < 0 || (existingAfter && c == 0)) low = mid + 1;
        else high = mid;
    }

    return low;
}
