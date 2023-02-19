import { KeyDownEvent } from "@fnando/streamdeck";
import { JiraConnection } from "../JiraConnection";
import { ConfluenceTasksSettings } from "../JiraPluginSettings";
import BaseJiraAction, { CountableResponse } from "./BaseJiraAction";
import { ActionPollingContext } from "./PollingAction";

/**
 * The expected response structure from Jira when querying inline tasks.
 */
interface InlineTasksResponse {
  results: InlineTask[];
  start: number;
  limit: number;
  size: number;
}

interface InlineTaskFilter {
  duedateFrom?: number; // milliseconds
  duedateTo?: number; // milliseconds
}

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
class ConfluenceTasks extends BaseJiraAction<CountableResponse<InlineTasksResponse>, ConfluenceTasksSettings> {
  /**
   * {@inheritDoc}
   */
  handleKeyDown(event: KeyDownEvent<ConfluenceTasksSettings>): void {
    super.handleKeyDown(event);

    const apiContext = event.settings.strategy === 'PAT' ? '' : '/wiki';
    this.openURL(`https://${event.settings.domain}${apiContext}/plugins/inlinetasks/mytasks.action`);
  }

  /**
   * {@inheritDoc}
   */
  protected async getResponse(context: ActionPollingContext<ConfluenceTasksSettings>): Promise<CountableResponse<InlineTasksResponse>> {
    const {domain, dueDateFrom, dueDateTo} = context.settings;

    if (!domain) {
      return {
        count: 0
      };
    }

    const client = JiraConnection.getClient(context.settings);

    const apiContext = context.settings.strategy === 'PAT' ? '' : 'wiki';
    const currentUserResponse = await client.request<ConfluenceUser>({
      endpoint: `${apiContext}/rest/api/user/current`
    });

    const filter: InlineTaskFilter = {};
    if (dueDateFrom) {
      filter.duedateFrom = Date.parse(dueDateFrom);
    }
    if (dueDateTo) {
      filter.duedateTo = Date.parse(dueDateTo);
    }

    const response = await client.request<InlineTasksResponse>({
      endpoint: `${apiContext}/rest/api/inlinetasks/search`,
      query: {
        assignee: currentUserResponse.body.accountId,
        status: 'incomplete',
        ...filter,
      },
    });

    return {
      count: response.body.size,
      data: response.body,
    };
  }

}

const inlineTasks = new ConfluenceTasks({
  name: 'Confluence Tasks',
  hasMultiActionSupport: false,
  tooltip: 'Displays a badge with the number of incomplete inline tasks in Confluence.',
  states: [{ image: "Confluence" }],
  inspectorName: 'Confluence',
});

export default inlineTasks;
