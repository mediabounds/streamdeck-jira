import { ActionPollingDebugInfo } from "../actions/PollingAction";
import Icon, { BadgePosition } from "../Icon";
import { BadgeType, DefaultPluginSettings, IconSettings } from "../JiraPluginSettings";

/**
 * Base class for reusable components in the Property Inspector.
 */
export abstract class PropertyInspectorComponent<T> extends HTMLElement {
  /**
   * The file name of the template.
   */
  abstract get template(): string;
  /**
   * The structured value of the information in this component.
   */
  abstract get value(): T;
  /**
   * Sets a new value for the component.
   * 
   * Updates the corresponding form fields.
   */
  abstract set value(newValue: T);

  /**
   * Invoked when the element has been added to the document.
   */
  connectedCallback() {
    this.loadTemplate()
      .then(()=> this.onTemplateLoaded())
      .catch(console.error);
  }

  /**
   * Invoked after the template has been loaded and appended to the document.
   */
  protected onTemplateLoaded() {
    const fields = this.querySelectorAll('input, textarea, select');
    fields.forEach(field => {
      field.addEventListener('change', (e) => this.onFieldUpdated(e));
    });
  }

  /**
   * Invoked when a field within the component changes.
   * @param event - The change event.
   */
  protected onFieldUpdated(event?: Event): void {
    this.dispatchEvent(new Event('change'))
  }

  /**
   * Loads the template specified in `template` and appends to the document.
   * 
   * @returns A promise that resolves when the template finishes loading.
   */
  protected async loadTemplate(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = (e) => {
        if (xhr.readyState === 4) {
          this.innerHTML = xhr.responseText;
          resolve();
        }
      };
      xhr.onerror = (e) => {
        reject(e);
      };
      xhr.open('GET', this.template, true);
      xhr.send();
    });
  }
}

/**
 * Subform for providing authentication credentials for Jira.
 */
export class AuthenticationComponent extends PropertyInspectorComponent<DefaultPluginSettings> {
  private domain: HTMLInputElement;
  private email: HTMLInputElement;
  private token: HTMLInputElement;
  private tokenType: HTMLSelectElement;
  private contextPath: HTMLInputElement;

  /**
   * {@inheritDoc}
   */
  get template(): string {
    return 'authentication.component.html';
  }

  /**
   * {@inheritDoc}
   */
  get value(): DefaultPluginSettings {
    if (this.tokenType.value !== 'PAT') {
      this.contextPath.value = '';
    }

    return {
      domain: this.domain.value
        .replace(/^https?:\/\//, '')
        .replace(/\/.*$/, '')
        .trim(),
      context: this.contextPath.value
        // Remove leading and trailing slashes
        .replace(/^\/+|\/+$/g, '')
        .trim(),
      email: this.email.value.trim(),
      token: this.token.value.trim(),
      strategy: <'APIToken'|'PAT'>this.tokenType.value,
    };
  }

  /**
   * {@inheritDoc}
   */
  set value(newValue: DefaultPluginSettings) {
    this.domain.value = newValue.domain;
    this.contextPath.value = newValue.context;
    this.email.value = newValue.email;
    this.token.value = newValue.token;
    this.tokenType.value = newValue.strategy;
    this.onValueChanged();
  }
  
  /**
   * {@inheritDoc}
   */
  protected onTemplateLoaded(): void {
    super.onTemplateLoaded();
    this.domain = this.querySelector('#domain');
    this.email = this.querySelector('#email');
    this.token = this.querySelector('#token');
    this.tokenType = this.querySelector('#token-type');
    this.contextPath = this.querySelector('#context-path');
  }

  /**
   * {@inheritDoc}
   */
  protected onFieldUpdated(event?: Event): void {
    super.onFieldUpdated(event);
    this.onValueChanged();
  }

  /**
   * Invoked when the value changes.
   * Handles updates to the form.
   */
  private onValueChanged(): void {
    this.querySelectorAll('[x-token-type]').forEach(el => (<HTMLElement>el).hidden = el.getAttribute('x-token-type') != this.tokenType.value);
  }
}

/**
 * Subform for customizing the action icon.
 */
export class IconComponent extends PropertyInspectorComponent<IconSettings> {
  private customImagePreview: HTMLImageElement;
  private customImageInput: HTMLInputElement;
  private badgeType: HTMLSelectElement;
  private badgePosition: HTMLSelectElement;
  private badgeColor: HTMLInputElement;
  private customImageData?: string;

