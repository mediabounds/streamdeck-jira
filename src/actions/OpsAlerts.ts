import { KeyDownEvent } from "@fnando/streamdeck";
import { OpsAlertsSettings } from "../JiraPluginSettings";
import { CountableResponse } from "./BaseJiraAction";
import { ActionPollingContext } from "./PollingAction";
import Client from "../Client";
import BaseJsmAction from "./BaseJsmAction";

/**
 * The expected response structure from JSM when querying alerts.
 */
interface ListAlertResponse {
  values: Alert[];
  count: number;
}

/**
 * An individual operations alert.
 * 
 * An alert has way more available fields, but we really only care about the ID.
 */
interface Alert {
  id: string;
  tinyId: string;
}

/**
 * Periodically polls JSM to get a list of Alerts matching the specified query.
 * 
 * @see https://developer.atlassian.com/cloud/jira/service-desk-ops/rest/v2/api-group-alerts/#api-v1-alerts-get
 */
class OpsAlerts extends BaseJsmAction<CountableResponse<ListAlertResponse>, OpsAlertsSettings> {
  /**
   * {@inheritDoc}
   */
  handleKeyDown(event: KeyDownEvent<OpsAlertsSettings>): void {
    super.handleKeyDown(event);

    let url: string;
    if (this.getPollingClient().getLastResponse()?.count === 1) {
      const alert = this.getPollingClient().getLastResponse().data.values[0];
      url = this.getAlertUrl(alert, event.settings);
    }
    else {
      url = `${this.getUrl(event.settings)}/jira/ops/alerts?view=list&query=${encodeURIComponent(event.settings.query)}`;
    }

    if (url) {
      this.openURL(url);
    }
    else {
      this.getPollingClient().poll();
    }
  }

  /**
   * {@inheritDoc}
   */
  protected async getResponse(context: ActionPollingContext<OpsAlertsSettings>): Promise<CountableResponse<ListAlertResponse>> {
    const {domain, query} = context.settings;

    if (!domain) {
      return {
        count: 0
      };
    }

    const cloudId = await this.getTenantCloudId(context.settings);
    const auth = this.getJiraClient(context.settings).authenticator;
    const client = new Client(`https://api.atlassian.com/jsm/ops/api/${cloudId}`, auth);

    const response = await client.request<ListAlertResponse>({
      endpoint: `v1/alerts`,
      query: {
        query: query,
      },
    });

    return {
      count: response.body.count,
      data: response.body,
    }
  }

  /**
   * Gets a URL to view an alert in the browser.
   *
   * @param alert - The alert.
   * @param settings - The plugin settings.
   * @returns The URL to view the alert info.
   */
  protected getAlertUrl(alert: Alert, settings: OpsAlertsSettings): string {
    return `${this.getUrl(settings)}/jira/ops/alerts/${alert.id}`;
  }

}

const alerts = new OpsAlerts({
  name: 'Ops Alerts',
  hasMultiActionSupport: false,
  tooltip: 'Displays a badge with the number of Jira Service Management Operations Alerts matching the specified query.',
  states: [{ image: "OpsAlerts" }],
  inspectorName: 'OpsAlerts',
});

export default alerts;
