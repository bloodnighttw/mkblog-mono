import path from "node:path";

export function removeExtension(filepath: string) {
    return path.parse(filepath).name;
}

const cyrb53 = (str: string, seed = 0) => {
    let h1 = 0xdeadbeef ^ seed;
    let h2 = 0x41c6ce57 ^ seed;
    for(let i = 0, ch = null; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1  = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2  = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

export function hashing(filepath: string) {
    return cyrb53(filepath).toString(36);
}

export function mix(filepath: string) {
    return `${removeExtension(filepath)}-${hashing(filepath)}`;
}