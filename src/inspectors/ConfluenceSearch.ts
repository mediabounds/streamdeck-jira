import plugin from "../plugin";
import { BadgeType, ConfluenceSearchSettings } from "../JiraPluginSettings";
import { BadgePosition } from "../Icon";
import PollingActionInspector from "../PollingActionInspector";
import { AuthenticationComponent, IconComponent } from "./Components";

/**
 * Property inspector for the Confluence search (CQL) action.
 */
class ConfluenceSearchActionPropertyInspector extends PollingActionInspector<ConfluenceSearchSettings> {
  private cql = document.getElementById('cql') as HTMLTextAreaElement;
  private authentication = document.getElementById('auth') as AuthenticationComponent;
  private icon = document.getElementById('icon') as IconComponent;

  /**
   * {@inheritDoc}
   */
  protected updateForm(): void {
    const settings = Object.assign({}, this.getDefaultSettings(), this.settings);

    this.cql.value = settings.cql;

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
    const settings: ConfluenceSearchSettings = {
      cql: this.cql.value,
      pollingDelay: 120,
      ...this.authentication.value,
      ...this.icon.value,
    };

    if (settings.strategy === 'APIToken' && !settings.context) {
      // On JIRA Cloud, all Confluence-related APIs use the `wiki` context path.
      settings.context = 'wiki';
    }

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
  protected getDefaultSettings(): ConfluenceSearchSettings {
    return {
      domain: this.globalSettings.domain ?? '',
      context: this.globalSettings.context ?? 'wiki',
      email: this.globalSettings.email ?? '',
      token: this.globalSettings.token ?? '',
      strategy: this.globalSettings.strategy ?? 'APIToken',
      cql: '',
      pollingDelay: 120,
      badgeType: BadgeType.Number,
      badgePosition: BadgePosition.TopRight,
    };
  }

}

const inspector = new ConfluenceSearchActionPropertyInspector({ plugin });
inspector.run();
