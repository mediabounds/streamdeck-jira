import Icon, { BadgePosition } from "../Icon";
import { BadgeType, DefaultPluginSettings, IconSettings } from "../JiraPluginSettings";

export abstract class PropertyInspectorComponent<T> extends HTMLElement {
  abstract get template(): string;
  abstract get value(): T;
  abstract set value(newValue: T);

  connectedCallback() {
    this.loadTemplate()
      .then(()=> this.onTemplateLoaded())
      .catch(console.error);
  }

  protected onTemplateLoaded() {
    const fields = this.querySelectorAll('input, textarea, select');
    fields.forEach(field => {
      field.addEventListener('change', (e) => this.handleFieldUpdated(e));
    });
  }

  protected handleFieldUpdated(event?: Event): void {
    this.dispatchEvent(new Event('change'))
  }

  protected async loadTemplate() {
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

export class AuthenticationComponent extends PropertyInspectorComponent<DefaultPluginSettings> {
  private domain: HTMLInputElement;
  private email: HTMLInputElement;
  private token: HTMLInputElement;
  private tokenType: HTMLSelectElement;

  get template(): string {
    return 'authentication.component.html';
  }

  get value(): DefaultPluginSettings {
    return {
      domain: this.domain.value,
      email: this.email.value,
      token: this.token.value,
      strategy: <'APIToken'|'PAT'>this.tokenType.value,
    };
  }

  set value(newValue: DefaultPluginSettings) {
    this.domain.value = newValue.domain;
    this.email.value = newValue.email;
    this.token.value = newValue.token;
    this.tokenType.value = newValue.strategy;
    this.onValueChanged();
  }
  
  protected onTemplateLoaded(): void {
    super.onTemplateLoaded();
    this.domain = this.querySelector('#domain');
    this.email = this.querySelector('#email');
    this.token = this.querySelector('#token');
    this.tokenType = this.querySelector('#token-type');
  }

  protected handleFieldUpdated(event?: Event): void {
    super.handleFieldUpdated(event);
    this.onValueChanged();
  }

  private onValueChanged(): void {
    this.querySelectorAll('[x-token-type]').forEach(el => (<HTMLElement>el).hidden = el.getAttribute('x-token-type') != this.tokenType.value);
  }
}

export class IconComponent extends PropertyInspectorComponent<IconSettings> {
  private customImagePreview: HTMLImageElement;
  private customImageInput: HTMLInputElement;
  private badgeType: HTMLSelectElement;
  private badgePosition: HTMLSelectElement;
  private badgeColor: HTMLInputElement;
  private customImageData?: string;

  get template(): string {
    return 'icon.component.html'
  }

  get value(): IconSettings {
    return {
      badgeType: <BadgeType>this.badgeType.value ?? BadgeType.Number,
      customImage: this.customImageData,
      badgePosition: <BadgePosition>this.badgePosition.value ?? BadgePosition.TopRight,
      badgeColor: this.badgeColor.value ?? 'red',
    };
  }

  set value(newValue: IconSettings) {
    this.badgeType.value = newValue.badgeType;
    this.customImageData = newValue.customImage;
    this.badgePosition.value = newValue.badgePosition;
    this.badgeColor.value = newValue.badgeColor ?? '#FF0000';
    this.onValueChanged();
  }

  protected onTemplateLoaded(): void {
    super.onTemplateLoaded();

    this.customImagePreview = this.querySelector('#custom-image');
    this.customImageInput = this.querySelector('#custom-image-input');
    this.badgeType = this.querySelector('#badge-type');
    this.badgePosition = this.querySelector('#badge-position');
    this.badgeColor = this.querySelector('#badge-color');

    this.customImagePreview.addEventListener('click', () => this.removeCustomImage());
  }

  protected handleFieldUpdated(event?: Event): void {
    if (event?.currentTarget == this.customImageInput) {
      this.uploadCustomImage();
    }
    else {
      super.handleFieldUpdated(event);
    }
    this.onValueChanged();
  }

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
    this.handleFieldUpdated();
  }

}

customElements.define('pi-authentication', AuthenticationComponent);
customElements.define('pi-icon', IconComponent);
