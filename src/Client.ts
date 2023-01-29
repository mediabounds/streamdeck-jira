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
  constructor(public readonly response: Response<T>, statusText: string) {
    let message: string;
    let match: RegExpMatchArray;
    // Assume that the first string in the body is an error message.
    if ((match = JSON.stringify(response.body).match(/[[:]?"(.*?)"/))) {
      // Strip any HTML tags.
      message = match[1].replace(/(<([^>]+)>)/gi, "");
    } else {
      message = statusText;
    }

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

    if (!result.ok) {
      const bodyText = await result.text();
      let body: unknown;

      // Even though the response was unsuccessful, see if the response body is JSON.
      try {
        body = JSON.parse(bodyText);
      }
      catch (error) {
        body = bodyText;
      }

      const response = new Response(result.headers, body);
      throw new RequestError(response, result.statusText);
    }

    const body = await result.json() as TResponse;
    return new Response(result.headers, body);
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

