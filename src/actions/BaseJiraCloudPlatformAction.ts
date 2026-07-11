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
    if (!event.settings.cloudId && this.requiresCloudId(event.settings)) {
      this.debug(`Looking up tenant cloud ID for ${event.settings.domain}...`);
      this.lookupCloudId(event.settings)
        .then(cloudId => {
          const settings = event.settings;
          settings.cloudId = cloudId;
          this.setSettings(settings);
        })
        .catch(error => {
          this.debug(`Failed to lookup tenant cloud ID for ${event.settings.domain}: ${(error as Error).message}`);
          const settings = event.settings;
          settings.cloudId = 'unknown';
          this.setSettings(settings);
        });
      return;
    }

    super.handleDidReceiveSettings(event);
  }

  protected requiresCloudId(settings: JiraCloudTenantSettings): boolean {
    return settings.strategy === 'ScopedAPIToken';
  }

  protected async lookupCloudId(settings: JiraCloudTenantSettings): Promise<string> {
    const {domain} = settings;
    if (!domain) {
      throw new Error('Domain is required to lookup cloud ID');
    }

    const client = new Client(`https://${domain}`, undefined);

    const response = await client.request<TenantInfo>({
      endpoint: '_edge/tenant_info',
    });

    return response.body.cloudId;
  }

  protected getBasePath(cloudId: string): string | null {
    return `ex/jira/${cloudId}`;
  }

  /**
   * {@inheritDoc}
   */
  protected getJiraClient(settings: JiraCloudTenantSettings): Client {
    const { cloudId } = settings;
    if (!cloudId || cloudId === 'unknown') {
      if (!this.requiresCloudId(settings)) {
        return super.getJiraClient(settings);
      }
      else {
        throw new Error('Cloud ID is required');
      }
    }

    const endpoint = `https://api.atlassian.com/${this.getBasePath(cloudId)}`;

    const authenticator = JiraConnection.getAuthenticator(settings);

    return new Client(endpoint, authenticator);
  }

}
