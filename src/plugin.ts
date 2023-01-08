import { Plugin } from "@fnando/streamdeck";
import * as config from "./streamdeck.json";
import query from "./actions/Query";

const plugin = new Plugin({ ...config, actions: [query] });

export default plugin;
