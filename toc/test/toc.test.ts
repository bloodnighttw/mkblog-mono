import {expect, test} from "vitest";
import init from "../src";
import {defineContent,zod} from "../../core/src";
import remarkGfm from "remark-gfm";

test("Table of content hast check", async ()=> {

    const config = await defineContent({
        include: ["./cases/toc/*.md"],
        schema: {
            title: zod.string(),
        },
        mkBlogPlugins: [
            init
        ],
        remarkPlugins: [remarkGfm],
    })

    const post = config.posts.find((post) => post.slug === "toc");
    // @ts-ignore mono-repo issue
    const tocTree = await post.rawTOC();

    expect(tocTree).toMatchSnapshot();

})

test("Table of content html string check", async ()=> {

    const config = await defineContent({
        include: ["./cases/toc/*.md"],
        schema: {
            title: zod.string(),
        },
        mkBlogPlugins: [
            init
        ],
        remarkPlugins: [remarkGfm],
    })

    const post = config.posts.find((post) => post.slug === "toc");
    // @ts-ignore mono-repo issue
    const toc = await post.toc();

    expect(toc).toMatchSnapshot();
})