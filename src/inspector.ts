import { DidReceiveGlobalSettingsEvent, DidReceiveSettingsEvent, Inspector } from "@fnando/streamdeck";
import { DefaultPluginSettings } from "./JiraPluginSettings";

export default abstract class DefaultPropertyInspector<TSettings = DefaultPluginSettings> extends Inspector<TSettings, DefaultPluginSettings> {
  protected settings: TSettings;
  protected globalSettings: DefaultPluginSettings;

  handleDidConnectToSocket(): void {
    super.handleDidConnectToSocket();

    const fields = document.querySelectorAll('input, textarea, select, pi-authentication, pi-icon');
    fields.forEach(field => {
      field.addEventListener('change', (e) => this.handleFieldUpdated(e));
    });

    // Ensure links open in a browser window.
    document
      .querySelectorAll('a[target=_blank]')
      .forEach((el) => {
        el.addEventListener('click', (ev) => {
          this.openURL(el.getAttribute('href'));
          ev.preventDefault();
        });
      });
  }

  handleDidReceiveGlobalSettings(event: DidReceiveGlobalSettingsEvent<DefaultPluginSettings>): void {
    super.handleDidReceiveGlobalSettings(event);
    this.globalSettings = event.settings;
  }

  handleDidReceiveSettings(event: DidReceiveSettingsEvent<TSettings>): void {
    super.handleDidReceiveSettings(event);
    this.settings = event.settings;
    this.updateForm();
  }

  setSettings<T>(payload: T): void {
    super.setSettings(payload);
    this.settings = <TSettings><unknown>payload;
    this.updateForm();
  }

  setGlobalSettings(payload: DefaultPluginSettings): void {
    super.setGlobalSettings(payload);
    this.globalSettings = payload;
  }

  /**
   * Invoked when a field changes value.
   * @param event - The change event.
   */
  protected abstract handleFieldUpdated(event: Event): void;

  protected updateForm(): void {
    // Do nothing.
  }
}
