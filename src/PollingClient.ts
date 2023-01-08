/**
 * An asynchronous task that can be periodically polled by a polling client.
 */
export type PollingTarget<ContextType, ResponseType> = (context: ContextType) => Promise<ResponseType>;

/**
 * Event containing details of an updated response from a polling client.
 */
export interface PollingResponseEvent<ContextType, ResponseType> {
  context: ContextType;
  client: PollingClient<ContextType, ResponseType>
  response: ResponseType;
  didRecoverFromError: boolean;
}

/**
 * Event containing details of an error encountered during polling.
 */
export interface PollingErrorEvent<ContextType, ResponseType> {
  context: ContextType;
  client: PollingClient<ContextType, ResponseType>
  error: Error;
  lastResponse?: ResponseType;
}

/**
 * Delegate to receive polling updates.
 */
export interface PollingClientDelegate<ContextType, ResponseType> {
  /**
   * Invoked when an updated response is available from the polling target.
   *
   * @param event - The event.
   */
  handleDidReceivePollingResponse?(event: PollingResponseEvent<ContextType, ResponseType>): void;
  /**
   * Invoked when an error was encountered while polling the target.
   *
   * @param event - The event.
   */
  handleDidReceivePollingError?(event: PollingErrorEvent<ContextType, ResponseType>): void;
}

/**
 * Periodically performs an asynchronous task and passes the response to a delegate.
 */
export class PollingClient<ContextType, ResponseType>  {
  protected target: PollingTarget<ContextType, ResponseType>
  protected context: ContextType;
  protected delegate?: PollingClientDelegate<ContextType, ResponseType>;
  protected lastSuccessfulResponse?: ResponseType;
  protected error?: Error;
  private interval?: number;

  constructor(target: PollingTarget<ContextType, ResponseType>, context: ContextType, delegate?: PollingClientDelegate<ContextType, ResponseType>) {
    this.target = target;
    this.context = context;
    this.delegate = delegate;
  }

  /**
   * Immediately polls the target.
   */
  public poll(): void {
    void this.pollAsync();
  }

  /**
   * Immediately polls the target and returns a promise for the response.
   *
   * @returns A promise that resolves to the updated response.
   */
  public async pollAsync(): Promise<ResponseType> {
    try {
      const response = await this.target(this.context);
      const didRecoverFromError = !!this.error;
      this.error = null;
      this.delegate?.handleDidReceivePollingResponse?.({
        context: this.context,
        client: this,
        response: response,
        didRecoverFromError: didRecoverFromError,
      });
      this.lastSuccessfulResponse = response;
      return response;
    } catch (error) {
      this.error = <Error>error;
      this.delegate?.handleDidReceivePollingError?.({
        context: this.context,
        client: this,
        error: <Error>error,
        lastResponse: this.lastSuccessfulResponse,
      });
    }
  }

  /**
   * Starts a recurring task to poll the target for an updated response.
   * 
   * When invoked, it immediately polls the target for a response.
   * 
   * @param delay - The number of milliseconds to wait in between polling events.
   */
  public startPolling(delay: number): void {
    if (this.interval) {
      return;
    }

    this.interval = setInterval(() => this.poll(), delay);
    this.poll();
  }

  /**
   * Stops polling the target.
   */
  public stopPolling(): void {
    if (!this.interval) {
      return;
    }

    clearInterval(this.interval);
  }

  /**
   * Retrieves the last response received by the target.
   * @returns The last response received by the target.
   */
  public getLastResponse(): ResponseType | null {
    return this.lastSuccessfulResponse;
  }

  /**
   * Updates the context used by polling events.
   * @param context - Updated context for future polling events.
   */
  public setContext(context: ContextType): void {
    this.context = context;
  }

  /**
   * Retrieves the current context being used by polling events.
   * @returns The context being used by polling events.
   */
  public getContext(): ContextType {
    return this.context;
  }

}