  /**
   * {@inheritDoc}
   */
  get template(): string {
    return 'icon.component.html'
  }

  /**
   * {@inheritDoc}
   */
  get value(): IconSettings {
    return {
      badgeType: <BadgeType>this.badgeType.value ?? BadgeType.Number,
      customImage: this.customImageData,
      badgePosition: <BadgePosition>this.badgePosition.value ?? BadgePosition.TopRight,
      badgeColor: this.badgeColor.value ?? 'red',
    };
  }

  /**
   * {@inheritDoc}
   */
  set value(newValue: IconSettings) {
    this.badgeType.value = newValue.badgeType;
    this.customImageData = newValue.customImage;
    this.badgePosition.value = newValue.badgePosition;
    this.badgeColor.value = newValue.badgeColor ?? '#FF0000';
    this.onValueChanged();
  }

  /**
   * {@inheritDoc}
   */
  protected onTemplateLoaded(): void {
    super.onTemplateLoaded();

    this.customImagePreview = this.querySelector('#custom-image');
    this.customImageInput = this.querySelector('#custom-image-input');
    this.badgeType = this.querySelector('#badge-type');
    this.badgePosition = this.querySelector('#badge-position');
    this.badgeColor = this.querySelector('#badge-color');

    this.customImagePreview.addEventListener('click', () => this.removeCustomImage());
  }

  /**
   * {@inheritDoc}
   */
  protected onFieldUpdated(event?: Event): void {
    if (event?.currentTarget == this.customImageInput) {
      this.uploadCustomImage();
    }
    else {
      super.onFieldUpdated(event);
    }
    this.onValueChanged();
  }

  /**
   * Invoked when the value changes.
   * Handles updates to the form.
   */
  private onValueChanged(): void {
    this.customImagePreview.src = this.customImageData ?? '';

    if (this.customImageData) {
      this.customImagePreview.hidden = false;
      this.customImagePreview.parentElement.classList.add('preview-visible');
    }
    else {
      this.customImagePreview.hidden = true;
      this.customImagePreview.parentElement.classList.remove('preview-visible');
    }

    this.badgePosition.parentElement.hidden = this.badgeColor.parentElement.hidden = this.value.badgeType == BadgeType.Hidden || this.value.badgeType == BadgeType.UseTitle;
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
    this.customImageData = data;
    this.onFieldUpdated();
  }

}

/**
 * Component for displaying the current status (i.e. success/warning).
 */
export class StatusComponent extends PropertyInspectorComponent<ActionPollingDebugInfo> {
  private currentStatus?: ActionPollingDebugInfo;
  private status = document.getElementById('status-display');

  /**
   * {@inheritDoc}
   */
  get template(): string {
    return 'status.component.html';
  }

  /**
   * {@inheritDoc}
   */
  get value(): ActionPollingDebugInfo {
    return this.currentStatus;
  }

  /**
   * {@inheritDoc}
   */
  set value(newValue: ActionPollingDebugInfo) {
    this.currentStatus = newValue;

    this.status.title = newValue.statusMessage;

    if (newValue.success) {
      this.status.innerHTML = '<span class="success">✓</span> Success';
      return;
    }

    this.status.innerHTML = '<span class="warning">⚠️</span> Something is not right';
  }

  /**
   * Clears the status display.
   */
  public clear(): void {
    this.status.innerText = '';
  }

  /**
   * {@inheritDoc}
   */
  protected onTemplateLoaded(): void {
    super.onTemplateLoaded();
    this.status = this.querySelector('#status-display');
  }
}

customElements.define('pi-authentication', AuthenticationComponent);
customElements.define('pi-icon', IconComponent);
customElements.define('pi-status', StatusComponent);
