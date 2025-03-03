import type {Options} from "tsup";

const defaultOptions: Options = {
    format: ['esm'],
    entry: ["./src/index.ts"],
    dts: true,
    clean: true,
    shims:true,
    skipNodeModulesBundle: true,
}

export default defaultOptions;