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

  /**
   * {@inheritDoc}
   */
  protected updateForm(): void {
    const settings = Object.assign({}, this.getDefaultSettings(), this.settings);

    // Base settings.
    this.jql.value = settings.jql;

    // Action settings.
    this.keyActionLimit.hidden = true;
    if (typeof settings.keyAction === 'string') {
      this.keyAction.value = settings.keyAction;
    } else if (typeof settings.keyAction !== 'undefined') {
      this.keyAction.value = 'ViewIssues';
      this.keyActionLimit.value = `${settings.keyAction.limit ?? 5}`;
      this.keyActionLimit.hidden = false;
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
          limit: parseInt(this.keyActionLimit.value, 10) ?? 5,
        };
      case 'Refresh':
        return 'Refresh';
    }
  }
}

const inspector = new QueryActionPropertyInspector({ plugin });
inspector.run();
