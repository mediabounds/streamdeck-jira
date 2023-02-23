import { SendToPropertyInspectorEvent, Plugin } from "@fnando/streamdeck";
import { ActionPollingDebugInfo } from "./actions/PollingAction";
import DefaultPropertyInspector from "./inspector"
import { StatusComponent } from "./inspectors/Components";

/**
 * Base inspector for an action that periodically polls a target for information.
 */
export default abstract class PollingActionInspector<TSettings> extends DefaultPropertyInspector<TSettings> {
  protected readonly status = document.getElementById('status') as StatusComponent;

  /**
   * {@inheritdoc}
   */
  constructor(args: {plugin: Plugin<unknown, unknown>}) {
    super(args);
    this.status.onclick = () => {
      if (!this.status.value.success) {
        alert(this.status.value.statusMessage)
      }
    };
    this.status.onauxclick = () => {
      const info = this.status.value;
      if (!info.responseBody) {
        return;
      }

      this.openDebugModal(info);
    };
  }

  /**
   * {@inheritdoc}
   */
  handleSendToPropertyInspector(event: SendToPropertyInspectorEvent<unknown>): void {
    super.handleSendToPropertyInspector(event);

    if (Object.prototype.hasOwnProperty.call(event, 'statusMessage')) {
      const info = <ActionPollingDebugInfo><unknown>event;
      this.handleReceiveDebugInfo(info);
    }
  }

  /**
   * {@inheritdoc}
   */
  setSettings<T>(payload: T): void {
    super.setSettings(payload);
    this.status?.clear();
  }

  /**
   * Invoked when the action passed debug information.
   * 
   * Useful for helping the user determine a problem with their configuration.
   * 
   * @param info - Debug information was received from the action.
   */
  protected handleReceiveDebugInfo(info: ActionPollingDebugInfo) {
    if (!this.status) {
      return;
    }

    this.status.value = info;
  }

  /**
   * Display debug information in a modal window.
   * 
   * @param info - The debug info to show in the modal window.
   * @returns A reference to the modal window.
   */
  protected openDebugModal(info: ActionPollingDebugInfo): Window {
    const modal = window.open();
    modal.document.write(`<iframe src="${this.generateDataUri(info)}" frameborder="0" width="100%" height="100%"></iframe>`);
    return modal;
  }

  /**
   * Renders debug info as an HTML page and generates a data URI.
   * 
   * @param info - The debug info to render as an Web page.
   * @returns The generated data URI.
   */
  protected generateDataUri(info: ActionPollingDebugInfo): string {
    const customCss = (<HTMLLinkElement>document.head.children[1]).href;

    return TagBuilder.create('body')
      .setClasses(['debug-modal'])
      // Gets the custom CSS from the property inspector.
      .addChild(
        TagBuilder.create<HTMLLinkElement>('link')
          .setAttribute('rel', 'stylesheet')
          .setAttribute('type', 'text/css')
          .setAttribute('href', customCss)
      )
      // Collapsible header for response headers.
      .addChild(
        TagBuilder.create<HTMLDetailsElement>('details')
          .addChild(
            TagBuilder.create('summary').setValue('Headers')
          )
          .addChild(
            TagBuilder.create<HTMLTableElement>('table')
              .setClasses(['debug-headers'])
              .addChilden(Object.keys(info.responseHeaders ?? {}).map((header) => {
                return TagBuilder.create('tr')
                  .addChild(TagBuilder.create('th').setValue(header))
                  .addChild(TagBuilder.create('td').setValue(info.responseHeaders[header]))
              }))
          )
      )
      // Shows the response body.
      .addChild(TagBuilder.create('label').setValue('Body'))
      .addChild(TagBuilder.create('pre').setValue(info.responseBody))
      .toDataUri();
  }
}

/**
 * Convenience class for building an HTML document.
 */
class TagBuilder<T extends HTMLElement> {
  private readonly tag: T;

  /**
   * Creates a new tag builder.
   * 
   * @param doc - The parent document.
   * @param tag - The tag name.
   */
  constructor(doc: Document, tag: string) {
    this.tag = doc.createElement(tag) as T;
  }

  /**
   * Convenience creator for creating a new tag.
   * 
   * @param tag - The tag name.
   * @param doc - The parent document (defaults to the current document).
   * @returns A TagBuilder.
   */
  static create<T extends HTMLElement>(tag: string, doc: Document | null = null): TagBuilder<T> {
    doc = doc ?? document;
    return new TagBuilder<T>(doc, tag);
  }

  /**
   * Adds multiple children to the element.
   * 
   * @param children - The children to add to the element.
   * @returns The current TagBuilder (for chaining).
   */
  addChilden(children: Array<TagBuilder<HTMLElement>> | Array<Element>): this {
    children.forEach((child: Element | TagBuilder<HTMLElement>) => this.addChild(child));
    return this;
  }

  /**
   * Adds a single child to the element.
   * 
   * @param child - The child to add to the element.
   * @returns The current TagBuilder (for chaining).
   */
  addChild(child: TagBuilder<HTMLElement> | Element): this {
    if (child instanceof Element) {
      this.tag.append(child);
    }
    else {
      this.tag.append(child.get());
    }
    return this;
  }

  /**
   * Sets an ID on the element.
   * 
   * @param id - The ID to set on the element.
   * @returns The current TagBuilder (for chaining).
   */
  setId(id: string): this {
    this.tag.id = id;
    return this;
  }

  /**
   * Sets the classes on the element.
   * 
   * @param classes - An array of class names to add to the element.
   * @returns The current TagBuilder (for chaining).
   */
  setClasses(classes: [string]): this {
    this.tag.className = classes.join(' ');
    return this;
  }

  /**
   * Sets an attribute on the element tag.
   * 
   * @param name - The attribute name.
   * @param value - The attribute value.
   * @returns The current TagBuilder (for chaining).
   */
  setAttribute(name: string, value: string): this {
    this.tag.setAttribute(name, value);
    return this;
  }

  /**
   * Sets the value of the element.
   * 
   * Determines if the value should be set in the `value` attribute
   * or in the body of the tag.
   * 
   * @param value - The value to set.
   * @returns The current TagBuilder (for chaining).
   */
  setValue(value: string): this {
    if (this.tag instanceof HTMLInputElement
      || this.tag instanceof HTMLTextAreaElement) {
        this.tag.value = value;
      }

    this.tag.innerText = value;

    return this;
  }

  /**
   * Retrieves the element being built.
   * 
   * @returns The built element.
   */
  get(): T {
    return this.tag;
  }

  /**
   * Retrieves the HTML code for the current element.
   * 
   * @returns An HTML string of the current element.
   */
  toHtmlString(): string {
    return this.tag.outerHTML;
  }

  /**
   * Generates a data URI for the element.
   * 
   * Suitable for opening in a browser window.
   * 
   * @returns A data URI representing the current element.
   */
  toDataUri(): string {
    return `data:text/html,${encodeURI(this.toHtmlString())}`;
  }
}
