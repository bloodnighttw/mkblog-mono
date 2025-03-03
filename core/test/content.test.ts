import * as path from "node:path";
import remarkGfm from "remark-gfm";
import { expect, test } from "vitest";
import { defineContent, zod } from "../src";
import { hashing, mix, removeExtension } from "../src/utils/slug";

/**
 * @param filepath the path of the markdown file
 * @Return the filename without extension
 */
const customSlugFunc = (filepath: string) => {
	return path.parse(filepath).name;
};

test("no yaml in markdown", async () => {
	const config = await defineContent({
		include: "./cases/unknown/*.md",
		createSlug: customSlugFunc,
		schema: {
			title: zod.string(),
		},
	});

	const post = config.posts.find((post) => post.slug === "no-yaml");
	expect(post).toBeDefined();

	await expect(config.posts[0].metadata()).rejects.toThrow(
		"metadata not found",
	);
});

test("valid metadata schema check", async () => {
	const config = await defineContent({
		include: "./cases/a1/*.md",
		createSlug: customSlugFunc,
		schema: {
			title: zod.string(),
		},
	});

	const post = config.posts.find((post) => post.slug === "title");
	expect(post).toBeDefined();
	expect(await config.posts[0].metadata()).toBeDefined();
});

test("invalid metadata schema check", async () => {
	const config = await defineContent({
		include: "./cases/a1/*.md",
		createSlug: customSlugFunc,
		schema: {
			title: zod.number(), // should be string
		},
	});

	const post = config.posts.find((post) => post.slug === "title");
	expect(post).toBeDefined();
	await expect(config.posts[0].metadata()).rejects.toThrow();
});

test("html check", async () => {
	const configWithGFM = await defineContent({
		include: "./cases/a1/*.md",
		createSlug: customSlugFunc,
		schema: {
			title: zod.number(), // should be string
		},
		remarkPlugins: [remarkGfm],
	});

	const configWithoutGFM = await defineContent({
		include: "./cases/a1/*.md",
		createSlug: customSlugFunc,
		schema: {
			title: zod.string(),
		},
	});

	const postWithGFM = configWithGFM.posts.find(
		(post) => post.slug === "title",
	);
	expect(postWithGFM).toBeDefined();
	const htmlWithGFM = await postWithGFM.html();
	expect(htmlWithGFM).toBeDefined();
	expect(htmlWithGFM).toMatchSnapshot();

	const postWithoutGFM = configWithoutGFM.posts.find(
		(post) => post.slug === "title",
	);
	expect(postWithoutGFM).toBeDefined();
	const htmlWithoutGFM = await postWithoutGFM.html();
	expect(htmlWithoutGFM).toBeDefined();
	expect(htmlWithoutGFM).toMatchSnapshot();

	expect(htmlWithGFM).not.toBe(htmlWithoutGFM); // the output should be different since we use remark-gfm
});

test("createSlug check", async () => {
	const testCase = "config.md";

	const removeExt = removeExtension(testCase);
	expect(removeExt).toBe("config");

	const hash = hashing(testCase);
	expect(hash).toBe("1xxt3xut3s4");

	const mixContent = `${removeExt}-${hash}`;
	expect(mix(testCase)).toBe(mixContent);
});

test("createSlug check with config", async () => {
	let config = await defineContent({
		include: "./cases/a1/*.md",
		createSlug: "removeExtension",
		schema: {
			title: zod.number(), // should be string
		},
	});

	let post = config.posts.find((post) => post.slug === "title");
	expect(post).toBeDefined();

	config = await defineContent({
		include: "./cases/a1/*.md",
		createSlug: "hashing",
		schema: {
			title: zod.number(), // should be string
		},
	});

	post = config.posts.find((post) => post.slug === "nudwg7rest");
	expect(post).toBeDefined();

	config = await defineContent({
		include: "./cases/a1/*.md",
		createSlug: "mix",
		schema: {
			title: zod.number(), // should be string
		},
	});

	post = config.posts.find((post) => post.slug === "title-nudwg7rest");
	expect(post).toBeDefined();
});

test("createSlug check with default", async () => {
	const config = await defineContent({
		include: "./cases/a1/*.md",
		schema: {
			title: zod.number(), // should be string
		},
	});

	const post = config.posts.find((post) => post.slug === "title");
	expect(post).toBeDefined();
	expect(post.slug).toBe("title");
});
