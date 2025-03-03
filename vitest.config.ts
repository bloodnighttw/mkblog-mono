import {defineConfig} from 'vitest/config'

const exclude = [
    '**/cypress/**',
    '**/.{idea,git,cache,output,temp}/**',
    "**/*.base.*",
    "**/*.config.*",
    '**/dist/**',
    "**/coverage/**",
    "**/node_modules/**",
    "**/test/**",
]

export default defineConfig({
    test: {
        workspace: ['core'],
        exclude,
        coverage: {
            provider: 'v8',
            exclude,
            reporter: ['json', 'json-summary'],
            reportOnFailure: true,
        },
    }
})