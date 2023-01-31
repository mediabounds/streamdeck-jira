import { DidReceiveSettingsEvent, KeyDownEvent } from "@fnando/streamdeck";
import Client, { Authenticator, BasicAuth, TokenAuth } from "../Client";
import Icon, { BadgeOptions } from "../Icon";
import { BadgeType, JQLQuerySettings } from "../JiraPluginSettings";
import { PollingErrorEvent, PollingResponseEvent } from "../PollingClient";
import PollingAction, { ActionPollingContext } from "./PollingAction";

/**
 * The expected response structure from Jira when executing JQL.
 */
interface SearchResponse {
  issues: Issue[];
  total: number;
}

/**
 * An individual issue from Jira.
 * 
 * An issue, of course, has way more fields, but we only care about the key.
 */
interface Issue {
  key: string;
}

/**
 * Periodically polls Jira to get an updated list of issues matching the configured JQL.
 */
class Query extends PollingAction<SearchResponse, JQLQuerySettings> {
  /**
   * {@inheritDoc}
   */
  handleKeyDown(event: KeyDownEvent<JQLQuerySettings>): void {
    super.handleKeyDown(event);

    switch (event.settings.keyAction) {
      case 'Refresh':
        this.getPollingClient()?.poll();
        break;
      case 'ViewFilter':
        this.openURL(`https://${event.settings.domain}/issues/?jql=${encodeURIComponent(event.settings.jql)}`);
        break;
      default: {
        const issues = this.getPollingClient()?.getLastResponse()?.issues ?? [];

        issues
          .slice(0, event.settings.keyAction.limit ?? 5)
          .forEach(issue => {
            this.openURL(this.getIssueUrl(issue, event.settings));
          });    
        break;
      }
    }
  }

  /**
   * {@inheritDoc}
   */
  handleDidReceiveSettings(event: DidReceiveSettingsEvent<JQLQuerySettings>): void {
    this.setBadge({
      value: `${this.getPollingClient()?.getLastResponse()?.total ?? 0}`,
    }, event.settings);
    super.handleDidReceiveSettings(event);
  }

  /**
   * {@inheritDoc}
   */
  protected async getResponse(context: ActionPollingContext<JQLQuerySettings>): Promise<SearchResponse> {
    const {domain, email: username, token: password, strategy, jql} = context.settings;

    if (!domain || !jql) {
      return {
        issues: [],
        total: 0,
      };
    }

    let authenticator: Authenticator;
    if (strategy === 'PAT') {
      authenticator = new TokenAuth(password);
    } else {
      authenticator = new BasicAuth(username, password);
    }

    const client = new Client(`https://${domain}`, authenticator);

    const response = await client.request<SearchResponse>({
      endpoint: 'rest/api/latest/search',
      query: {
        jql: jql,
      },
    });

    return response.body;
  }

  /**
   * {@inheritDoc}
   */
  handleDidReceivePollingResponse(event: PollingResponseEvent<ActionPollingContext<JQLQuerySettings>, SearchResponse>): void {
    super.handleDidReceivePollingResponse(event);
    if (!event.didRecoverFromError && event.response.total === event.client.getLastResponse()?.total) {
      return;
    }

    this.setBadge({
      value: `${event.response.total ?? 0}`,
    }, event.context.settings);
  }

  /**
   * {@inheritDoc}
   */
  handleDidReceivePollingError(event: PollingErrorEvent<ActionPollingContext<JQLQuerySettings>, SearchResponse>): void {
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
  protected getPollingDelay(settings: JQLQuerySettings): number {
    return settings.pollingDelay ?? super.getPollingDelay(settings);
  }

  /**
   * Retrieves an issue URL for a provided issue.
   *
   * @param issue - The issue.
   * @param settings - The current action settings.
   * @returns The URL to the issue.
   */
  protected getIssueUrl(issue: Issue, settings: JQLQuerySettings): string {
    return `https://${settings.domain}/browse/${issue.key}`;
  }

  /**
   * Updates the badge shown for the current action.
   * 
   * @param badge - Options to use for applying a badge to the icon.
   * @param settings - The current action settings.
   */
  protected setBadge(badge: BadgeOptions, settings: JQLQuerySettings) {
    if (badge.value == "0" || !badge.value.length || settings.badgeType === BadgeType.Hidden) {
      this.setImage(settings.customImage);
      this.setTitle('');
      return;
    }

    if (settings.badgeType === BadgeType.UseTitle) {
      this.setImage(settings.customImage);
      this.setTitle(badge.value);
      return;
    }

    this.setTitle('');

    if (settings.badgeType === BadgeType.Indicator) {
      badge.value = ' ';
    }

    if (!badge.color) {
      badge.color = settings.badgeColor;
    }

    if (!badge.position) {
      badge.position = settings.badgePosition;
    }

    (new Icon())
      .addImage(settings.customImage ?? this.getDefaultImage(), 0, 0, 144, 144)
      .then((icon) => {
        icon.setBadge(badge);
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

}

const jira = new Query({
  name: 'JQL Result',
  hasMultiActionSupport: false,
  tooltip: 'Displays a badge with the number of issues matching a JQL query.',
  states: [{ image: "Jira" }],
  inspectorName: 'Query',
});

export default jira;
