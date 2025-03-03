import path from "node:path";
import { type PluggableList, unified } from "unified";
import remark2rehype from "remark-rehype";
import remarkParse from "remark-parse";
import rehypeStringify from "rehype-stringify";
import fs from "node:fs";
import type { Root as HastRoot } from "hast";
import type { Root as MDRoot } from "mdast";
import frontmatter from "remark-frontmatter";
import { select } from "unist-util-select";
import yaml from "yaml";
import { z, type ZodRawShape } from "zod";

interface ContentOptions<T extends ZodRawShape> {
	root: string;
	matchRegex?: RegExp | "markdown";
	createSlug?: (from: string) => string;
	schema: T;

	mkBlogPlugins?: () => void;
	remarkPlugins?: PluggableList;
	rehypePlugins?: PluggableList;
}

interface YAMLNode {
	type: "yaml";
	value: string;
}

class Content<T> {
	readonly filepath: string;
	readonly slug: string;
	private readonly remarkPlugins: PluggableList;
	private readonly rehypePlugins: PluggableList;
	private readonly schema: z.ZodSchema<T>;

	constructor(
		filepath: string,
		slug: string,
		remarkPlugins: PluggableList,
		rehypePlugins: PluggableList,
		schema: z.Schema,
	) {
		this.filepath = filepath;
		this.slug = slug;
		this.remarkPlugins = remarkPlugins;
		this.rehypePlugins = rehypePlugins;
		this.schema = schema;
	}

	protected remarkProcessor() {
		return unified()
			.use(remarkParse)
			.use(frontmatter) // for metadata decode
			.use(this.remarkPlugins);
	}

	protected rehypeProcessor() {
		return unified().use(remark2rehype).use(this.rehypePlugins);
	}

	protected rehype2html() {
		return unified().use(rehypeStringify);
	}

	/**
	 * @protected to fetch the markdown and html ast, used internal.
	 */

	protected async mdast(): Promise<MDRoot> {
		const fileContent = await fs.promises.readFile(this.filepath, "utf-8");
		return this.remarkProcessor().parse(fileContent);
	}

	protected async hast(mdroot: MDRoot | null = null): Promise<HastRoot> {
		const temp = mdroot ?? (await this.mdast());
		return await this.rehypeProcessor().run(temp);
	}

	/**
	 *
	 * @param root the hast root, if it's null, we will fetch hast automatically
	 * @protected this method should be called internally
	 * @Return return raw html string of content.
	 */
	protected async html(root: HastRoot | null = null) {
		const temp = root ?? (await this.hast());
		return this.rehype2html().stringify(temp);
	}

	public async metadata(mdast: MDRoot | null = null): Promise<T> {
		const temp = mdast ?? (await this.mdast());
		const yamlContent = select("yaml", temp) as YAMLNode;

		if (yamlContent) {
			const metadata = yaml.parse(yamlContent.value);
			return this.schema.parse(metadata);
		}

		throw new Error("metadata not found");
	}
}

interface Collection<T> {
	posts: Content<T>[];
}


const markdownRegex = /\.md$/;

async function defineContent<T extends ZodRawShape>(
	options: ContentOptions<T>,
): Promise<Collection<T>> {
	const base = path.join(process.cwd(), options.root);
	const changeRegex =
		options.matchRegex === "markdown" || !options.matchRegex
			? markdownRegex
			: options.matchRegex;
	const files = (await fs.promises.readdir(base)).filter((file) =>
		changeRegex.test(file),
	);

	const posts = files.map((file) => {
		const filepath = path.join(base, file);
		const slug =
			options.createSlug?.(file) ?? file.replace(changeRegex, "");
		return new Content<T>(
			filepath,
			slug,
			options.remarkPlugins ?? [],
			options.rehypePlugins ?? [],
			z.object(options.schema),
		);
	});

	return { posts };
}
export type { ContentOptions, Collection };

export { defineContent, Content, z as zod };
