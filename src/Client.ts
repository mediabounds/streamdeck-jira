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
  constructor(private readonly headers: Headers, public readonly body: T) {}

  /**
   * Retrieves all headers from the response in a JSON-encodable format.
   *
   * @returns All headers in the response.
   */
  getAllHeaders(): {[key: string]: string} {
    const headers: {[key: string]: string} = {};
    this.headers.forEach((value, name) => {
      headers[name] = value;
    });
    return headers;
  }

  /**
   * Retrieves a specific header from the response.
   *
   * @param name - The name of the header.
   * @returns The value of the header
   */
  getHeader(name: string): string | null {
    return this.headers.get(name);
  }

  /**
   * Retrieves the body of the response as a string.
   * 
   * Useful for logging the response.
   * 
   * @returns The body of the response as a string.
   */
  getBodyContents(): string {
    if (typeof this.body === 'string') {
      return this.body;
    }

    return JSON.stringify(this.body, null, 2);
  }
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

    if (typeof response.body === 'string') {
      message = response.body.replace(/(<([^>]+)>)/gi, "").trim();
    }
    else if ((match = JSON.stringify(response.body).match(/(\[|:|^)"(.*?)"/))) {
      // Assume that the first string in the body is an error message.
      message = match[2]
    }
    else {
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

    const bodyText = await result.text();
    let success = result.ok;
    let body: unknown;
    try {
      body = JSON.parse(bodyText);
    }
    catch (error) {
      success = false;
      body = bodyText;
    }

    if (!success) {
      const response = new Response(result.headers, body);
      throw new RequestError(response, result.statusText);
    }

    return new Response(result.headers, <TResponse>body);
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

/**
 * Authenticates requests using a bearer token.
 */
export class TokenAuth implements Authenticator {
  constructor(private token: string) {}
  public getAuthorizationHeader(): string {
    return `Bearer ${this.token}`;
  }
}
