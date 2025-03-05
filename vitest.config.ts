import { defineConfig } from "vitest/config";

const exclude = [
	"**/cypress/**",
	"**/.{idea,git,cache,output,temp}/**",
	"**/*.base.*",
	"**/*.config.*",
	"**/dist/**",
	"**/coverage/**",
	"**/node_modules/**",
	"**/test/**",
];

export default defineConfig({
	test: {
		workspace: ["core","toc"],
		exclude,
		coverage: {
			provider: "v8",
			exclude,
			reporter: ["json", "json-summary", "text"],
			reportOnFailure: true,
		},
	},
});
