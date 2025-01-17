# Stream Deck Jira Plugin
![Jira on Stream Deck](src/previews/1-preview.png)
A Stream Deck plugin for finding issues in Jira, content in Confluence, or alerts in JSM.

For example, add an action showing the number of Jira issues matching a JQL query (i.e. the number of new issues or issues waiting for your feedback).
Or, add an action showing the number of inline Confluence tasks assigned to you.
Or, add an action showing the number of open alerts in JSM.

## Features
* Allows for multiple actions to be defined with different JQL queries
* Search Confluence to find content matching a CQL query
* Display the number of inline tasks assigned to you in Confluence
* Display the number of alerts matching a custom query (Jira Cloud only)
* Button icon shows the count of items matching the query
* Many customization options for how the badge is displayed
* Allows for custom icons to be set
* Supports Jira Cloud and Jira Server (8.14 and later)

## Installation
### Preferred: Stream Deck Store
https://apps.elgato.com/plugins/com.mediabounds.streamdeck.jira

### Alternative: Manual installation
1. Download the latest release from <https://github.com/mediabounds/streamdeck-jira/releases>.
2. Go to your download folder and open `com.mediabounds.streamdeck.jira.streamDeckPlugin`.

## Configuration
### JQL Result
* **JQL** -- a query for filtering a list of issues.

### Confluence Search
* **CQL** -- a query written in CQL (Confluence Query Language) for finding a list of matching content.

### Confluence Tasks
* **Due After** -- finds inline tasks due on or after this date.
* **Due Before** -- finds inline tasks due before this date.

### Ops Alerts
* **Query** -- a query for filtering a list of alerts ([query syntax](https://operations-help.atlassian.net/wiki/spaces/OPSHELP/pages/8028374/Search+syntax+for+alerts)).

### Common Settings
#### Authentication
* **Domain** -- the product URL for your Jira organization (i.e. `organization.atlassian.net`)
* **Type** -- whether your Jira instance is Jira Cloud or Jira Server
* **Email** -- the email address for your Atlassian account
* **API Token** -- an API token for your account
  * For Jira Cloud, this can be created at <https://id.atlassian.com/manage-profile/security/api-tokens>
  * For Jira Server, you'll need a [Personal Access Token](https://confluence.atlassian.com/enterprise/using-personal-access-tokens-1026032365.html)

#### Icon
Optionally, you may also customize how the icon is badged.

## FAQ
### Can I choose my own icon?
Yep! But you'll want to upload a **Custom Image** in the **Icon** settings for the plugin instead of setting the icon through Stream Deck's icon library.

![Setting a Custom Icon](docs/custom-image.png)

> **Note**  
> When a custom icon is set using Stream Deck's built-in interface or icon library, the plugin will no longer be able to add a badge on the icon. You can remove a custom icon set via Stream Deck by tapping the ˅ on the icon and selecting **Reset to Default**.

### Why do I get a yellow ! on the icon?
The yellow exclamation mark means that the plugin encountered some problem while trying to find the number of objects matching the query. This could mean the API token isn't entered correctly, or there's a syntax error in the query, or just that there was some Internet connection problem while talking to the server.

Below the query field is a status indicator that'll confirm whether the plugin is able to communicate with Jira. When there is a problem, it will show a warning.
![Status indicator](docs/problem.png)

When you click on the status indicator, it will provide more details about what went wrong.
![Problem message](docs/problem-message.png)

<details>
<summary>Need to debug more?</summary>
If you're sure all the configuration is correct but the connection is still not successful, you can alternate click (i.e. right-clicking) on the status message to get a more in-depth view at the response.

![Debugging a problem](docs/problem-debug.png)
</details>

## Development
This plugin is based on the [streamdeck](https://github.com/fnando/streamdeck) plugin framework.

### Building a development version

    npx streamdeck bundle --dev

### Opening the debugger

    npx streamdeck debug

## License
The plugin is available as open source under the terms of the
[MIT License](https://opensource.org/licenses/MIT). A copy of the license can be
found at <https://github.com/mediabounds/streamdeck-jira/blob/main/LICENSE.md>.
