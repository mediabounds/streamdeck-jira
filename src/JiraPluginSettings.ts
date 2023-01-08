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
 * Settings used by actions that need to show a badge.
 */
export interface BadgeSettings {
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
}
