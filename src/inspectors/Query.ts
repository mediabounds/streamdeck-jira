import plugin from "../plugin";
import { BadgeType, JQLQueryKeyAction, JQLQuerySettings } from "../JiraPluginSettings";
import { BadgePosition } from "../Icon";
import PollingActionInspector from "../PollingActionInspector";
import { AuthenticationComponent, IconComponent } from "./Components";

/**
 * Property inspector for the Query action.
 */
class QueryActionPropertyInspector extends PollingActionInspector<JQLQuerySettings> {
  private authentication = document.getElementById('auth') as AuthenticationComponent;
  private icon = document.getElementById('icon') as IconComponent;
  private jql = document.getElementById('jql') as HTMLTextAreaElement;
  private keyAction = document.getElementById('key-action') as HTMLSelectElement;
  private keyActionLimit = document.getElementById('key-action-limit') as HTMLInputElement;
  private keyActionUrl = document.getElementById('key-action-url') as HTMLInputElement;

  /**
   * {@inheritDoc}
   */
  protected updateForm(): void {
    const settings = Object.assign({}, this.getDefaultSettings(), this.settings);

    // Base settings.
    this.jql.value = settings.jql;

    // Action settings.
    this.keyActionLimit.hidden = true;
    this.keyActionUrl.parentElement.hidden = true;
    if (typeof settings.keyAction === 'string') {
      this.keyAction.value = settings.keyAction;
    } else if ("limit" in settings.keyAction) {
      this.keyAction.value = 'ViewIssues';
      this.keyActionLimit.value = `${settings.keyAction.limit ?? 5}`;
      this.keyActionLimit.hidden = false;
    } else if ("url" in settings.keyAction) {
      this.keyAction.value = 'OpenUrl';
      this.keyActionUrl.value = settings.keyAction.url;
      this.keyActionUrl.parentElement.hidden = false;
      this.keyActionUrl.placeholder = this.getJiraUrl();
    }

    this.authentication.value = settings;
    this.icon.value = settings;
  }

  /**
   * {@inheritdoc}
   */
  protected handleFieldUpdated(event: Event): void {
    this.saveSettings();
  }

  /**
   * "Submits" the form in the property inspector and saves all values to settings.
   */
  protected saveSettings(): void {
    const settings: JQLQuerySettings = {
      jql: this.jql.value.trim(),
      keyAction: this.getKeyAction(),
      pollingDelay: 120,
      ...this.authentication.value,
      ...this.icon.value,
    };

    this.setSettings(settings);
    this.setGlobalSettings({
      domain: settings.domain,
      context: settings.context,
      email: settings.email,
      token: settings.token,
      strategy: settings.strategy,
    });
  }

  /**
   * {@inheritdoc}
   */
  protected getDefaultSettings(): JQLQuerySettings {
    return {
      domain: this.globalSettings.domain ?? '',
      context: this.globalSettings.context ?? '',
      email: this.globalSettings.email ?? '',
      token: this.globalSettings.token ?? '',
      strategy: this.globalSettings.strategy ?? 'APIToken',
      jql: '',
      keyAction: {
        limit: 5,
      },
      pollingDelay: 120,
      badgeType: BadgeType.Number,
      badgePosition: BadgePosition.TopRight,
    };
  }

  /**
   * Gets the currently configured key action from the form.
   * @returns The setting value to save for the key action.
   */
  private getKeyAction(): JQLQueryKeyAction {
    switch (this.keyAction.value) {
      case 'ViewFilter':
        return 'ViewFilter';
      case 'ViewIssues':
        return {
          limit: parseInt(this.keyActionLimit.value, 10) || 5,
        };
      case 'OpenUrl':
        return {
          url: this.keyActionUrl.value || this.getJiraUrl()
        };
      case 'Refresh':
        return 'Refresh';
    }
  }

  /**
   * Gets the URL to the Jira default page.
   * @returns The URL to Jira, or null if the Jira connection is not configured.
   */
  private getJiraUrl(): string|null {
    if (!this.settings.domain) {
      return null;
    }

    return `https://${this.settings.domain}`;
  }
}

const inspector = new QueryActionPropertyInspector({ plugin });
inspector.run();
