import path from "node:path";
import {type PluggableList, unified} from "unified";
import remark2rehype from "remark-rehype";
import remarkParse from "remark-parse";
import rehypeStringify from "rehype-stringify";
import fs from "node:fs";
import type {Root as HastRoot} from "hast";
import type {Root as MDRoot, Yaml} from "mdast";
import frontmatter from "remark-frontmatter";
import {select} from "unist-util-select";
import yaml from "yaml";
import {z, type ZodRawShape} from "zod";
import fastGlob, {type Pattern} from "fast-glob";
import {hashing, mix, removeExtension} from "@/utils/slug";

interface ContentOptions<T extends ZodRawShape> {
    /**
     * @param include the glob pattern of the markdown files
     * @param createSlug the function to create the slug of the markdown file,
     * you can use "removeExtension" | "hashing" | "mix" | ((from: string) => string)
     *   - removeExtension: remove the extension of the file
     *   - hashing: hash the file path
     *   - mix: mix the file path and hash
     *   - ((from: string) => string): custom function to create the slug
     *   - default: removeExtension, if not provided
     * @param schema the schema of the metadata, using zod to define and validate the data.
     * @param mkBlogPlugins the function to create the plugins for the markdown blog, not implemented yet.
     * @param remarkPlugins the list of remark plugins
     * @param rehypePlugins the list of rehype plugins
     */
    include: Pattern | Pattern[]
	createSlug?: "removeExtension" | "hashing" | "mix" | ((from: string) => string);
	schema: T;

	mkBlogPlugins?: () => void;
	remarkPlugins?: PluggableList;
	rehypePlugins?: PluggableList;
}

/**
 * @Param T the type of the metadata, we use this to infer the type of the metadata.
 */
class Content<T> {
    /**
     * @param filepath the path of the markdown file
     * @param slug the slug of the markdown file, you can use this to generate the url
     * @param remarkPlugins the list of remark plugins
     * @param rehypePlugins the list of rehype plugins
     * @param schema the schema of the metadata, using zod to define and validate the data.
     * @constructor create a new instance of Content, you should use defineContent to create a collection of Content if
     * you don't know what this is doing.
     * @Return return a new instance of Content
     */
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

    /**
     * @protected this method should be called internally, it's used to create a remark processor.
     * @Return return a unified processor which can be used to parse markdown content and apply remark plugins.
     */
	protected remarkProcessor() {
		return unified()
			.use(remarkParse)
			.use(frontmatter) // for metadata decode
			.use(this.remarkPlugins);
	}


    /**
     * @protected this method should be called internally, it's used to create a rehype processor.
     * @Return return a unified processor which can be used to convert mdast to hast and apply rehype plugins.
     */
	protected rehypeProcessor() {
		return unified().use(remark2rehype).use(this.rehypePlugins);
	}

    /**
     * @protected this method should be called internally, it's used to create a rehype to html processor.
     * @Return return a unified processor which can be used to convert hast to html string.
     */
	protected rehype2html() {
		return unified().use(rehypeStringify);
	}

    /**
     * @protected this method should be called internally, it's used to parse the markdown file and return the mdast.
     * @Return return the mdast of the markdown file.
     */
	protected async mdast(): Promise<MDRoot> {
		const fileContent = await fs.promises.readFile(this.filepath, "utf-8");
		return this.remarkProcessor().parse(fileContent);
	}


    /**
     * @protected this method should be called internally, it's used to convert the mdast to hast.
     * @param mdroot the mdast root, if it's null, we will fetch mdast automatically
     * @Return return the hast of the markdown file.
     */
	protected async hast(mdroot: MDRoot | null = null): Promise<HastRoot> {
		const temp = mdroot ?? (await this.mdast());
		return await this.rehypeProcessor().run(temp);
	}

	/**
	 * @param root the hast root, if it's null, we will fetch hast automatically
	 * @Return return raw html string of content.
	 */
	public async html(root: HastRoot | null = null) {
		const temp = root ?? (await this.hast());
		return this.rehype2html().stringify(temp);
	}

    /**
     * @param mdast the mdast root, if it's null, we will fetch mdast automatically
     * @Return return the metadata of the markdown file. we use zod to validate the metadata.
     * @throws if metadata not found or metadata is invalid.
     */
	public async metadata(mdast: MDRoot | null = null): Promise<T> {
		const temp = mdast ?? (await this.mdast());
		const yamlContent = select("yaml", temp) as Yaml | null;

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

async function defineContent<T extends ZodRawShape>(
	options: ContentOptions<T>,
): Promise<Collection<T>> {

    const files = await fastGlob(options.include);
    const slugFunc =
        options.createSlug === "removeExtension" ? removeExtension :
        options.createSlug === "hashing" ? hashing :
        options.createSlug === "mix" ? mix :
        options.createSlug ?? removeExtension;

	const posts = files.map((file) => {
		const filepath = path.join(process.cwd(), file);
		return new Content<T>(
			filepath,
			slugFunc(file),
			options.remarkPlugins ?? [],
			options.rehypePlugins ?? [],
			z.object(options.schema),
		);
	});

	return { posts };
}

export type { ContentOptions, Collection };

export { defineContent, Content, z as zod };
