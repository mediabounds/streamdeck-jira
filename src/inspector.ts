import { DidReceiveSettingsEvent, Inspector } from "@fnando/streamdeck";
import plugin from "./plugin";
import { JQLQueryKeyAction, JQLQuerySettings } from "./JiraPluginSettings";


class DefaultPropertyInspector extends Inspector<JQLQuerySettings> {
  private domain = document.getElementById('domain') as HTMLInputElement;
  private email = document.getElementById('email') as HTMLInputElement;
  private token = document.getElementById('token') as HTMLInputElement;
  private jql = document.getElementById('jql') as HTMLTextAreaElement;
  private keyAction = document.getElementById('key-action') as HTMLSelectElement;
  private keyActionLimit = document.getElementById('key-action-limit') as HTMLInputElement;
  private badgePosition = document.getElementById('badge-position') as HTMLSelectElement;
  private badgeColor = document.getElementById('badge-color') as HTMLInputElement;

  handleDidConnectToSocket(): void {
    const fields = document.querySelectorAll('input, textarea, select');
    fields.forEach(field => {
      field.addEventListener('change', () => this.saveSettings());
    });
  }

  saveSettings(): void {
    let action: JQLQueryKeyAction;
    switch (this.keyAction.value) {
      case 'ViewFilter':
        action = 'ViewFilter';
        break;
      case 'ViewIssues':
        action = {
          limit: parseInt(this.keyActionLimit.value, 10) ?? 5,
        };
        break;
      case 'Refresh':
        action = 'Refresh';
        break;
    }

    this.keyActionLimit.hidden = typeof action === 'string';

    this.setSettings({
      domain: this.domain.value
        .replace(/^https?:\/\//, '')
        .replace(/\/.*$/, '')
        .trim(),
      email: this.email.value.trim(),
      token: this.token.value.trim(),
      jql: this.jql.value.trim(),
      keyAction: action,
      pollingDelay: 120,
      badgePosition: this.badgePosition.value ?? 'topright',
      badgeColor: this.badgeColor.value ?? 'red',
    });
  }

  handleDidReceiveSettings(event: DidReceiveSettingsEvent<JQLQuerySettings>): void {
    this.domain.value = event.settings.domain ?? '';
    this.email.value = event.settings.email ?? '';
    this.token.value = event.settings.token ?? '';
    this.jql.value = event.settings.jql ?? '';
    this.badgePosition.value = event.settings.badgePosition ?? 'topright';
    this.badgeColor.value = event.settings.badgeColor ?? '#FF0000';

    this.keyActionLimit.hidden = true;
    if (typeof event.settings.keyAction === 'string') {
      this.keyAction.value = event.settings.keyAction;
    } else if (typeof event.settings.keyAction !== 'undefined') {
      this.keyAction.value = 'ViewIssues';
      this.keyActionLimit.value = `${event.settings.keyAction.limit ?? 5}`;
      this.keyActionLimit.hidden = false;
    }
  }
}

const inspector = new DefaultPropertyInspector({ plugin });
inspector.run();
