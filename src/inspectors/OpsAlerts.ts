import plugin from "../plugin";
import { BadgeType, OpsAlertsDateFilter, OpsAlertsKeyAction, OpsAlertsSettings } from "../JiraPluginSettings";
import { BadgePosition } from "../Icon";
import PollingActionInspector from "../PollingActionInspector";
import { AuthenticationComponent, IconComponent } from "./Components";

/**
 * Property inspector for the JSM Ops Alerts action.
 */
class OpsAlertsActionPropertyInspector extends PollingActionInspector<OpsAlertsSettings> {
  private query = document.getElementById('query') as HTMLTextAreaElement;
  private dateFilterBefore = document.getElementById('date-filter-before') as HTMLSelectElement;
  private dateFilterAfter = document.getElementById('date-filter-after') as HTMLSelectElement;
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
    this.setDateFilter(this.dateFilterAfter, settings.after);
    this.setDateFilter(this.dateFilterBefore, settings.before);
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
      after: this.getDateFilter(this.dateFilterAfter),
      before: this.getDateFilter(this.dateFilterBefore),
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

  /**
   * Updates the UI to reflect a date filter value.
   * 
   * @param element - The select element representing the date filter.
   * @param value - The filter value to set.
   */
  private setDateFilter(element: HTMLSelectElement, value: OpsAlertsDateFilter) {
    const relativeField: HTMLInputElement = element.parentNode.querySelector('input[type=number]');
    const relativeFieldSuffix = relativeField.nextElementSibling as HTMLElement;
    const absoluteField: HTMLInputElement = element.parentNode.querySelector('input[type=date]');

    if (!value) {
      element.value = 'All';
      relativeField.hidden = relativeFieldSuffix.hidden = true;
      absoluteField.hidden = true;
    } else if (typeof value === 'string') {
      element.value = value;
      relativeField.hidden = relativeFieldSuffix.hidden = true;
      absoluteField.hidden = true;
    }
    else if ('value' in value) {
      element.value = 'Relative';
      relativeField.hidden = relativeFieldSuffix.hidden = false;
      absoluteField.hidden = true;
      relativeField.value = value.value == null ? '' : value.value?.toString();
    }
    else if ('date' in value) {
      element.value = 'Absolute';
      relativeField.hidden = relativeFieldSuffix.hidden = true;
      absoluteField.hidden = false;
      absoluteField.value = value.date;
    }
  }

  /**
   * Gets the current date filter value for a select element.
   *
   * @param element - The select element representing the date filter.
   * @returns The current filter value.
   */
  private getDateFilter(element: HTMLSelectElement): OpsAlertsDateFilter {
    switch (element.value) {
      case 'Relative': {
        const valueInput: HTMLInputElement = element.parentNode.querySelector('input[type=number]');

        return {
          value: parseInt(valueInput.value) || null,
        };
      }
      case 'Absolute': {
        const dateInput: HTMLInputElement = element.parentNode.querySelector('input[type=date]');

        return {
          date: dateInput.value,
        };
      }
      default:
        return 'All';
    }
  }

}

const inspector = new OpsAlertsActionPropertyInspector({ plugin });
inspector.run();
