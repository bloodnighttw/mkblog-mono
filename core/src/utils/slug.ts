import path from "node:path";

export function removeExtension(filepath: string) {
    return path.parse(filepath).name;
}

export function hashing(filepath: string) {
    throw new Error("Not implemented");
    return filepath;
}

export function mix(filepath: string) {
    throw new Error("Not implemented");
    return filepath;
}