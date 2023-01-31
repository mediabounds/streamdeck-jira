import plugin from "../plugin";
import { BadgeType, JQLQueryKeyAction, JQLQuerySettings } from "../JiraPluginSettings";
import Icon, { BadgePosition } from "../Icon";
import PollingActionInspector from "../PollingActionInspector";
import { ActionPollingDebugInfo } from "../actions/PollingAction";

/**
 * Property inspector for the Query action.
 */
class QueryActionPropertyInspector extends PollingActionInspector<JQLQuerySettings> {
  private domain = document.getElementById('domain') as HTMLInputElement;
  private email = document.getElementById('email') as HTMLInputElement;
  private token = document.getElementById('token') as HTMLInputElement;
  private tokenType = document.getElementById('token-type') as HTMLSelectElement;
  private jql = document.getElementById('jql') as HTMLTextAreaElement;
  private status = document.getElementById('status-display');
  private keyAction = document.getElementById('key-action') as HTMLSelectElement;
  private keyActionLimit = document.getElementById('key-action-limit') as HTMLInputElement;
  private customImagePreview = document.getElementById('custom-image') as HTMLImageElement;
  private customImageInput = document.getElementById('custom-image-input') as HTMLInputElement;
  private badgeType = document.getElementById('badge-type') as HTMLSelectElement;
  private badgePosition = document.getElementById('badge-position') as HTMLSelectElement;
  private badgeColor = document.getElementById('badge-color') as HTMLInputElement;

  /**
   * {@inheritDoc}
   */
  handleDidConnectToSocket(): void {
    super.handleDidConnectToSocket();
    const fields = document.querySelectorAll('input, textarea, select');
    fields.forEach(field => {
      field.addEventListener('change', (e) => this.handleFieldUpdated(e));
    });
    this.customImagePreview.addEventListener('click', () => this.removeCustomImage());
  }

  /**
   * {@inheritDoc}
   */
  protected updateForm(): void {
    const settings = Object.assign({}, this.getDefaultSettings(), this.settings);

    // Base settings.
    this.domain.value = settings.domain;
    this.email.value = settings.email;
    this.token.value = settings.token;
    this.jql.value = settings.jql;
    this.tokenType.value = settings.strategy;

    // Action settings.
    this.keyActionLimit.hidden = true;
    if (typeof settings.keyAction === 'string') {
      this.keyAction.value = settings.keyAction;
    } else if (typeof settings.keyAction !== 'undefined') {
      this.keyAction.value = 'ViewIssues';
      this.keyActionLimit.value = `${settings.keyAction.limit ?? 5}`;
      this.keyActionLimit.hidden = false;
    }

    // Icon settings.
    this.badgeType.value = settings.badgeType;
    this.customImagePreview.src = settings.customImage ?? '';
    
    if (settings.customImage) {
      this.customImagePreview.hidden = false;
      this.customImagePreview.parentElement.classList.add('preview-visible');
    }
    else {
      this.customImagePreview.hidden = true;
      this.customImagePreview.parentElement.classList.remove('preview-visible');
    }
    
    this.badgePosition.value = settings.badgePosition;
    this.badgeColor.value = settings.badgeColor ?? '#FF0000';
    this.badgePosition.parentElement.hidden = this.badgeColor.parentElement.hidden = settings.badgeType == BadgeType.Hidden || settings.badgeType == BadgeType.UseTitle;
  }

  /**
   * {@inheritdoc}
   */
  protected handleReceiveDebugInfo(info: ActionPollingDebugInfo): void {
    this.status.title = info.statusMessage;
    this.status.onclick = () => alert(info.statusMessage);
    this.status.onauxclick = () => {
      if (!info.responseBody) {
        return;
      }

      this.openDebugModal(info);
    };

    if (info.success) {
      this.status.innerHTML = '<span class="success">✓</span> Success';
      return;
    }

    this.status.innerHTML = '<span class="warning">⚠️</span> Something is not right';
  }

  /**
   * Invoked when a field changes value.
   * @param event - The change event.
   */
  protected handleFieldUpdated(event: Event): void {
    if (event.currentTarget == this.customImageInput) {
      this.uploadCustomImage();
    }
    else {
      this.saveSettings();
    }
  }

  /**
   * "Submits" the form in the property inspector and saves all values to settings.
   */
  protected saveSettings(): void {
    const settings: JQLQuerySettings = {
      domain: this.domain.value
        .replace(/^https?:\/\//, '')
        .replace(/\/.*$/, '')
        .trim(),
      email: this.email.value.trim(),
      token: this.token.value.trim(),
      strategy: <'APIToken'|'PAT'>this.tokenType.value,
      jql: this.jql.value.trim(),
      keyAction: this.getKeyAction(),
      pollingDelay: this.settings.pollingDelay,
      badgeType: <BadgeType>this.badgeType.value ?? BadgeType.Number,
      customImage: this.settings.customImage,
      badgePosition: <BadgePosition>this.badgePosition.value ?? BadgePosition.TopRight,
      badgeColor: this.badgeColor.value ?? 'red',
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
   * Gets the custom image from the file chooser and applies it as the custom image.
   */
  private uploadCustomImage(): void {
    const files = this.customImageInput.files;

    if (!files.length) {
      return;
    }

    Icon
      .fromLocalFile(files[0])
      .then(icon => {
        this.setCustomImage(icon.getImage());
      })
      .catch(console.error);
    
    this.customImageInput.value = '';
  }

  /**
   * Removes the custom image.
   */
  private removeCustomImage(): void {
    this.setCustomImage(null);
  }

  /**
   * Updates the action's custom image.
   * @param data - Base-64 encoded image data.
   */
  private setCustomImage(data?: string) {
    this.settings.customImage = data;
    this.setSettings(this.settings);
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
