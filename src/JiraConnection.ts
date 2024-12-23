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
    const {domain, context, email: username, token: key, strategy} = settings;

    if (!domain) {
      throw new Error('A domain must be set');
    }

    let endpoint = `https://${domain}`;
    if (context) {
      endpoint = `${endpoint}/${context}`;
    }

    if (!key) {
      throw new Error('An API token must be set');
    }

    let authenticator: Authenticator;
    if (strategy === 'PAT') {
      authenticator = new TokenAuth(key);
    } else {
      authenticator = new BasicAuth(username, key);
    }

    return new Client(endpoint, authenticator);
  }
}
