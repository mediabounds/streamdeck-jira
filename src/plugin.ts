import { Plugin } from "@fnando/streamdeck";
import * as config from "./streamdeck.json";
import query from "./actions/Query";
import inlineTasks from "./actions/ConfluenceTasks";
import confluenceQuery from "./actions/CQL";

const plugin = new Plugin({ ...config, actions: [query, confluenceQuery, inlineTasks] });

export default plugin;
