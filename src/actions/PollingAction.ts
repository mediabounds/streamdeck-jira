import { Action, DidReceiveSettingsEvent, PropertyInspectorDidAppearEvent, WillAppearEvent, WillDisappearEvent } from "@fnando/streamdeck";
import { RequestError } from "../Client";
import { PollingClient, PollingClientDelegate, PollingErrorEvent, PollingResponseEvent } from "../PollingClient";

/**
 * Context for an individual instance of an action.
 */
export interface ActionPollingContext<SettingsType> {
  instance: string;
  device: string;
  settings: SettingsType;
}

/**
 * Information passed to the property inspector about the status of the last request.
 */
export interface ActionPollingDebugInfo {
  success: boolean;
  statusMessage: string;
  responseHeaders?: {[key: string]: string};
  responseBody?: string;
}

/**
 * Base class for an action that needs to periodically poll another source for status updates.
 */
export default abstract class PollingAction<ResponseType, SettingsType = unknown> extends Action<SettingsType> implements PollingClientDelegate<ActionPollingContext<SettingsType>, ResponseType> {
  /**
   * Active polling clients.
   * 
   * These are typically associated with an action that is currently visible on the canvas.
   */
  protected readonly clients: Record<string, PollingClient<ActionPollingContext<SettingsType>, ResponseType>> = {};

  /**
   * {@inheritDoc}
   */
  handleWillAppear(event: WillAppearEvent<SettingsType>): void {
    super.handleWillAppear(event);
    const context: ActionPollingContext<SettingsType> = {
      instance: this.context,
      device: this.device,
      settings: event.settings
    };

    const poller = new PollingClient((context) => this.getResponse(context), context, this);
    poller.startPolling(this.getPollingDelay(event.settings) * 1000);
    this.clients[this.getClientKey()] = poller;
  }

  /**
   * {@inheritDoc}
   */
  handleWillDisappear(event: WillDisappearEvent<SettingsType>): void {
    super.handleWillDisappear(event);
    this.getPollingClient()?.stopPolling();
    delete this.clients[this.getClientKey()];
  }

  /**
   * {@inheritDoc}
   */
  handlePropertyInspectorDidAppear(event: PropertyInspectorDidAppearEvent<unknown>): void {
    super.handlePropertyInspectorDidAppear(event);
    this.getPollingClient()?.poll();
  }

  /**
   * {@inheritDoc}
   */
  handleDidReceiveSettings(event: DidReceiveSettingsEvent<SettingsType>): void {
    super.handleDidReceiveSettings(event);
    const context = this.getPollingClient()?.getContext();
    if (!context) {
      return;
    }

    context.settings = event.settings;
    this.getPollingClient().setContext(context);
    this.getPollingClient().poll();
  }

  /**
   * {@inheritDoc}
   */
  handleDidReceivePollingResponse(event: PollingResponseEvent<ActionPollingContext<SettingsType>, ResponseType>): void {
    this.context = event.context.instance;
    this.device = event.context.device;
    this.debug('Received updated response:', event.response);

    const info: ActionPollingDebugInfo = {
      success: true,
      statusMessage: 'Success',
    };

    this.sendToPropertyInspector(info);
  }

  /**
   * {@inheritDoc}
   */
  handleDidReceivePollingError(event: PollingErrorEvent<ActionPollingContext<SettingsType>, ResponseType>): void {
    this.context = event.context.instance;
    this.device = event.context.device;
    this.logMessage(`[${this.constructor.name}] Received error while updating response: ${event.error.message}`);
    if (event.error instanceof RequestError) {
      this.logMessage(event.error.response.getBodyContents());
    }
    this.debug('Received error while updating response:', event.error);

    const info: ActionPollingDebugInfo = {
      success: false,
      statusMessage: event.error.message,
      responseHeaders: event.error instanceof RequestError ? event.error.response.getAllHeaders() : null,
      responseBody: event.error instanceof RequestError ? event.error.response.getBodyContents() : null,
    };

    this.sendToPropertyInspector(info);
  }

  /**
   * Invoked periodically to get an updated response.
   * 
   * @param context - The context for which action instance is requesting an updated response.
   * @returns A promise that resolves to an updated response.
   */
  protected abstract getResponse(context: ActionPollingContext<SettingsType>): Promise<ResponseType>;

  /**
   * Retrieves the number of seconds to wait between each polling event.
   * 
   * @param settings - The current action settings.
   * @returns The number of seconds to wait in between each polling event; default is 120 seconds.
   */
  protected getPollingDelay(settings: SettingsType): number {
    return 120;
  }

  /**
   * Retrieves the polling client for the current action instance.
   * 
   * @returns The polling client for the current action instance (if it exists).
   */
  protected getPollingClient(): PollingClient<ActionPollingContext<SettingsType>, ResponseType> | null {
    return this.clients[this.getClientKey()] ?? null;
  }

  /**
   * Generates a key based on the current device and action instance.
   * 
   * @returns A key for storing a reference to the polling client.
   */
  private getClientKey(): string {
    return [this.device, this.context].join('_');
  }
}
