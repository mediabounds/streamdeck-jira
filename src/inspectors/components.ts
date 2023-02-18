export class Partial extends HTMLElement {
  static get observedAttributes() {
    return ['src'];
  }

  constructor() {
    super();
  }

  public attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === 'src') {
      const xhr = new XMLHttpRequest();
      xhr.onload = (e) => {
        if (xhr.readyState === 4) {
          this.innerHTML = xhr.responseText;
        }
      };
      xhr.onerror = (e) => {
        console.error(e);
      };
      xhr.open('GET', newValue, true);
      xhr.send();
    }
  }
}

customElements.define('html-partial', Partial);
