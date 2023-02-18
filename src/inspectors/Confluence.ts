import plugin from "../plugin";
import { BadgeType, ConfluenceTasksSettings } from "../JiraPluginSettings";
import { BadgePosition } from "../Icon";
import PollingActionInspector from "../PollingActionInspector";
import { AuthenticationComponent, IconComponent } from "./Components";

class ConfluenceActionPropertyInspector extends PollingActionInspector<ConfluenceTasksSettings> {
  private authentication = document.getElementById('auth') as AuthenticationComponent;
  private icon = document.getElementById('icon') as IconComponent;

  /**
   * {@inheritDoc}
   */
  protected updateForm(): void {
    const settings = Object.assign({}, this.getDefaultSettings(), this.settings);

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
      domain: this.authentication.value.domain,
      email: this.authentication.value.email,
      token: this.authentication.value.token,
      strategy: this.authentication.value.strategy,
      pollingDelay: this.settings.pollingDelay,
      badgeType: this.icon.value.badgeType,
      customImage: this.icon.value.customImage,
      badgePosition: this.icon.value.badgePosition,
      badgeColor: this.icon.value.badgeColor,
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
   * Retrieves the default settings for a Query action.
   * @returns The default settings for a Query action.
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

}

const inspector = new ConfluenceActionPropertyInspector({ plugin });
inspector.run();
