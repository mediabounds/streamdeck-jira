import { DidReceiveSettingsEvent, KeyDownEvent } from "@fnando/streamdeck";
import { JiraConnection } from "../JiraConnection";
import { ConfluenceTasksSettings } from "../JiraPluginSettings";
import { PollingErrorEvent, PollingResponseEvent } from "../PollingClient";
import PollingAction, { ActionPollingContext } from "./PollingAction";

/**
 * The expected response structure from Jira when querying inline tasks.
 */
interface InlineTasksResponse {
  results: InlineTask[];
  start: number;
  limit: number;
  size: number;
}

/**
 * An individual issue from Jira.
 * 
 * An issue, of course, has way more fields, but we only care about the key.
 */
interface InlineTask {
  id: number;
  body: string;
}

interface ConfluenceUser {
  accountId: string;
}

/**
 * Periodically polls Jira to get an updated list of issues matching the configured JQL.
 */
class ConfluenceTasks extends PollingAction<InlineTasksResponse, ConfluenceTasksSettings> {
  /**
   * {@inheritDoc}
   */
  handleKeyDown(event: KeyDownEvent<ConfluenceTasksSettings>): void {
    super.handleKeyDown(event);

    const {domain} = event.settings;
    this.openURL(`https://${domain}/wiki/plugins/inlinetasks/mytasks.action`);
  }

  /**
   * {@inheritDoc}
   */
  handleDidReceiveSettings(event: DidReceiveSettingsEvent<ConfluenceTasksSettings>): void {
    this.setBadge({
      value: `${this.getPollingClient()?.getLastResponse()?.size ?? 0}`,
    }, event.settings);
    super.handleDidReceiveSettings(event);
  }

  /**
   * {@inheritDoc}
   */
  protected async getResponse(context: ActionPollingContext<ConfluenceTasksSettings>): Promise<InlineTasksResponse> {
    const {domain} = context.settings;

    if (!domain) {
      return {
        results: [],
        start: 0,
        limit: 20,
        size: 0,
      };
    }

    const client = JiraConnection.getClient(context.settings);

    const currentUser = await client.request<ConfluenceUser>({
      endpoint: 'wiki/rest/api/user/current'
    });

    const response = await client.request<InlineTasksResponse>({
      endpoint: 'wiki/rest/api/inlinetasks/search',
      query: {
        assignee: currentUser.body.accountId,
        status: 'incomplete',
      },
    });

    return response.body;
  }

  /**
   * {@inheritDoc}
   */
  handleDidReceivePollingResponse(event: PollingResponseEvent<ActionPollingContext<ConfluenceTasksSettings>, InlineTasksResponse>): void {
    super.handleDidReceivePollingResponse(event);
    if (!event.didRecoverFromError && event.response.size === event.client.getLastResponse()?.size) {
      return;
    }

    this.setBadge({
      value: `${event.response.size ?? 0}`,
    }, event.context.settings);
  }

  /**
   * {@inheritDoc}
   */
  handleDidReceivePollingError(event: PollingErrorEvent<ActionPollingContext<ConfluenceTasksSettings>, InlineTasksResponse>): void {
    super.handleDidReceivePollingError(event);
    this.setBadge({
      value: '!',
      color: 'yellow',
      textColor: 'black',
    }, event.context.settings);
  }

}

const inlineTasks = new ConfluenceTasks({
  name: 'Confluence Tasks',
  hasMultiActionSupport: false,
  tooltip: 'Displays a badge with the number of incomplete inline tasks in Confluence.',
  states: [{ image: "Jira" }],
  inspectorName: 'Confluence',
});

export default inlineTasks;
