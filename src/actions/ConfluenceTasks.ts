import { KeyDownEvent } from "@fnando/streamdeck";
import { ConfluenceTasksSettings } from "../JiraPluginSettings";
import { CountableResponse } from "./BaseJiraAction";
import { ActionPollingContext } from "./PollingAction";
import BaseConfluenceAction from "./BaseConfluenceAction";

/**
 * Query parameters for filtering inline tasks.
 */
interface InlineTaskFilter {
  /**
   * Account ID of a user to whom a task is assigned.
   */
  assignee: string;
  /**
   * The status of the task (checked/unchecked).
   */
  status: 'complete' | 'incomplete';
  /**
   * The number of results to be returned (default is 20).
   */
  limit?: number;
  /**
   * Start of date range based on due dates (inclusive); in milliseconds since epoch.
   */
  duedateFrom?: number;
  /**
   * End of date range based on due dates (inclusive); in milliseconds since epoch.
   */
  duedateTo?: number;
}

/**
 * The API response when querying inline tasks.
 * 
 * The API includes other properties, but we are only structuring the ones we care about.
 */
interface InlineTasksResponse {
  /**
   * The tasks matching the query.
   */
  results: InlineTask[];
  /**
   * The total number of tasks matching the query.
   */
  size: number;
}

/**
 * An individual inline task.
 */
interface InlineTask {
  /**
   * The ID of the task.
   */
  id: number;
  /**
   * The contents of the task.
   */
  body: string;
  /**
   * The due date of the task (in milliseconds since epoch).
   */
  dueDate?: number;
}

/**
 * A Confluence user.
 */
interface ConfluenceUser {
  /**
   * The account ID of the user, which uniquely identifies the user across all Atlassian products.
   */
  accountId: string;
}

/**
 * Periodically polls Confluence to get the number of inline tasks assigned to the current user.
 */
class ConfluenceTasks extends BaseConfluenceAction<CountableResponse<InlineTasksResponse>, ConfluenceTasksSettings> {
  /**
   * {@inheritDoc}
   */
  handleKeyDown(event: KeyDownEvent<ConfluenceTasksSettings>): void {
    super.handleKeyDown(event);
    this.openURL(`${this.getUrl(event.settings)}/plugins/inlinetasks/mytasks.action`);
  }

  /**
   * {@inheritDoc}
   */
  protected async getResponse(context: ActionPollingContext<ConfluenceTasksSettings>): Promise<CountableResponse<InlineTasksResponse>> {
    const {domain, dueDateFrom, dueDateTo} = context.settings;

    if (!domain) {
      return {
        count: 0,
      };
    }

    const client = this.getJiraClient(context.settings);

    if (this.isJiraServer(context.settings)) {
      // In JIRA Server, getting the count of inline tasks
      // is part of Notifications and Tasks REST API.
      // There doesn't seem to be a way to filter by due date.
      const response = await client.request<number>({
        endpoint: 'rest/mywork/task/count',
        query: {
          completed: 'false',
        },
      });

      return {
        count: response.body,
      };
    }

    // https://developer.atlassian.com/cloud/confluence/rest/v1/api-group-users/#api-wiki-rest-api-user-current-get
    const currentUserResponse = await client.request<ConfluenceUser>({
      endpoint: `rest/api/user/current`
    });

    const filter: InlineTaskFilter = {
      assignee: currentUserResponse.body.accountId,
      status: 'incomplete',
      limit: 99,
    };

    if (dueDateFrom) {
      filter.duedateFrom = Date.parse(dueDateFrom);
    }
    if (dueDateTo) {
      filter.duedateTo = Date.parse(dueDateTo);
    }

    // https://developer.atlassian.com/cloud/confluence/rest/v1/api-group-inline-tasks/#api-wiki-rest-api-inlinetasks-search-get
    const response = await client.request<InlineTasksResponse>({
      endpoint: `rest/api/inlinetasks/search`,
      query: {...filter},
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
  tooltip: 'Displays a badge with the number of incomplete inline tasks assigned to you in Confluence.',
  states: [{ image: "ConfluenceTasks" }],
  inspectorName: 'ConfluenceTasks',
});

export default inlineTasks;
