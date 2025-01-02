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

/**
 * An action to open a custom URL.
 */
export interface OpenUrlAction {
  /**
   * The URL to open when the action is invoked.
   */
  url: string;
}

export type JQLQueryKeyAction = 'Refresh' | 'ViewFilter' | ViewInBrowserAction | OpenUrlAction;

/**
 * Settings used by the JQL Query action.
 */
export interface JQLQuerySettings extends CommonSettings {
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
 * Available actions when the OpsAlert button is pressed.
 */
export type OpsAlertsKeyAction = 'View' | 'Acknowledge';

/**
 * A date filter for alerts.
 */
export type OpsAlertsDateFilter = 'All' | RelativeDateFilter | AbsoluteDateFilter;

/**
 * Represents a relative date filter (as in number of hours ago).
 */
export interface RelativeDateFilter {
  /**
   * The number of hours ago from the current time.
   */
  value: number;
}

/**
 * Represents an absolute date filter.
 */
export interface AbsoluteDateFilter {
  /**
   * The date string.
   */
  date: string;
}

/**
 * Settings used by the OpsAlerts action.
 */
export interface OpsAlertsSettings extends CommonSettings {
  /**
   * The query to use for filtering alerts.
   * 
   * @see https://operations-help.atlassian.net/wiki/spaces/OPSHELP/pages/8028374/Search+syntax+for+alerts
   */
  query: string;

  /**
   * Only include alerts occurring after the date filter.
   */
  after?: OpsAlertsDateFilter;

  /**
   * Only include alerts occurring before the date filter.
   */
  before?: OpsAlertsDateFilter;

  /**
   * The action to perform when the key is pressed.
   */
  keyAction: OpsAlertsKeyAction;
}

/**
 * Settings used by the Confluence Search action.
 */
export interface ConfluenceSearchSettings extends CommonSettings {
  /**
   * The CQL to use to query for content from Confluence.
   * @see https://developer.atlassian.com/cloud/confluence/advanced-searching-using-cql/
   */
  cql: string;
}

/**
 * Settings used by the Confluence inline tasks action.
 */
export interface ConfluenceTasksSettings extends CommonSettings {
  /**
   * Only return inline tasks due on or after this date (formatted as yyyy-mm-dd).
   */
  dueDateFrom?: string;
  /**
   * Only return inline tasks due before this date (formatted as yyyy-mm-dd).
   */
  dueDateTo?: string;
}

/**
 * Common settings used by all actions.
 */
export interface CommonSettings extends IconSettings, PollingSettings, DefaultPluginSettings {}

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
 * Represents image effects that can be applied on an icon.
 */
export enum ImageEffect {
  /**
   * No image effect is applied.
   */
  None = 'none',

  /**
   * Desaturates the icon so it is grayscale.
   */
  Desaturate = 'desaturate'
}

export interface IconSettings extends BadgeSettings {
  /**
   * Base64-encoded data of a custom image to use for the action.
   */
  customImage?: string;

  /**
   * An effect to apply to the icon when there are no results.
   */
  noResultsEffect?: ImageEffect;
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
   * For Jira Server instances, they may have a custom context path defined.
   * 
   * @see https://confluence.atlassian.com/jirakb/change-the-context-path-used-to-access-jira-server-225119408.html
   */
  context: string;

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
