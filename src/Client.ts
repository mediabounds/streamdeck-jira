/**
 * Options for controlling how an HTTP(S) request is made.
 */
export interface RequestOptions {
  endpoint: string;
  query?: Record<string, string>;
  method?: string;
  mode?: RequestMode;
  cache?: RequestCache;
  cors?: string;
  credentials?: RequestCredentials;
  headers?: Headers;
  redirect?: RequestRedirect;
  referrerPolicy?: ReferrerPolicy;
  body?: unknown;
}

/**
 * A response to a request.
 */
class Response<T = unknown> {
  constructor(public readonly headers: Headers, public readonly body: T) {}
}

/**
 * Provides an Authorization header for authenticating requests.
 */
export interface Authenticator {
  getAuthorizationHeader(): string;
}

/**
 * An error returned by the server.
 * 
 * In this case, the request successfully made it to the server and a response was received,
 * but the server indicated the response was an error because the status code was 4xx or 5xx.
 */
export class RequestError<T> extends Error {
  constructor(public readonly response: Response<T>) {
    // Assume that the first element in the JSON is an error message.
    const message = JSON.stringify(response.body).match(/[[:]"(.*?)"/)[1] ?? 'The server returned an error';
    super(message);
  }
}

/**
 * A really basic HttpClient wrapper around the Fetch API.
 */
export default class Client {
  constructor(private baseUrl: string, private authenticator?: Authenticator, private defaultHeaders?: Headers) {}

  /**
   * Perform an HTTP(S) request.
   * 
   * @param options - Options for the request.
   * @returns A promise that resolves to the response received from the server.
   */
  public async request<TResponse>(options: RequestOptions): Promise<Response<TResponse>> {
    const headers = new Headers();
    this.defaultHeaders?.forEach((value, key) => headers.set(key, value));
    options.headers?.forEach((value, key) => headers.append(key, value));
    if (this.authenticator) {
      headers.append('Authorization', this.authenticator.getAuthorizationHeader());
    }

    const result = await fetch(this.getUrl(options), {
      method: options.method,
      mode: options.mode,
      cache: options.cache,
      credentials: options.credentials,
      headers: headers,
      redirect: options.redirect,
      referrerPolicy: options.referrerPolicy,
      body: options.body
    });

    if (result.status >= 400 && result.status < 600) {
      const response = await this.getResponse(result);
      throw new RequestError(response);
    }

    return this.getResponse(result);
  }

  /**
   * Computes the full URL of the request (combining host, endpoint, and query parameters).
   * 
   * @param options - The current request options.
   * @returns The full URL of the request.
   */
  protected getUrl(options: RequestOptions): string {
    let url = `${this.baseUrl}/${options.endpoint}`;
    if (options.query) {
      url += `?${(new URLSearchParams(options.query).toString())}`;
    }
    return url;
  }

  /**
   * Prepares a wrapped response to return to the caller.
   * 
   * @param rawResponse - The raw response received via the Fetch API.
   * @returns A wrapped response with body and headers.
   */
  protected async getResponse<T>(rawResponse: globalThis.Response): Promise<Response<T>> {
    const data = await rawResponse.json() as T;
    return new Response(rawResponse.headers, data);
  }
}

/**
 * Authenticates requests using HTTP Basic Authentication.
 */
export class BasicAuth implements Authenticator {
  constructor(private username: string, private password: string) {}
  public getAuthorizationHeader(): string {
    return `Basic ${btoa(`${this.username}:${this.password}`)}`;
  }
}

