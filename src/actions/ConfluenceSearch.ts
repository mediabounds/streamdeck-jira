import { KeyDownEvent } from "@fnando/streamdeck";
import { JiraConnection } from "../JiraConnection";
import { ConfluenceSearchSettings } from "../JiraPluginSettings";
import BaseJiraAction, { CountableResponse } from "./BaseJiraAction";
import { ActionPollingContext } from "./PollingAction";

interface CQLResponse {
  results: SearchResult[];
  totalSize: number;
}

interface SearchResult {
  content: Content;
}

interface Content {
  id: string;
  type: string;
  status: string;
  title: string;
  space: unknown;
  url: string;
}

class ConfluenceSearch extends BaseJiraAction<CountableResponse<CQLResponse>, ConfluenceSearchSettings> {
  /**
   * {@inheritDoc}
   */
  handleKeyDown(event: KeyDownEvent<ConfluenceSearchSettings>): void {
    super.handleKeyDown(event);

    if (this.getPollingClient()?.getLastResponse().count === 1) {
      const content = this.getPollingClient().getLastResponse().data?.results[0]?.content;
      if (content && content.url) {
        this.openURL(content.url);
        return;
      }
    }
    
    const apiContext = event.settings.strategy === 'PAT' ? '' : '/wiki';
    this.openURL(`https://${event.settings.domain}${apiContext}/search?cql=${encodeURIComponent(event.settings.cql)}`);
  }

  /**
   * {@inheritDoc}
   */
  protected async getResponse(context: ActionPollingContext<ConfluenceSearchSettings>): Promise<CountableResponse<CQLResponse>> {
    const {domain, cql} = context.settings;

    if (!domain || !cql) {
      return {
        count: 0
      };
    }

    const client = JiraConnection.getClient(context.settings);

    const apiContext = context.settings.strategy === 'PAT' ? '' : 'wiki';

    const response = await client.request<CQLResponse>({
      endpoint: `${apiContext}/rest/api/search`,
      query: {
        cql: cql,
        limit: '5',
      },
    });

    return {
      count: response.body.totalSize,
      data: response.body,
    };
  }

}

const confluenceQuery = new ConfluenceSearch({
  name: 'Confluence Search',
  hasMultiActionSupport: false,
  tooltip: 'Displays a badge with the number of search results for a given CQL query.',
  states: [{ image: "Confluence" }],
  inspectorName: 'ConfluenceSearch',
});

export default confluenceQuery;
