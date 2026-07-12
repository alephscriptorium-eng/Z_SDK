Skip to main content

-   [](https://angular.dev/)

    v21

-   `ctrl``K`
-   [Docs](https://angular.dev/docs)
-   [Tutorials](https://angular.dev/tutorials)
-   [Playground](https://angular.dev/playground)
-   [Reference](https://angular.dev/reference)

more_horiz

routine

-   Introduction

    -   [What is Angular?](https://angular.dev/overview)
    -   [Installation](https://angular.dev/installation)
    -   Essentials
    -   [Start coding! 🚀](https://angular.dev/tutorials/learn-angular)
-   In-depth Guides

    -   Signals Updated
    -   Components
    -   Templates
    -   Directives
    -   Dependency Injection Updated
    -   Routing Updated
    -   Forms Updated
    -   HTTP Client
    -   Server-side & hybrid-rendering
    -   Testing
    -   Angular Aria New
    -   Internationalization
    -   Animations Updated
    -   [Drag and drop](https://angular.dev/guide/drag-drop)
-   Build with AI

    -   [Get Started](https://angular.dev/ai)
    -   [LLM prompts and AI IDE setup](https://angular.dev/ai/develop-with-ai)
    -   [Agent Skills New](https://angular.dev/ai/agent-skills)
    -   [Angular CLI MCP Server setup](https://angular.dev/ai/mcp)
    -   [Angular AI Tutor](https://angular.dev/ai/ai-tutor)
    -   [Design Patterns](https://angular.dev/ai/design-patterns)
-   Developer Tools

    -   Angular CLI
    -   Libraries
    -   DevTools
    -   [Language Service](https://angular.dev/tools/language-service)
-   Best Practices

    -   [Style Guide Updated](https://angular.dev/style-guide)
    -   [Security](https://angular.dev/best-practices/security)
    -   [Accessibility](https://angular.dev/best-practices/a11y)
    -   [Unhandled errors in Angular](https://angular.dev/best-practices/error-handling)
    -   Performance
    -   [Keeping up-to-date](https://angular.dev/update)
-   Developer Events

    -   [Angular v21 Release New](https://angular.dev/events/v21)
-   Extended Ecosystem

    -   [NgModules](https://angular.dev/guide/ngmodules/overview)
    -   Legacy Animations
    -   Using RxJS with Angular
    -   Service Workers & PWAs
    -   [Web workers](https://angular.dev/ecosystem/web-workers)
    -   [Custom build pipeline](https://angular.dev/ecosystem/custom-build-pipeline)
    -   [Tailwind New](https://angular.dev/guide/tailwind)
    -   [Angular Fire](https://github.com/angular/angularfire#readme)
    -   [Google Maps](https://github.com/angular/components/tree/main/src/google-maps#readme)
    -   [Google Pay](https://github.com/google-pay/google-pay-button#angular)
    -   [YouTube player](https://github.com/angular/components/blob/main/src/youtube-player/README.md)
    -   [Angular CDK](https://material.angular.dev/cdk/categories)
    -   [Angular Material](https://material.angular.dev/)

This site uses cookies from Google to deliver its services and to analyze traffic.

Build with AI

Angular CLI MCP Server setup
============================

[edit](https://github.com/angular/angular/edit/main/adev/src/content/ai/mcp-server-setup.md "Edit this page")

The Angular CLI includes an experimental [Model Context Protocol (MCP) server](https://modelcontextprotocol.io/) enabling AI assistants in your development environment to interact with the Angular CLI. We've included support for CLI powered code generation, adding packages, and more.

On this page
------------

-   [Available Tools ](https://angular.dev/ai/mcp#available-tools "Available Tools")
-   [Experimental Tools ](https://angular.dev/ai/mcp#experimental-tools "Experimental Tools")
-   [Get Started ](https://angular.dev/ai/mcp#get-started "Get Started")
-   [Cursor ](https://angular.dev/ai/mcp#cursor "Cursor")
-   [Firebase Studio ](https://angular.dev/ai/mcp#firebase-studio "Firebase Studio")
-   [Gemini CLI ](https://angular.dev/ai/mcp#gemini-cli "Gemini CLI")
-   [JetBrains IDEs ](https://angular.dev/ai/mcp#jetbrains-ides "JetBrains IDEs")
-   [VS Code ](https://angular.dev/ai/mcp#vs-code "VS Code")
-   [Other IDEs ](https://angular.dev/ai/mcp#other-ides "Other IDEs")
-   [Command Options ](https://angular.dev/ai/mcp#command-options "Command Options")
-   [Feedback and New Ideas ](https://angular.dev/ai/mcp#feedback-and-new-ideas "Feedback and New Ideas")

[Available Toolslink](https://angular.dev/ai/mcp#available-tools)
-----------------------------------------------------------------

The Angular CLI MCP server provides several tools to assist you in your development workflow. By default, the following tools are enabled:

| Name | Description | `local-only` | `read-only` |
| :-- | :-- | :-: | :-: |
| `ai_tutor` | Launches an interactive AI-powered Angular tutor. Recommended to run from a new Angular project using v20 or later. [Learn more](https://angular.dev/ai/ai-tutor). | ✅ | ✅ |
| `find_examples` | Finds authoritative code examples from a curated database of official, best-practice examples, focusing on **modern, new, and recently updated** Angular features. | ✅ | ✅ |
| `get_best_practices` | Retrieves the Angular Best Practices Guide. This guide is essential for ensuring that all code adheres to modern standards, including standalone components, typed forms, and modern control flow. | ✅ | ✅ |
| `list_projects` | Lists the names of all applications and libraries defined within an Angular workspace. It reads the `angular.json` configuration file to identify the projects. | ✅ | ✅ |
| `onpush_zoneless_migration` | Analyzes Angular code and provides a step-by-step, iterative plan to migrate it to `OnPush` change detection, a prerequisite for a zoneless application. | ✅ | ✅ |
| `search_documentation` | Searches the official Angular documentation at [https://angular.dev](https://angular.dev/). This tool should be used to answer any questions about Angular, such as for APIs, tutorials, and best practices. | ❌ | ✅ |

### [Experimental Toolslink](https://angular.dev/ai/mcp#experimental-tools)

Some tools are provided in experimental / preview status since they are new or not fully tested. Enable them individually with the [`--experimental-tool`](https://angular.dev/ai/mcp#command-options) option and use them with caution.

| Name | Description | `local-only` | `read-only` |
| :-- | :-- | :-: | :-: |
| `build` | Perform a one-off, non-watched build using `ng build`. | ✅ | ❌ |
| `devserver.start` | Asynchronously starts a development server that watches the workspace for changes, similar to running `ng serve`. Since this is asynchronous it returns immediately. To manage the resulting server, use the `devserver.stop` and `devserver.wait_for_build` tools. | ✅ | ✅ |
| `devserver.stop` | Stops a development server started by `devserver.start`. | ✅ | ✅ |
| `devserver.wait_for_build` | Returns the output logs of the most recent build in a running development server started by `devserver.start`. If a build is currently ongoing, it will first wait for that build to complete and then return the logs. | ✅ | ✅ |
| `e2e` | Executes the end-to-end tests configured in the project. | ✅ | ✅ |
| `modernize` | Performs code migrations and provides further instructions on how to modernize Angular code to align with the latest best practices and syntax. [Learn more](https://angular.dev/reference/migrations) | ✅ | ❌ |
| `test` | Runs the project's unit tests. | ✅ | ✅ |

[Get Startedlink](https://angular.dev/ai/mcp#get-started)
---------------------------------------------------------

To get started, run the following command in your terminal:

```
ng mcp
```

check

When run from an interactive terminal, this command displays instructions on how to configure a host environment to use the MCP server. The following sections provide example configurations for several popular editors and tools.

### [Cursorlink](https://angular.dev/ai/mcp#cursor)

Create a file named `.cursor/mcp.json` in your project's root and add the following configuration. You can also configure it globally in `~/.cursor/mcp.json`.

```
{  "mcpServers": {    "angular-cli": {      "command": "npx",      "args": ["-y", "@angular/cli", "mcp"]    }  }}
```

check

### [Firebase Studiolink](https://angular.dev/ai/mcp#firebase-studio)

Create a file named `.idx/mcp.json` in your project's root and add the following configuration:

```
{  "mcpServers": {    "angular-cli": {      "command": "npx",      "args": ["-y", "@angular/cli", "mcp"]    }  }}
```

check

### [Gemini CLIlink](https://angular.dev/ai/mcp#gemini-cli)

Create a file named `.gemini/settings.json` in your project's root and add the following configuration:

```
{  "mcpServers": {    "angular-cli": {      "command": "npx",      "args": ["-y", "@angular/cli", "mcp"]    }  }}
```

check

### [JetBrains IDEslink](https://angular.dev/ai/mcp#jetbrains-ides)

In JetBrains IDEs (like IntelliJ IDEA or WebStorm), after installing the JetBrains AI Assistant plugin, go to `Settings | Tools | AI Assistant | Model Context Protocol (MCP)`. Add a new server (`+`) and select `As JSON`. Then paste the following configuration:

```
{  "mcpServers": {    "angular-cli": {      "command": "npx",      "args": ["-y", "@angular/cli", "mcp"]    }  }}
```

check

For the most up-to-date instructions on configuring MCP servers, please refer to the JetBrains documentation: [Connect to an MCP server](https://www.jetbrains.com/help/ai-assistant/mcp.html#connect-to-an-mcp-server).

### [VS Codelink](https://angular.dev/ai/mcp#vs-code)

In your project's root, create a file named `.vscode/mcp.json` and add the following configuration. Note the use of the `servers` property.

```
{  "servers": {    "angular-cli": {      "command": "npx",      "args": ["-y", "@angular/cli", "mcp"]    }  }}
```

check

### [Other IDEslink](https://angular.dev/ai/mcp#other-ides)

For other IDEs, check your IDE's documentation for the proper location of the MCP configuration file (often `mcp.json`). The configuration should contain the following snippet.

```
{  "mcpServers": {    "angular-cli": {      "command": "npx",      "args": ["-y", "@angular/cli", "mcp"]    }  }}
```

check

[Command Optionslink](https://angular.dev/ai/mcp#command-options)
-----------------------------------------------------------------

The `mcp` command can be configured with the following options passed as arguments in your IDE's MCP configuration:

| Option | Type | Description | Default |
| :-- | :-- | :-- | :-- |
| `--read-only` | `boolean` | Only register tools that do not make changes to the project. Your editor or coding agent may still perform edits. | `false` |
| `--local-only` | `boolean` | Only register tools that do not require an internet connection. Your editor or coding agent may still send data over the network. | `false` |
| `--experimental-tool`\
`-E` | `string` | Enable an [experimental tool](https://angular.dev/ai/mcp#experimental-tools). Separate multiple options by spaces, e.g. `-E tool_a tool_b`. Enable all `devserver.x` tools by using `-E devserver`. |  |

For example, to run the server in read-only mode in VS Code, you would update your `mcp.json` like this:

```
{  "servers": {    "angular-cli": {      "command": "npx",      "args": ["-y", "@angular/cli", "mcp", "--read-only"]    }  }}
```

check

[Feedback and New Ideaslink](https://angular.dev/ai/mcp#feedback-and-new-ideas)
-------------------------------------------------------------------------------

The Angular team welcomes your feedback on the existing MCP capabilities and any ideas you have for new tools or features. Please share your thoughts by opening an issue on the [angular/angular GitHub repository](https://github.com/angular/angular/issues).

Social Media
------------

-   [Blog](https://blog.angular.dev/ "Angular blog")
-   [X (formerly Twitter)](https://x.com/angular "X (formerly Twitter)")
-   [Bluesky](https://bsky.app/profile/angular.dev "Bluesky")
-   [YouTube](https://www.youtube.com/angular "YouTube")
-   [Discord](https://discord.gg/angular "Join the discussions at Angular Community Discord server.")
-   [GitHub](https://github.com/angular/angular "GitHub")
-   [Stack Overflow](https://stackoverflow.com/questions/tagged/angular "Stack Overflow: where the community answers your technical Angular questions.")

Community
---------

-   [Contribute](https://github.com/angular/angular/blob/main/CONTRIBUTING.md "Contribute to Angular")
-   [Code of Conduct](https://github.com/angular/code-of-conduct/blob/main/CODE_OF_CONDUCT.md "Treating each other with respect.")
-   [Report Issues](https://github.com/angular/angular/issues "Post issues and suggestions on github.")
-   [Google's DevLibrary](https://devlibrary.withgoogle.com/products/angular?sort=updated "Google's DevLibrary")
-   [Angular Google Developer Experts](https://developers.google.com/community/experts/directory?specialization=angular "Angular Google Developer Experts")

Resources
---------

-   [Press Kit](https://angular.dev/press-kit "Press contacts, logos, and branding.")
-   [Roadmap](https://angular.dev/roadmap "Roadmap")

Community translations
----------------------

-   [Azərbaycanca](https://angular.az/ "Azərbaycanca")
-   [Türkçe](https://angular-docs.tr/ "Türkçe")
-   [Русский](https://angular-docs.ru/ "Русский")
-   [한국어](https://angular.kr/ "한국어")
-   [日本語版](https://angular.jp/ "日本語版")
-   [简体中文版](https://angular.cn/ "简体中文版")
-   [正體中文版](https://dev.angular.tw/ "正體中文版")

Super-powered by Google ©2010-2026. Code licensed under an [MIT-style License](https://angular.dev/license "License text") . Documentation licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) . Built by Angular at v21.2.8+sha-b1407e1.