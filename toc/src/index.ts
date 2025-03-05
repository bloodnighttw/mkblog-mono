import {Content, MkblogPlugin} from "@mkblog/core";
import {Element, Root as HRoot} from "hast";
import {h} from "hastscript";
import rehypeSlug from "rehype-slug";
import {visit} from "unist-util-visit";

declare module "@mkblog/core" {
    interface Content<T> {
        rawTOC: () => Promise<HRoot>;
        toc: () => Promise<string>;
    }
}

const tocPlugin: MkblogPlugin = {
    init: () => {
        Content.prototype.rawTOC = async function() {
            const hast = await this.hast();
            const headings: { id: string, text: string, level: number }[] = [];

            visit(hast, 'element', (node: Element) => {
                if (/^h[1-6]$/.test(node.tagName)) {
                    const id = node.properties?.id as string ?? "";
                    const text = node.children
                        .filter(child => child.type === 'text')
                        .map(child => child.value)
                        .join();
                    const level = Number.parseInt(node.tagName[1], 10);
                    headings.push({ id, text, level });
                }
            });

            const buildTOC = (headings: { id: string, text: string, level: number }[], currentLevel = 1): Element => {
                const children: Element[] = [];
                while (headings.length > 0 && headings[0].level >= currentLevel) {

                    const heading = headings.shift()!;
                    const listItem: Element = h('li', { className: `toc-level-${heading.level}` }, [
                        h('a', { href: `#${heading.id}` }, heading.text)
                    ]);

                    if (headings.length > 0 && headings[0].level > heading.level) { // note: null or undefined < 1 === true
                        listItem.children.push(buildTOC(headings, heading.level + 1));
                    }
                    children.push(listItem);
                }
                return h('ul', { className: 'toc' }, children);
            };

            return h(null, buildTOC(headings));
        }

        Content.prototype.toc = async function() {
            const tocTree = await this.rawTOC();
            return this.rehype2html().stringify(tocTree);
        }
    },
    rehypePlugins: [rehypeSlug],
}

export default tocPlugin;