import plugin from "../plugin";
import { BadgeType, OpsAlertsKeyAction, OpsAlertsSettings } from "../JiraPluginSettings";
import { BadgePosition } from "../Icon";
import PollingActionInspector from "../PollingActionInspector";
import { AuthenticationComponent, IconComponent } from "./Components";

/**
 * Property inspector for the JSM Ops Alerts action.
 */
class OpsAlertsActionPropertyInspector extends PollingActionInspector<OpsAlertsSettings> {
  private query = document.getElementById('query') as HTMLTextAreaElement;
  private keyAction = document.getElementById('key-action') as HTMLSelectElement;
  private authentication = document.getElementById('auth') as AuthenticationComponent;
  private icon = document.getElementById('icon') as IconComponent;

  /**
   * {@inheritdoc}
   */
  handleDidConnectToSocket(): void {
    super.handleDidConnectToSocket();

    // This action is only supported by JIRA Cloud.
    const tokenTypeField: HTMLInputElement = this.authentication.querySelector('#token-type');
    tokenTypeField.disabled = true;
    tokenTypeField.after("This action only supports JIRA Cloud.");
  }

  /**
   * {@inheritDoc}
   */
  protected updateForm(): void {
    const settings = Object.assign({}, this.getDefaultSettings(), this.settings);

    this.query.value = settings.query;
    this.keyAction.value = settings.keyAction;

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
    const settings: OpsAlertsSettings = {
      query: this.query.value,
      keyAction: this.keyAction.value as OpsAlertsKeyAction,
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
  protected getDefaultSettings(): OpsAlertsSettings {
    return {
      domain: this.globalSettings.domain ?? '',
      context: '',
      email: this.globalSettings.email ?? '',
      token: this.globalSettings.token ?? '',
      strategy: 'APIToken',
      query: 'status: open',
      keyAction: 'View',
      pollingDelay: 60,
      badgeType: BadgeType.Number,
      badgePosition: BadgePosition.TopRight,
    };
  }

}

const inspector = new OpsAlertsActionPropertyInspector({ plugin });
inspector.run();
