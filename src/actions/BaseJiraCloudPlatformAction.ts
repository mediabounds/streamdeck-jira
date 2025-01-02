import { DidReceiveSettingsEvent } from "@fnando/streamdeck";
import { JiraCloudTenantSettings } from "../JiraPluginSettings";
import BaseJiraAction, { CountableResponse } from "./BaseJiraAction";
import { JiraConnection } from "../JiraConnection";
import Client from "../Client";

/**
 * The expected response structure from Jira when getting tenant info.
 */
interface TenantInfo {
  cloudId: string;
}

/**
 * Base class for actions that periodically pull data from Jira Service Management.
 */
export default abstract class BaseJiraCloudPlatformAction<ResponseType extends CountableResponse<unknown>, SettingsType extends JiraCloudTenantSettings> extends BaseJiraAction<ResponseType, SettingsType> {

  /**
   * {@inheritDoc}
   */
  handleDidReceiveSettings(event: DidReceiveSettingsEvent<SettingsType>) {
    let client: Client;
    try {
      client = JiraConnection.getClient(event.settings);
    }
    catch {
      return;
    }

    if (!event.settings.cloudId) {
      this.debug(`Looking up tenant cloud ID for ${event.settings.domain}...`);
      client.request<TenantInfo>({
        endpoint: '_edge/tenant_info',
      })
      .then(response => {
        const settings = event.settings;
        settings.cloudId = response.body.cloudId;
        this.setSettings(settings);
      })
      .catch(error => {
        const settings = event.settings;
        settings.cloudId = 'unknown';
        this.setSettings(settings);
      });
    }
    else {
      super.handleDidReceiveSettings(event);
    }
  }

  /**
   * {@inheritDoc}
   */
  protected getJiraClient(settings: JiraCloudTenantSettings): Client {
    const authenticator = super.getJiraClient(settings).authenticator;
    const cloudId = settings.cloudId || 'unknown';

    if (cloudId === 'unknown') {
      throw new Error('Unable to determine cloud ID for Jira Cloud tenant');
    }

    return new Client(`https://api.atlassian.com/jsm/ops/api/${cloudId}`, authenticator);
  }

}
