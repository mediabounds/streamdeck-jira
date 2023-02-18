import { Plugin } from "@fnando/streamdeck";
import * as config from "./streamdeck.json";
import query from "./actions/Query";
import inlineTasks from "./actions/ConfluenceTasks";

const plugin = new Plugin({ ...config, actions: [query, inlineTasks] });

export default plugin;
