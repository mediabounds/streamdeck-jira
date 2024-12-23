import Client from "../Client";
import { CommonSettings, DefaultPluginSettings } from "../JiraPluginSettings";
import BaseJiraAction, { CountableResponse } from "./BaseJiraAction";

/**
 * Base class for actions that periodically pull data from Confluence.
 */
export default abstract class BaseConfluenceAction<ResponseType extends CountableResponse<unknown>, SettingsType extends CommonSettings> extends BaseJiraAction<ResponseType, SettingsType> {
  /**
   * {@inheritDoc}
   */
  protected override getJiraClient(settings: DefaultPluginSettings): Client {
    this.validateSettings(settings);
    return super.getJiraClient(settings);
  }

  /**
   * {@inheritDoc}
   */
  protected override getUrl(settings: DefaultPluginSettings): string | null {
    this.validateSettings(settings);
    return super.getUrl(settings);
  }

  /**
   * Ensures that the settings have a proper context defined.
   * 
   * When using JIRA Cloud, the context (as far as I know) is always `wiki`.
   * But when using JIRA Server, the context could be anything.
   * 
   * @param settings - The current plugin settings.
   */
  private validateSettings(settings: DefaultPluginSettings) {
    // Ensure that the default context is set to `wiki` for JIRA Cloud.
    if (!this.isJiraServer(settings) && !settings.context) {
      settings.context = 'wiki';
    }
  }
}
