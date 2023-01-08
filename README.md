# Stream Deck Jira Plugin
A Stream Deck plugin for viewing the number of Jira issues matching a JQL query (i.e. the number of new issues or issues waiting for your feedback).

## Features
* Allows for multiple actions to be defined with different JQL queries
* Button icon shows the count of issues matching the query
* The button opens each matching issue in a separate browser window

### Limitations
* The plugin uses the action icon for showing the number of issues matching a query; customizing the action icon will prevent the badge from being shown.

## Installation
### Plugin Store
_Coming soon..._

### Manual installation
1. Download the latest release from <https://github.com/mediabounds/streamdeck-jira/releases>.
2. Go to your download folder and open `com.mediabounds.streamdeck.jira.streamDeckPlugin`.

## Configuration
### Global settings
* **Domain** -- the product URL for your Jira organization (i.e. `organization.atlassian.net`)
* **Email** -- the email address for your Atlassian account
* **API Token** -- an API token for your account which can be created at <https://id.atlassian.com/manage-profile/security/api-tokens>.

### JQL Result action
In addition to the **Global settings**, the JQL Result action also requires:
* **JQL** -- a query for filtering a list of issues.

Optionally, you may also customize how the icon is badged with the number of issues matching the JQL query.

## License
The plugin is available as open source under the terms of the
[MIT License](https://opensource.org/licenses/MIT). A copy of the license can be
found at <https://github.com/mediabounds/streamdeck-jira/blob/main/LICENSE.md>.
