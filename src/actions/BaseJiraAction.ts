import { DidReceiveSettingsEvent } from "@fnando/streamdeck";
import Icon, { BadgeOptions } from "../Icon";
import { IconSettings, BadgeType, CommonSettings, DefaultPluginSettings, ImageEffect } from "../JiraPluginSettings";
import { PollingErrorEvent, PollingResponseEvent } from "../PollingClient";
import PollingAction, { ActionPollingContext } from "./PollingAction";
import Client from "../Client";
import { JiraConnection } from "../JiraConnection";

/**
 * A generic API response that has a countable number of results.
 */
export interface CountableResponse<T> {
  /**
   * The original API response.
   */
  data?: T;
  /**
   * The "count" resolved from the API response (i.e. the number of issues matching a query).
   *
   * This is used for populating the badge on the icon.
   */
  count: number;
}

/**
 * Base class for all actions that periodically poll data from Jira/Confluence.
 */
export default abstract class BaseJiraAction<ResponseType extends CountableResponse<unknown>, SettingsType extends CommonSettings> extends PollingAction<ResponseType, SettingsType> {
  /**
   * {@inheritDoc}
   */
  handleDidReceiveSettings(event: DidReceiveSettingsEvent<SettingsType>): void {
    this.setBadge({
      value: `${this.getPollingClient()?.getLastResponse()?.count ?? 0}`,
    }, event.settings);
    super.handleDidReceiveSettings(event);
  }

  /**
   * {@inheritDoc}
   */
  handleDidReceivePollingError(event: PollingErrorEvent<ActionPollingContext<SettingsType>, ResponseType>): void {
    super.handleDidReceivePollingError(event);
    this.setBadge({
      value: '!',
      color: 'yellow',
      textColor: 'black',
    }, event.context.settings);
  }

  /**
   * {@inheritDoc}
   */
  handleDidReceivePollingResponse(event: PollingResponseEvent<ActionPollingContext<SettingsType>, ResponseType>): void {
    super.handleDidReceivePollingResponse(event);

    if (!event.didRecoverFromError && event.response.count === event.client.getLastResponse()?.count) {
      return;
    }

    this.setBadge({
      value: `${event.response.count ?? 0}`,
    }, event.context.settings);
  }

  /**
   * {@inheritDoc}
   */
  protected getPollingDelay(settings: SettingsType): number {
    return settings.pollingDelay ?? super.getPollingDelay(settings);
  }

  /**
   * Updates the badge shown for the current action.
   * 
   * @param badge - Options to use for applying a badge to the icon.
   * @param settings - The current action settings.
   */
  protected setBadge(badge: BadgeOptions, settings: IconSettings) {
    const hasNoResults = badge.value == "0" || !badge.value.length;
    const badgeHidden = hasNoResults || settings.badgeType === BadgeType.Hidden || settings.badgeType === BadgeType.UseTitle;

    if (!hasNoResults && settings.badgeType === BadgeType.UseTitle) {
      this.setTitle(badge.value);
    }
    else {
      this.setTitle('');
    }

    if (settings.badgeType === BadgeType.Indicator) {
      badge.value = ' ';
    }

    if (!badge.color) {
      badge.color = settings.badgeColor;
    }

    if (!badge.position) {
      badge.position = settings.badgePosition;
    }

    let filter = 'none';
    if (hasNoResults && settings.noResultsEffect === ImageEffect.Desaturate) {
      filter = 'grayscale(100%)';
    }

    (new Icon())
      .addImage(settings.customImage ?? this.getDefaultImage(), 0, 0, 144, 144, filter)
      .then((icon) => {
        if (!badgeHidden) {
          icon.setBadge(badge);
        }
        this.setImage(icon.getImage());
      })
      .catch((error) => {
        this.setImage(null);
      });
  }

  /**
   * Retrieves the path to the default image for the action.
   * 
   * @returns The path to the default image for the current action.
   */
  protected getDefaultImage(): string {
    return `images/actions/${this.constructor.name}/${this.states[0].image}@2x.png`;
  }

  /**
   * Determines whether the plugin is configured for JIRA Server.
   *
   * @param settings - The plugin settings.
   * @returns `true` if the plugin settings indicate it is configured for JIRA Server.
   */
  protected isJiraServer(settings: DefaultPluginSettings): boolean {
    return settings.strategy === 'PAT';
  }

  /**
   * Gets an HTTP client for making API calls to JIRA.
   * 
   * @param settings - The plugin settings.
   * @returns A configured HTTP client for making API calls.
   */
  protected getJiraClient(settings: DefaultPluginSettings): Client {
    return JiraConnection.getClient(settings);
  }

  /**
   * Retrieves the base URL to the Atlassian instance.
   * @param settings - The plugin settings.
   * @returns The base URL to the Atlassian instance.
   */
  protected getUrl(settings: DefaultPluginSettings): string|null {
    if (!settings.domain) {
      return null;
    }

    let url = `https://${settings.domain}`;
    if (settings.context) {
      url = `${url}/${settings.context}`;
    }

    return url;
  }
}
