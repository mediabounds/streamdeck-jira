import { SendToPropertyInspectorEvent } from "@fnando/streamdeck";
import { ActionPollingDebugInfo } from "./actions/PollingAction";
import DefaultPropertyInspector from "./inspector"

/**
 * Base inspector for an action that periodically polls a target for information.
 */
export default abstract class PollingActionInspector<TSettings> extends DefaultPropertyInspector<TSettings> {
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
   * Invoked when the action passed debug information.
   * 
   * Useful for helping the user determine a problem with their configuration.
   * 
   * @param info - Debug information was received from the action.
   */
  protected abstract handleReceiveDebugInfo(info: ActionPollingDebugInfo): void;

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

class TagBuilder<T extends HTMLElement> {
  private readonly tag: T;

  constructor(doc: Document, tag: string) {
    this.tag = doc.createElement(tag) as T;
  }

  static create<T extends HTMLElement>(tag: string, doc: Document | null = null): TagBuilder<T> {
    doc = doc ?? document;
    return new TagBuilder<T>(doc, tag);
  }

  addChilden(children: Array<TagBuilder<HTMLElement>> | Array<Element>): this {
    children.forEach((child: Element | TagBuilder<HTMLElement>) => this.addChild(child));
    return this;
  }

  addChild(child: TagBuilder<HTMLElement> | Element): this {
    if (child instanceof Element) {
      this.tag.append(child);
    }
    else {
      this.tag.append(child.get());
    }
    return this;
  }

  setId(id: string): this {
    this.tag.id = id;
    return this;
  }

  setClasses(classes: [string]): this {
    this.tag.className = classes.join(' ');
    return this;
  }

  setAttribute(name: string, value: string): this {
    this.tag.setAttribute(name, value);
    return this;
  }

  setValue(value: string): this {
    if (this.tag instanceof HTMLInputElement
      || this.tag instanceof HTMLTextAreaElement) {
        this.tag.value = value;
      }

    this.tag.innerText = value;

    return this;
  }

  get(): T {
    return this.tag;
  }

  toHtmlString(): string {
    return this.tag.outerHTML;
  }

  toDataUri(): string {
    return `data:text/html,${encodeURI(this.toHtmlString())}`;
  }
}
