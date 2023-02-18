import { DefaultPluginSettings } from "../JiraPluginSettings";

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

  protected handleFieldUpdated(event: Event): void {
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
  }
  
  protected onTemplateLoaded(): void {
    super.onTemplateLoaded();
    this.domain = this.querySelector('#domain');
    this.email = this.querySelector('#email');
    this.token = this.querySelector('#token');
    this.tokenType = this.querySelector('#token-type');
  }

  protected handleFieldUpdated(event: Event): void {
    super.handleFieldUpdated(event);
    this.querySelectorAll('[x-token-type]').forEach(el => (<HTMLElement>el).hidden = el.getAttribute('x-token-type') != this.tokenType.value);
  }
}

customElements.define('pi-authentication', AuthenticationComponent);
