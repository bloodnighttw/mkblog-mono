import { PluggableList } from "unified";

interface MkblogPlugin {
	init?: () => void;
	remarkPlugins?: PluggableList;
	rehypePlugins?: PluggableList;
}

export { MkblogPlugin };
