import { BadgePosition } from "./Icon";

/**
 * An action to indicate a resource should be opened in the browser.
 */
export interface ViewInBrowserAction {
  /**
   * The maximum number of items (i.e. issues) to open.
   */
  limit: number;
}

export type JQLQueryKeyAction = 'Refresh' | 'ViewFilter' | ViewInBrowserAction;

/**
 * Settings used by the JQL Query action.
 */
export interface JQLQuerySettings extends BadgeSettings, PollingSettings, DefaultPluginSettings {
  /**
   * The JQL to use to query for issues from Jira.
   */
  jql: string;

  /**
   * The action to perform when the key is pressed.
   */
  keyAction: JQLQueryKeyAction;

  /**
   * Base64-encoded data of a custom image to use for the action.
   */
  customImage?: string;
}

/**
 * Settings used by actions that periodically poll for updated data.
 */
export interface PollingSettings {
  /**
   * The delay to wait in between polling events.
   */
  pollingDelay: number;
}

/**
 * Represents the type of badge to show on an icon.
 */
export enum BadgeType {
  /**
   * Shows a badge with the number inside of it.
   */
  Number = 'number',
  /**
   * Only shows the badge with no number.
   */
  Indicator = 'indicator',
  /**
   * Sets the value in the action title instead of updating the image.
   */
  UseTitle = 'title',
  /**
   * No badge.
   */
  Hidden = 'hidden'
}

/**
 * Settings used by actions that need to show a badge.
 */
export interface BadgeSettings {
  /**
   * The type of badge to show on the icon.
   */
  badgeType: BadgeType;
  /**
   * The corner of the icon where the badge should be added.
   */
  badgePosition: BadgePosition;
  /**
   * The color of the badge (default = red).
   */
  badgeColor?: string;
}

/**
 * Settings shared by all Jira actions.
 */
export interface DefaultPluginSettings {
  /**
   * The base product URL of the Jira instance.
   */
  domain: string;
  /**
   * The email address of the user to use when using the Jira API (i.e. requesting issues).
   */
  email: string;
  /**
   * An API token for the user with the email address.
   * 
   * @see https://id.atlassian.com/manage-profile/security/api-tokens
   */
  token: string;

  /**
   * The authentication strategy to use.
   * 
   * API tokens are for JIRA cloud.
   * @see https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/
   * 
   * Personal access tokens (PAT) are for JIRA server.
   * @see https://confluence.atlassian.com/enterprise/using-personal-access-tokens-1026032365.html
   */
  strategy: 'APIToken' | 'PAT'
}
