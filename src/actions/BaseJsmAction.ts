import { DidReceiveSettingsEvent } from "@fnando/streamdeck";
import { CommonSettings, DefaultPluginSettings } from "../JiraPluginSettings";
import BaseJiraAction, { CountableResponse } from "./BaseJiraAction";

/**
 * The expected response structure from Jira when getting tenant info.
 */
interface TenantInfo {
  cloudId: string;
}

/**
 * Base class for actions that periodically pull data from Jira Service Management.
 */
export default abstract class BaseJsmAction<ResponseType extends CountableResponse<unknown>, SettingsType extends CommonSettings> extends BaseJiraAction<ResponseType, SettingsType> {
  private cloudId?: string

  /**
   * {@inheritDoc}
   */
  handleDidReceiveSettings(event: DidReceiveSettingsEvent<SettingsType>) {
    super.handleDidReceiveSettings(event);

    // The configuration for the server may have changed.
    this.cloudId = null;
  }

  /**
   * Gets the cloud ID for the JIRA Cloud instance.
   * 
   * @param settings - The plugin settings.
   * @returns The cloud ID for the tenant.
   */
  protected async getTenantCloudId(settings: DefaultPluginSettings): Promise<string> {
    if (!this.cloudId) {
      const response = await this.getJiraClient(settings).request<TenantInfo>({
        endpoint: '_edge/tenant_info',
      });
      
      this.cloudId = response.body.cloudId;
    }

    return this.cloudId;
  }

}
