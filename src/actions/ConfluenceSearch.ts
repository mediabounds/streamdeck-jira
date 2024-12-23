import { KeyDownEvent } from "@fnando/streamdeck";
import { ConfluenceSearchSettings } from "../JiraPluginSettings";
import { CountableResponse } from "./BaseJiraAction";
import { ActionPollingContext } from "./PollingAction";
import BaseConfluenceAction from "./BaseConfluenceAction";

/**
 * The response to the search query.
 */
interface CQLResponse {
  /**
   * The current page of results matching the query.
   */
  results: SearchResult[];
  /**
   * The total number of matching results.
   */
  totalSize: number;
}

/**
 * A Confluence search result.
 */
interface SearchResult {
  /**
   * The matching content object.
   */
  content: Content;
}

/**
 * Content in Confluence.
 */
interface Content {
  /**
   * Unique identifier for the Confluence content.
   */
  id: string;
  /**
   * The type of content.
   */
  type: 'page' | 'blogpost' | 'attachment' | 'content';
  /**
   * The status of the content.
   */
  status: string;
  /**
   * The title of the content.
   */
  title: string;
  /**
   * Details about the Space containing the content.
   */
  space: unknown;
  /**
   * URL for viewing the content.
   */
  url: string;
}

/**
 * Periodically search Confluence for content matching the CQL (Confluence QUery Language) query.
 * 
 * @see https://developer.atlassian.com/cloud/confluence/advanced-searching-using-cql/
 */
class ConfluenceSearch extends BaseConfluenceAction<CountableResponse<CQLResponse>, ConfluenceSearchSettings> {
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

    if (this.isJiraServer(event.settings)) {
      this.openURL(`${this.getUrl(event.settings)}/dosearchsite.action?cql=${encodeURIComponent(event.settings.cql)}`);
    }
    else {
      const cql = encodeURIComponent(event.settings.cql);
      if (cql) {
        this.openURL(`${this.getUrl(event.settings)}/search?cql=${cql}`);
      }
      else {
        this.openURL(`${this.getUrl(event.settings)}/home`);
      }
    }
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

    const client = this.getJiraClient(context.settings);

    const response = await client.request<CQLResponse>({
      endpoint: `rest/api/search`,
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
