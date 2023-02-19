import plugin from "../plugin";
import { BadgeType, ConfluenceTasksSettings } from "../JiraPluginSettings";
import { BadgePosition } from "../Icon";
import PollingActionInspector from "../PollingActionInspector";
import { AuthenticationComponent, IconComponent } from "./Components";

/**
 * Property inspector for querying inline Confluence tasks.
 */
class ConfluenceTasksActionPropertyInspector extends PollingActionInspector<ConfluenceTasksSettings> {
  private authentication = document.getElementById('auth') as AuthenticationComponent;
  private icon = document.getElementById('icon') as IconComponent;
  private fromDate = document.getElementById('from-date') as HTMLInputElement;
  private toDate = document.getElementById('to-date') as HTMLInputElement;

  /**
   * {@inheritDoc}
   */
  protected updateForm(): void {
    const settings = Object.assign({}, this.getDefaultSettings(), this.settings);

    this.fromDate.value = this.formatDate(settings.dueDateFrom);
    this.toDate.value = this.formatDate(settings.dueDateTo);

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
    const settings: ConfluenceTasksSettings = {
      dueDateFrom: this.formatDate(this.fromDate.value),
      dueDateTo: this.formatDate(this.toDate.value),
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
  protected getDefaultSettings(): ConfluenceTasksSettings {
    return {
      domain: this.globalSettings.domain ?? '',
      email: this.globalSettings.email ?? '',
      token: this.globalSettings.token ?? '',
      strategy: this.globalSettings.strategy ?? 'APIToken',
      pollingDelay: 120,
      badgeType: BadgeType.Number,
      badgePosition: BadgePosition.TopRight,
    };
  }

  /**
   * Formats a string/date as yyyy-mm-dd.
   * 
   * @param date - Either a date object or a string representing a date.
   * @returns A date formatted as yyyy-mm-dd.
   */
  private formatDate(date?: string|Date): string|null {
    if (!date) {
      return null;
    }

    if (!(date instanceof Date)) {
      date = new Date(date);
    }

    return date.toISOString().split('T')[0];
  }

}

const inspector = new ConfluenceTasksActionPropertyInspector({ plugin });
inspector.run();
