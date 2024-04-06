import { KeyDownEvent } from "@fnando/streamdeck";
import { JiraConnection } from "../JiraConnection";
import { JQLQuerySettings } from "../JiraPluginSettings";
import BaseJiraAction, { CountableResponse } from "./BaseJiraAction";
import { ActionPollingContext } from "./PollingAction";

/**
 * The expected response structure from Jira when executing JQL.
 */
interface SearchResponse {
  issues: Issue[];
  total: number;
}

/**
 * An individual issue from Jira.
 * 
 * An issue, of course, has way more fields, but we only care about the key.
 */
interface Issue {
  key: string;
}

/**
 * Periodically polls Jira to get an updated list of issues matching the configured JQL.
 */
class Query extends BaseJiraAction<CountableResponse<SearchResponse>, JQLQuerySettings> {
  /**
   * {@inheritDoc}
   */
  handleKeyDown(event: KeyDownEvent<JQLQuerySettings>): void {
    super.handleKeyDown(event);

    switch (event.settings.keyAction) {
      case 'Refresh':
        this.getPollingClient()?.poll();
        break;
      case 'ViewFilter':
        this.openURL(`${this.getUrl(event.settings)}/issues/?jql=${encodeURIComponent(event.settings.jql)}`);
        break;
      default: {
        const issues = this.getPollingClient()?.getLastResponse()?.data?.issues ?? [];

        issues
          .slice(0, event.settings.keyAction.limit ?? 5)
          .forEach(issue => {
            this.openURL(this.getIssueUrl(issue, event.settings));
          });    
        break;
      }
    }
  }

  /**
   * {@inheritDoc}
   */
  protected async getResponse(context: ActionPollingContext<JQLQuerySettings>): Promise<CountableResponse<SearchResponse>> {
    const {domain, jql} = context.settings;

    if (!domain || !jql) {
      return {
        count: 0
      };
    }

    const client = JiraConnection.getClient(context.settings);
    const response = await client.request<SearchResponse>({
      endpoint: 'rest/api/latest/search',
      query: {
        jql: jql,
      },
    });

    return {
      count: response.body.total,
      data: response.body,
    }
  }

  /**
   * Retrieves an issue URL for a provided issue.
   *
   * @param issue - The issue.
   * @param settings - The current action settings.
   * @returns The URL to the issue.
   */
  protected getIssueUrl(issue: Issue, settings: JQLQuerySettings): string {
    return `${this.getUrl(settings)}/browse/${issue.key}`;
  }

}

const jira = new Query({
  name: 'JQL Result',
  hasMultiActionSupport: false,
  tooltip: 'Displays a badge with the number of issues matching a JQL query.',
  states: [{ image: "Jira" }],
  inspectorName: 'Query',
});

export default jira;
