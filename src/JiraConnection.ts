import Client, { Authenticator, BasicAuth, TokenAuth } from "./Client";
import { DefaultPluginSettings } from "./JiraPluginSettings";

/**
 * Convenience class for getting connected to Jira.
 */
export class JiraConnection {
  /**
   * Creates a new Client for making API requests.
   * 
   * @param settings - Connection settings for the client.
   * @returns A configured Client.
   */
  public static getClient(settings: DefaultPluginSettings): Client {
    const {domain, context} = settings;

    if (!domain) {
      throw new Error('A domain must be set');
    }

    let endpoint = `https://${domain}`;
    if (context) {
      endpoint = `${endpoint}/${context}`;
    }

    const authenticator = this.getAuthenticator(settings);

    return new Client(endpoint, authenticator);
  }

  public static getAuthenticator(settings: DefaultPluginSettings): Authenticator {
    const { email: username, token: key, strategy } = settings;

    if (!key) {
      throw new Error('An API token must be set');
    }

    if (strategy === 'PAT') {
      return new TokenAuth(key);
    } else {
      return new BasicAuth(username, key);
    }
  }
}
