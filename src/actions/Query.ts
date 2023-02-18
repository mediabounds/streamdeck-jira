import { DidReceiveSettingsEvent, KeyDownEvent } from "@fnando/streamdeck";
import { JiraConnection } from "../JiraConnection";
import { JQLQuerySettings } from "../JiraPluginSettings";
import { PollingErrorEvent, PollingResponseEvent } from "../PollingClient";
import PollingAction, { ActionPollingContext } from "./PollingAction";

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
class Query extends PollingAction<SearchResponse, JQLQuerySettings> {
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
        this.openURL(`https://${event.settings.domain}/issues/?jql=${encodeURIComponent(event.settings.jql)}`);
        break;
      default: {
        const issues = this.getPollingClient()?.getLastResponse()?.issues ?? [];

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
  handleDidReceiveSettings(event: DidReceiveSettingsEvent<JQLQuerySettings>): void {
    this.setBadge({
      value: `${this.getPollingClient()?.getLastResponse()?.total ?? 0}`,
    }, event.settings);
    super.handleDidReceiveSettings(event);
  }

  /**
   * {@inheritDoc}
   */
  protected async getResponse(context: ActionPollingContext<JQLQuerySettings>): Promise<SearchResponse> {
    const {domain, jql} = context.settings;

    if (!domain || !jql) {
      return {
        issues: [],
        total: 0,
      };
    }

    const client = JiraConnection.getClient(context.settings);
    const response = await client.request<SearchResponse>({
      endpoint: 'rest/api/latest/search',
      query: {
        jql: jql,
      },
    });

    return response.body;
  }

  /**
   * {@inheritDoc}
   */
  handleDidReceivePollingResponse(event: PollingResponseEvent<ActionPollingContext<JQLQuerySettings>, SearchResponse>): void {
    super.handleDidReceivePollingResponse(event);
    if (!event.didRecoverFromError && event.response.total === event.client.getLastResponse()?.total) {
      return;
    }

    this.setBadge({
      value: `${event.response.total ?? 0}`,
    }, event.context.settings);
  }

  /**
   * {@inheritDoc}
   */
  handleDidReceivePollingError(event: PollingErrorEvent<ActionPollingContext<JQLQuerySettings>, SearchResponse>): void {
    super.handleDidReceivePollingError(event);
    this.setBadge({
      value: '!',
      color: 'yellow',
      textColor: 'black',
    }, event.context.settings);
  }

  /**
   * Retrieves an issue URL for a provided issue.
   *
   * @param issue - The issue.
   * @param settings - The current action settings.
   * @returns The URL to the issue.
   */
  protected getIssueUrl(issue: Issue, settings: JQLQuerySettings): string {
    return `https://${settings.domain}/browse/${issue.key}`;
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
