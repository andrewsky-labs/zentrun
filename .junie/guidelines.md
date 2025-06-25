# Project Guidelines

## Project Structure

The project follows a structured architecture with clear separation of concerns. Here's the detailed overview of the main directories:

### `/src/main/presenter` Directory Structure

- **`index.ts`**: Main entry point for presenter modules, likely exports all presenters for use in the application.
- **`proxyConfig.ts`**: Configuration for network proxies used in the application.
- **`trayPresenter.ts`**: Manages the system tray icon and its menu items for the Electron application.
- **`windowPresenter.ts`**: Handles window management (creating, positioning, resizing, and state persistence).
- **`shortcutPresenter.ts`**: Manages global keyboard shortcuts across the application.
- **`notifactionPresenter.ts`**: Handles system notifications and their interactions.

#### Presenter Modules:
- **`/mcpPresenter`**: Manages Model Context Protocol integration, handling AI model interactions.
- **`/filePresenter`**: Handles file system operations like reading, writing, and managing file permissions.
- **`/syncPresenter`**: Manages data synchronization between local storage and remote servers.
- **`/configPresenter`**: Handles application configuration settings and preferences.
- **`/devicePresenter`**: Manages device-specific features and hardware integration.
- **`/sqlitePresenter`**: Base SQLite database operations and management.
- **`/threadPresenter`**: Manages conversation threads for chat interfaces.
- **`/upgradePresenter`**: Handles application updates and version management.
- **`/deeplinkPresenter`**: Manages deep linking functionality for external URL handling.
- **`/llamaCppPresenter`**: Integration with LLaMa C++ for local language model support.
- **`/teamSQLitePresenter`**: Handles team-related database operations and management.
- **`/zentSQLitePresenter`**: Manages Zent (knowledge units) database operations.
- **`/agentSQLitePresenter`**: Handles agent-related database operations.
- **`/llmProviderPresenter`**: Manages different LLM providers and their configurations.
- **`/organizationSQLitePresenter`**: Handles organization-related database operations.

### `/src/renderer/src` Directory Structure

- **`App.vue`**: Main Vue component that serves as the application's root.
- **`main.ts`**: Entry point for the renderer process, sets up Vue and other core dependencies.
- **`env.d.ts`**: TypeScript declaration file for environment variables.
- **`events.ts`**: Defines event types and handlers for application-wide event communication.

#### Key Directories:
- **`/api`**: Contains API client code for communicating with backend services.
- **`/lib`**: Utility libraries and helper functions used throughout the application.
- **`/i18n`**: Internationalization configuration and translation files.
- **`/views`**: Top-level page components that correspond to different application screens.
- **`/assets`**: Static assets like images, fonts, and global CSS.
- **`/router`**: Vue Router configuration for navigation between different views.
- **`/stores`**: Pinia store modules for state management.
- **`/composables`**: Reusable Vue composition functions (custom hooks).

#### Components Directory:
- **`/components/ui`**: Reusable UI components like buttons, inputs, modals that follow a design system.
- **`/components/icons`**: SVG icon components for consistent icon usage across the app.
- **`/components/editor`**: Rich text editor components and related functionality.
- **`/components/dialogs`**: Modal dialog components for different features (team, agent, organization management).
- **`/components/message`**: Components for displaying chat messages and their various states.
- **`/components/markdown`**: Markdown rendering and editing components.
- **`/components/settings`**: Settings panels and configuration UI components.
- **`/components/artifacts`**: Components for handling file attachments and generated content.
- **`/components/mcp-config`**: Components specific to Model Context Protocol configuration.
- **`/components/json-viewer`**: Components for displaying and interacting with JSON data.

#### Individual Components:
- **`components/AppBar.vue`**: Top application bar with navigation controls and global actions.
- **`components/SideBar.vue`**: Side navigation menu showing workspace structure and navigation options.
- **`components/ChatView.vue`**: Main chat interface displaying conversation messages.
- **`components/FileItem.vue`**: Component for displaying and interacting with file entries.
- **`components/ChatInput.vue`**: Text input component for sending messages in chats.
- **`components/NewThread.vue`**: Component for creating new conversation threads.
- **`components/TitleView.vue`**: Displays and allows editing of thread or document titles.
- **`components/ChatConfig.vue`**: Configuration panel for chat settings and preferences.
- **`components/ThreadItem.vue`**: Individual thread entry in the threads list.
- **`components/ModelSelect.vue`**: Dropdown for selecting different AI models for conversations.
- **`components/ThreadsView.vue`**: List view of conversation threads with sorting and filtering.
- **`components/mcpToolsList.vue`**: List of available Model Context Protocol tools and their settings.
- **`components/SearchResultsDrawer.vue`**: Slide-out panel showing search results across the application.

## Coding Standards (2025-05-24 저장, 추후에 파일 추가 될 수 있으므로 전체 프로젝트 구조 참고로 쓰기)

```
├── CONTRIBUTING.md
├── CONTRIBUTING.zh.md
├── Dockerfile.build.linux
├── LICENSE
├── README.jp.md
├── README.md
├── README.zh.md
├── build
│   ├── VERSION-README.md
│   ├── entitlements.mac.plist
│   ├── generate-version-files.mjs
│   ├── icnsmaker.sh
│   ├── icon.icns
│   ├── icon.ico
│   ├── icon.png
│   ├── screen.artifacts.jpg
│   ├── screen.jpg
│   ├── screen.latex.jpg
│   ├── screen.latex.zh.jpg
│   ├── screen.search.jpg
│   ├── screen.search.zh.jpg
│   └── screen.zh.jpg
├── components.json
├── docs
│   ├── README.md
│   ├── config-presenter-architecture.md
│   ├── config-presenter-design.md
│   ├── data-sync-feature.md
│   ├── zentrun_tool_use_document.md
│   ├── deeplinks.md
│   ├── event-system-design.md
│   ├── function-call-and-mcp.md
│   ├── linux-build-guide.md
│   ├── markdown-support.md
│   ├── mcp-presenter-architecture.md
│   └── mcp-presenter-design.md
├── electron-builder-macx64.yml
├── electron-builder.yml
├── electron.vite.config.ts
├── out
│   ├── main
│   │   └── index.js
│   └── preload
│       └── index.mjs
├── package.json
├── resources
│   ├── blankSearch.html
│   ├── cdn
│   │   ├── Recharts.js
│   │   ├── babel.min.js
│   │   ├── lucide.js
│   │   ├── prop-types.min.js
│   │   ├── react-dom.production.min.js
│   │   ├── react.production.min.js
│   │   └── tailwind.min.css
│   ├── icon.ico
│   ├── icon.png
│   ├── macTrayTemplate.png
│   └── win_tray.ico
├── runtime
│   ├── .gitkeep
│   └── node
│       ├── CHANGELOG.md
│       ├── LICENSE
│       ├── README.md
│       ├── bin
│       │   ├── corepack
│       │   ├── node
│       │   ├── npm
│       │   └── npx
│       ├── lib

│       └── linux_x64
├── scripts
│   ├── afterPack.js
│   ├── notarize.js
│   └── postinstall.js
├── shared
│   └── presenter.d.ts
├── src
│   ├── main
│   │   ├── contextMenuHelper.ts
│   │   ├── eventbus.ts
│   │   ├── events.ts
│   │   ├── index.ts
│   │   └── presenter
│   │       ├── agentSQLitePresenter
│   │       │   └── index.ts
│   │       ├── configPresenter
│   │       │   ├── aes.ts
│   │       │   ├── index.ts
│   │       │   ├── mcpConfHelper.ts
│   │       │   ├── modelDefaultSettings.ts
│   │       │   ├── providerModelSettings.ts
│   │       │   └── providers.ts
│   │       ├── deeplinkPresenter
│   │       │   └── index.ts
│   │       ├── devicePresenter
│   │       │   └── index.ts
│   │       ├── filePresenter
│   │       │   ├── AudioFileAdapter.ts
│   │       │   ├── BaseFileAdapter.ts
│   │       │   ├── CodeFileAdapter.ts
│   │       │   ├── CsvFileAdapter.ts
│   │       │   ├── DirectoryAdapter.ts
│   │       │   ├── DocFileAdapter.ts
│   │       │   ├── ExcelFileAdapter.ts
│   │       │   ├── FileAdapterConstructor.ts
│   │       │   ├── FilePresenter.ts
│   │       │   ├── ImageFileAdapter.ts
│   │       │   ├── PdfFileAdapter.ts
│   │       │   ├── PptFileAdapter.ts
│   │       │   ├── TextFileAdapter.ts
│   │       │   ├── UnsupportFileAdapter.ts
│   │       │   └── mime.ts
│   │       ├── index.ts
│   │       ├── llamaCppPresenter
│   │       │   ├── index.ts
│   │       │   └── llama.ts
│   │       ├── llmProviderPresenter
│   │       │   ├── baseProvider.ts
│   │       │   ├── index.ts
│   │       │   └── providers
│   │       │       ├── anthropicProvider.ts
│   │       │       ├── deepseekProvider.ts
│   │       │       ├── doubaoProvider.ts
│   │       │       ├── geminiProvider.ts
│   │       │       ├── githubProvider.ts
│   │       │       ├── grokProvider.ts
│   │       │       ├── lmstudioProvider.ts
│   │       │       ├── ollamaProvider.ts
│   │       │       ├── openAICompatibleProvider.ts
│   │       │       ├── openAIProvider.ts
│   │       │       ├── openAIResponsesProvider.ts
│   │       │       ├── ppioProvider.ts
│   │       │       ├── siliconcloudProvider.ts
│   │       │       └── zhipuProvider.ts
│   │       ├── mcpPresenter
│   │       │   ├── inMemoryServers
│   │       │   │   ├── artifactsServer.ts
│   │       │   │   ├── bochaSearchServer.ts
│   │       │   │   ├── braveSearchServer.ts
│   │       │   │   ├── builder.ts
│   │       │   │   ├── difyKnowledgeServer.ts
│   │       │   │   ├── fastGptKnowledgeServer.ts
│   │       │   │   ├── filesystem.ts
│   │       │   │   ├── imageServer.ts
│   │       │   │   ├── powerpackServer.ts
│   │       │   │   └── ragflowKnowledgeServer.ts
│   │       │   ├── index.ts
│   │       │   ├── mcpClient.ts
│   │       │   ├── pythonRunner
│   │       │   │   ├── index.ts
│   │       │   │   └── prepareEnv.ts
│   │       │   ├── serverManager.ts
│   │       │   └── toolManager.ts
│   │       ├── notifactionPresenter.ts
│   │       ├── organizationSQLitePresenter
│   │       │   └── index.ts
│   │       ├── proxyConfig.ts
│   │       ├── shortcutPresenter.ts
│   │       ├── sqlitePresenter
│   │       │   ├── importData.ts
│   │       │   ├── index.ts
│   │       │   └── tables
│   │       │       ├── agents.ts
│   │       │       ├── attachments.ts
│   │       │       ├── baseTable.ts
│   │       │       ├── conversations.ts
│   │       │       ├── messageAttachments.ts
│   │       │       ├── messages.ts
│   │       │       ├── organizations.ts
│   │       │       ├── teams.ts
│   │       │       └── zents.ts
│   │       ├── syncPresenter
│   │       │   └── index.ts
│   │       ├── teamSQLitePresenter
│   │       │   └── index.ts
│   │       ├── threadPresenter
│   │       │   ├── const.ts
│   │       │   ├── contentEnricher.ts
│   │       │   ├── fileContext.ts
│   │       │   ├── index.ts
│   │       │   ├── messageManager.ts
│   │       │   └── searchManager.ts
│   │       ├── trayPresenter.ts
│   │       ├── upgradePresenter
│   │       │   └── index.ts
│   │       ├── windowPresenter.ts
│   │       └── zentSQLitePresenter
│   │           └── index.ts
│   ├── preload
│   │   ├── index.d.ts
│   │   └── index.ts
│   ├── renderer
│   │   ├── index.html
│   │   └── src
│   │       ├── App.vue
│   │       ├── api
│   │       │   └── index.ts
│   │       ├── assets
│   │       │   ├── images
│   │       │   │   ├── dify.png
│   │       │   │   ├── fastgpt.png
│   │       │   │   └── ragflow.png
│   │       │   ├── llm-icons
│   │       │   ├── logo-dark.png
│   │       │   ├── logo.png
│   │       │   ├── main.css
│   │       │   ├── mcp-icons
│   │       │   │   └── higress.avif
│   │       │   └── style.css
│   │       ├── components
│   │       │   ├── AppBar.vue
│   │       │   ├── ChatConfig.vue
│   │       │   ├── ChatInput.vue
│   │       │   ├── ChatView.vue
│   │       │   ├── FileItem.vue
│   │       │   ├── ModelSelect.vue
│   │       │   ├── NewThread.vue
│   │       │   ├── SearchResultsDrawer.vue
│   │       │   ├── SideBar.vue
│   │       │   ├── ThreadItem.vue
│   │       │   ├── ThreadsView.vue
│   │       │   ├── TitleView.vue
│   │       │   ├── artifacts
│   │       │   │   ├── ArtifactBlock.vue
│   │       │   │   ├── ArtifactDialog.vue
│   │       │   │   ├── ArtifactPreview.vue
│   │       │   │   ├── ArtifactThinking.vue
│   │       │   │   ├── CodeArtifact.vue
│   │       │   │   ├── HTMLArtifact.vue
│   │       │   │   ├── MarkdownArtifact.vue
│   │       │   │   ├── MermaidArtifact.vue
│   │       │   │   ├── ReactArtifact.vue
│   │       │   │   ├── ReactTemplate.ts
│   │       │   │   ├── SvgArtifact.vue
│   │       │   │   └── ToolCallPreview.vue
│   │       │   ├── dialogs
│   │       │   │   ├── agent
│   │       │   │   │   ├── add.vue
│   │       │   │   │   ├── delete.vue
│   │       │   │   │   ├── edit.vue
│   │       │   │   │   ├── move.vue
│   │       │   │   │   └── rename.vue
│   │       │   │   ├── organization
│   │       │   │   │   ├── add.vue
│   │       │   │   │   ├── delete.vue
│   │       │   │   │   └── rename.vue
│   │       │   │   ├── team
│   │       │   │   │   ├── add.vue
│   │       │   │   │   ├── delete.vue
│   │       │   │   │   └── rename.vue
│   │       │   │   └── zent
│   │       │   │       ├── delete.vue
│   │       │   │       ├── edit.vue
│   │       │   │       ├── move.vue
│   │       │   │       └── rename.vue
│   │       │   ├── editor
│   │       │   │   └── mention
│   │       │   │       ├── MentionList.vue
│   │       │   │       ├── PromptParamsDialog.vue
│   │       │   │       ├── mention.ts
│   │       │   │       └── suggestion.ts
│   │       │   ├── icons
│   │       │   │   ├── MaximizeIcon.vue
│   │       │   │   ├── ModelIcon.vue
│   │       │   │   └── RestoreIcon.vue
│   │       │   ├── json-viewer
│   │       │   │   ├── JsonArray.ts
│   │       │   │   ├── JsonObject.ts
│   │       │   │   ├── JsonValue.ts
│   │       │   │   └── index.ts
│   │       │   ├── markdown
│   │       │   │   ├── AdmonitionNode.vue
│   │       │   │   ├── BlockquoteNode.vue
│   │       │   │   ├── CheckboxNode.vue
│   │       │   │   ├── CodeBlockNode.vue
│   │       │   │   ├── DefinitionListNode.vue
│   │       │   │   ├── EmojiNode.vue
│   │       │   │   ├── EmphasisNode.vue
│   │       │   │   ├── FootnoteNode.vue
│   │       │   │   ├── FootnoteReferenceNode.vue
│   │       │   │   ├── HardBreakNode.vue
│   │       │   │   ├── HeadingNode.vue
│   │       │   │   ├── HighlightNode.vue
│   │       │   │   ├── ImageNode.vue
│   │       │   │   ├── InlineCodeNode.vue
│   │       │   │   ├── InsertNode.vue
│   │       │   │   ├── LinkNode.vue
│   │       │   │   ├── ListItemNode.vue
│   │       │   │   ├── ListNode.vue
│   │       │   │   ├── MarkdownRenderer.vue
│   │       │   │   ├── MathBlockNode.vue
│   │       │   │   ├── MathInlineNode.vue
│   │       │   │   ├── MermaidBlockNode.vue
│   │       │   │   ├── NodeRenderer.vue
│   │       │   │   ├── ParagraphNode.vue
│   │       │   │   ├── ReferenceNode.vue
│   │       │   │   ├── StrikethroughNode.vue
│   │       │   │   ├── StrongNode.vue
│   │       │   │   ├── SubscriptNode.vue
│   │       │   │   ├── SuperscriptNode.vue
│   │       │   │   ├── TableNode.vue
│   │       │   │   ├── TextNode.vue
│   │       │   │   └── ThematicBreakNode.vue
│   │       │   ├── mcp-config
│   │       │   │   ├── const.ts
│   │       │   │   ├── index.ts
│   │       │   │   ├── mcpConfig.vue
│   │       │   │   └── mcpServerForm.vue
│   │       │   ├── mcpToolsList.vue
│   │       │   ├── message
│   │       │   │   ├── MessageBlockAction.vue
│   │       │   │   ├── MessageBlockContent.vue
│   │       │   │   ├── MessageBlockError.vue
│   │       │   │   ├── MessageBlockImage.vue
│   │       │   │   ├── MessageBlockSearch.vue
│   │       │   │   ├── MessageBlockThink.vue
│   │       │   │   ├── MessageBlockToolCall.vue
│   │       │   │   ├── MessageInfo.vue
│   │       │   │   ├── MessageItemAssistant.vue
│   │       │   │   ├── MessageItemUser.vue
│   │       │   │   ├── MessageList.vue
│   │       │   │   ├── MessageToolbar.vue
│   │       │   │   ├── ReferencePreview.vue
│   │       │   │   └── ZentSavePanel.vue
│   │       │   ├── settings
│   │       │   │   ├── AboutUsSettings.vue
│   │       │   │   ├── AddCustomProviderDialog.vue
│   │       │   │   ├── CommonSettings.vue
│   │       │   │   ├── DataSettings.vue
│   │       │   │   ├── DifyKnowledgeSettings.vue
│   │       │   │   ├── DisplaySettings.vue
│   │       │   │   ├── FastGptKnowledgeSettings.vue
│   │       │   │   ├── KnowledgeBaseSettings.vue
│   │       │   │   ├── McpSettings.vue
│   │       │   │   ├── ModelConfigItem.vue
│   │       │   │   ├── ModelProviderSettings.vue
│   │       │   │   ├── ModelProviderSettingsDetail.vue
│   │       │   │   ├── OllamaProviderSettingsDetail.vue
│   │       │   │   ├── ProviderModelList.vue
│   │       │   │   ├── RagflowKnowledgeSettings.vue
│   │       │   │   └── ShortcutSettings.vue
│   │       │   └── ui
│   │       │       ├── UpdateDialog.vue
│   │       │       ├── accordion
│   │       │       │   ├── Accordion.vue
│   │       │       │   ├── AccordionContent.vue
│   │       │       │   ├── AccordionItem.vue
│   │       │       │   ├── AccordionTrigger.vue
│   │       │       │   └── index.ts
│   │       │       ├── alert
│   │       │       │   ├── Alert.vue
│   │       │       │   ├── AlertDescription.vue
│   │       │       │   ├── AlertTitle.vue
│   │       │       │   └── index.ts
│   │       │       ├── alert-dialog
│   │       │       │   ├── AlertDialog.vue
│   │       │       │   ├── AlertDialogAction.vue
│   │       │       │   ├── AlertDialogCancel.vue
│   │       │       │   ├── AlertDialogContent.vue
│   │       │       │   ├── AlertDialogDescription.vue
│   │       │       │   ├── AlertDialogFooter.vue
│   │       │       │   ├── AlertDialogHeader.vue
│   │       │       │   ├── AlertDialogTitle.vue
│   │       │       │   ├── AlertDialogTrigger.vue
│   │       │       │   └── index.ts
│   │       │       ├── aspect-ratio
│   │       │       │   ├── AspectRatio.vue
│   │       │       │   └── index.ts
│   │       │       ├── avatar
│   │       │       │   ├── Avatar.vue
│   │       │       │   ├── AvatarFallback.vue
│   │       │       │   ├── AvatarImage.vue
│   │       │       │   └── index.ts
│   │       │       ├── badge
│   │       │       │   ├── Badge.vue
│   │       │       │   └── index.ts
│   │       │       ├── breadcrumb
│   │       │       │   ├── Breadcrumb.vue
│   │       │       │   ├── BreadcrumbEllipsis.vue
│   │       │       │   ├── BreadcrumbItem.vue
│   │       │       │   ├── BreadcrumbLink.vue
│   │       │       │   ├── BreadcrumbList.vue
│   │       │       │   ├── BreadcrumbPage.vue
│   │       │       │   ├── BreadcrumbSeparator.vue
│   │       │       │   └── index.ts
│   │       │       ├── button
│   │       │       │   ├── Button.vue
│   │       │       │   └── index.ts
│   │       │       ├── card
│   │       │       │   ├── Card.vue
│   │       │       │   ├── CardContent.vue
│   │       │       │   ├── CardDescription.vue
│   │       │       │   ├── CardFooter.vue
│   │       │       │   ├── CardHeader.vue
│   │       │       │   ├── CardTitle.vue
│   │       │       │   └── index.ts
│   │       │       ├── checkbox
│   │       │       │   ├── Checkbox.vue
│   │       │       │   └── index.ts
│   │       │       ├── collapsible
│   │       │       │   ├── collapsible.ts
│   │       │       │   └── index.ts
│   │       │       ├── context-menu
│   │       │       │   ├── ContextMenu.vue
│   │       │       │   ├── ContextMenuCheckboxItem.vue
│   │       │       │   ├── ContextMenuContent.vue
│   │       │       │   ├── ContextMenuGroup.vue
│   │       │       │   ├── ContextMenuItem.vue
│   │       │       │   ├── ContextMenuLabel.vue
│   │       │       │   ├── ContextMenuPortal.vue
│   │       │       │   ├── ContextMenuRadioGroup.vue
│   │       │       │   ├── ContextMenuRadioItem.vue
│   │       │       │   ├── ContextMenuSeparator.vue
│   │       │       │   ├── ContextMenuShortcut.vue
│   │       │       │   ├── ContextMenuSub.vue
│   │       │       │   ├── ContextMenuSubContent.vue
│   │       │       │   ├── ContextMenuSubTrigger.vue
│   │       │       │   ├── ContextMenuTrigger.vue
│   │       │       │   └── index.ts
│   │       │       ├── dialog
│   │       │       │   ├── Dialog.vue
│   │       │       │   ├── DialogClose.vue
│   │       │       │   ├── DialogContent.vue
│   │       │       │   ├── DialogDescription.vue
│   │       │       │   ├── DialogFooter.vue
│   │       │       │   ├── DialogHeader.vue
│   │       │       │   ├── DialogScrollContent.vue
│   │       │       │   ├── DialogTitle.vue
│   │       │       │   ├── DialogTrigger.vue
│   │       │       │   └── index.ts
│   │       │       ├── dropdown-menu
│   │       │       │   ├── DropdownMenu.vue
│   │       │       │   ├── DropdownMenuCheckboxItem.vue
│   │       │       │   ├── DropdownMenuContent.vue
│   │       │       │   ├── DropdownMenuGroup.vue
│   │       │       │   ├── DropdownMenuItem.vue
│   │       │       │   ├── DropdownMenuLabel.vue
│   │       │       │   ├── DropdownMenuRadioGroup.vue
│   │       │       │   ├── DropdownMenuRadioItem.vue
│   │       │       │   ├── DropdownMenuSeparator.vue
│   │       │       │   ├── DropdownMenuShortcut.vue
│   │       │       │   ├── DropdownMenuSub.vue
│   │       │       │   ├── DropdownMenuSubContent.vue
│   │       │       │   ├── DropdownMenuSubTrigger.vue
│   │       │       │   ├── DropdownMenuTrigger.vue
│   │       │       │   └── index.ts
│   │       │       ├── emoji-picker
│   │       │       │   ├── EmojiPicker.vue
│   │       │       │   └── index.ts
│   │       │       ├── hover-card
│   │       │       │   ├── HoverCard.vue
│   │       │       │   ├── HoverCardContent.vue
│   │       │       │   ├── HoverCardTrigger.vue
│   │       │       │   └── index.ts
│   │       │       ├── input
│   │       │       │   ├── Input.vue
│   │       │       │   └── index.ts
│   │       │       ├── label
│   │       │       │   ├── Label.vue
│   │       │       │   └── index.ts
│   │       │       ├── menubar
│   │       │       │   ├── Menubar.vue
│   │       │       │   ├── MenubarCheckboxItem.vue
│   │       │       │   ├── MenubarContent.vue
│   │       │       │   ├── MenubarGroup.vue
│   │       │       │   ├── MenubarItem.vue
│   │       │       │   ├── MenubarLabel.vue
│   │       │       │   ├── MenubarMenu.vue
│   │       │       │   ├── MenubarRadioGroup.vue
│   │       │       │   ├── MenubarRadioItem.vue
│   │       │       │   ├── MenubarSeparator.vue
│   │       │       │   ├── MenubarShortcut.vue
│   │       │       │   ├── MenubarSub.vue
│   │       │       │   ├── MenubarSubContent.vue
│   │       │       │   ├── MenubarSubTrigger.vue
│   │       │       │   ├── MenubarTrigger.vue
│   │       │       │   └── index.ts
│   │       │       ├── navigation-menu
│   │       │       │   ├── NavigationMenu.vue
│   │       │       │   ├── NavigationMenuContent.vue
│   │       │       │   ├── NavigationMenuIndicator.vue
│   │       │       │   ├── NavigationMenuItem.vue
│   │       │       │   ├── NavigationMenuLink.vue
│   │       │       │   ├── NavigationMenuList.vue
│   │       │       │   ├── NavigationMenuTrigger.vue
│   │       │       │   ├── NavigationMenuViewport.vue
│   │       │       │   └── index.ts
│   │       │       ├── number-field
│   │       │       │   ├── NumberField.vue
│   │       │       │   ├── NumberFieldContent.vue
│   │       │       │   ├── NumberFieldDecrement.vue
│   │       │       │   ├── NumberFieldIncrement.vue
│   │       │       │   ├── NumberFieldInput.vue
│   │       │       │   └── index.ts
│   │       │       ├── popover
│   │       │       │   ├── Popover.vue
│   │       │       │   ├── PopoverContent.vue
│   │       │       │   ├── PopoverTrigger.vue
│   │       │       │   └── index.ts
│   │       │       ├── progress
│   │       │       │   ├── Progress.vue
│   │       │       │   └── index.ts
│   │       │       ├── radio-group
│   │       │       │   ├── RadioGroup.vue
│   │       │       │   ├── RadioGroupItem.vue
│   │       │       │   └── index.ts
│   │       │       ├── scroll-area
│   │       │       │   ├── ScrollArea.vue
│   │       │       │   ├── ScrollBar.vue
│   │       │       │   └── index.ts
│   │       │       ├── select
│   │       │       │   ├── Select.vue
│   │       │       │   ├── SelectContent.vue
│   │       │       │   ├── SelectGroup.vue
│   │       │       │   ├── SelectItem.vue
│   │       │       │   ├── SelectItemText.vue
│   │       │       │   ├── SelectLabel.vue
│   │       │       │   ├── SelectScrollDownButton.vue
│   │       │       │   ├── SelectScrollUpButton.vue
│   │       │       │   ├── SelectSeparator.vue
│   │       │       │   ├── SelectTrigger.vue
│   │       │       │   ├── SelectValue.vue
│   │       │       │   └── index.ts
│   │       │       ├── separator
│   │       │       │   ├── Separator.vue
│   │       │       │   └── index.ts
│   │       │       ├── sheet
│   │       │       │   ├── Sheet.vue
│   │       │       │   ├── SheetClose.vue
│   │       │       │   ├── SheetContent.vue
│   │       │       │   ├── SheetDescription.vue
│   │       │       │   ├── SheetFooter.vue
│   │       │       │   ├── SheetHeader.vue
│   │       │       │   ├── SheetTitle.vue
│   │       │       │   ├── SheetTrigger.vue
│   │       │       │   └── index.ts
│   │       │       ├── sidebar
│   │       │       │   ├── Sidebar.vue
│   │       │       │   ├── SidebarContent.vue
│   │       │       │   ├── SidebarFooter.vue
│   │       │       │   ├── SidebarGroup.vue
│   │       │       │   ├── SidebarGroupAction.vue
│   │       │       │   ├── SidebarGroupContent.vue
│   │       │       │   ├── SidebarGroupLabel.vue
│   │       │       │   ├── SidebarHeader.vue
│   │       │       │   ├── SidebarInput.vue
│   │       │       │   ├── SidebarInset.vue
│   │       │       │   ├── SidebarMenu.vue
│   │       │       │   ├── SidebarMenuAction.vue
│   │       │       │   ├── SidebarMenuBadge.vue
│   │       │       │   ├── SidebarMenuButton.vue
│   │       │       │   ├── SidebarMenuButtonChild.vue
│   │       │       │   ├── SidebarMenuItem.vue
│   │       │       │   ├── SidebarMenuSkeleton.vue
│   │       │       │   ├── SidebarMenuSub.vue
│   │       │       │   ├── SidebarMenuSubButton.vue
│   │       │       │   ├── SidebarMenuSubItem.vue
│   │       │       │   ├── SidebarProvider.vue
│   │       │       │   ├── SidebarRail.vue
│   │       │       │   ├── SidebarSeparator.vue
│   │       │       │   ├── SidebarTrigger.vue
│   │       │       │   ├── index.ts
│   │       │       │   └── utils.ts
│   │       │       ├── skeleton
│   │       │       │   ├── Skeleton.vue
│   │       │       │   └── index.ts
│   │       │       ├── slider
│   │       │       │   ├── Slider.vue
│   │       │       │   └── index.ts
│   │       │       ├── switch
│   │       │       │   ├── Switch.vue
│   │       │       │   └── index.ts
│   │       │       ├── tabs
│   │       │       │   ├── Tab.vue
│   │       │       │   ├── TabGroup.vue
│   │       │       │   ├── TabList.vue
│   │       │       │   ├── TabPanel.vue
│   │       │       │   ├── TabPanels.vue
│   │       │       │   └── index.ts
│   │       │       ├── textarea
│   │       │       │   ├── Textarea.vue
│   │       │       │   └── index.ts
│   │       │       ├── toast
│   │       │       │   ├── Toast.vue
│   │       │       │   ├── ToastAction.vue
│   │       │       │   ├── ToastClose.vue
│   │       │       │   ├── ToastDescription.vue
│   │       │       │   ├── ToastProvider.vue
│   │       │       │   ├── ToastTitle.vue
│   │       │       │   ├── ToastViewport.vue
│   │       │       │   ├── Toaster.vue
│   │       │       │   ├── index.ts
│   │       │       │   └── use-toast.ts
│   │       │       ├── toggle
│   │       │       │   ├── Toggle.vue
│   │       │       │   └── index.ts
│   │       │       └── tooltip
│   │       │           ├── Tooltip.vue
│   │       │           ├── TooltipContent.vue
│   │       │           ├── TooltipProvider.vue
│   │       │           ├── TooltipTrigger.vue
│   │       │           └── index.ts
│   │       ├── composables
│   │       │   ├── useArtifacts.ts
│   │       │   └── usePresenter.ts
│   │       ├── env.d.ts
│   │       ├── events.ts
│   │       ├── i18n
│   │       │   ├── en-US
│   │       │   │   ├── about.json
│   │       │   │   ├── artifacts.json
│   │       │   │   ├── chat.json
│   │       │   │   ├── common.json
│   │       │   │   ├── components.json
│   │       │   │   ├── dialog.json
│   │       │   │   ├── index.ts
│   │       │   │   ├── mcp.json
│   │       │   │   ├── model.json
│   │       │   │   ├── newThread.json
│   │       │   │   ├── routes.json
│   │       │   │   ├── settings.json
│   │       │   │   ├── sync.json
│   │       │   │   ├── thread.json
│   │       │   │   ├── toolCall.json
│   │       │   │   ├── update.json
│   │       │   │   └── welcome.json
│   │       │   ├── fr-FR
│   │       │   │   ├── about.json
│   │       │   │   ├── artifacts.json
│   │       │   │   ├── chat.json
│   │       │   │   ├── common.json
│   │       │   │   ├── components.json
│   │       │   │   ├── dialog.json
│   │       │   │   ├── index.ts
│   │       │   │   ├── mcp.json
│   │       │   │   ├── model.json
│   │       │   │   ├── newThread.json
│   │       │   │   ├── routes.json
│   │       │   │   ├── settings.json
│   │       │   │   ├── sync.json
│   │       │   │   ├── thread.json
│   │       │   │   ├── toolCall.json
│   │       │   │   ├── update.json
│   │       │   │   └── welcome.json
│   │       │   ├── index.ts
│   │       │   ├── ja-JP
│   │       │   │   ├── about.json
│   │       │   │   ├── artifacts.json
│   │       │   │   ├── chat.json
│   │       │   │   ├── common.json
│   │       │   │   ├── components.json
│   │       │   │   ├── dialog.json
│   │       │   │   ├── index.ts
│   │       │   │   ├── mcp.json
│   │       │   │   ├── model.json
│   │       │   │   ├── newThread.json
│   │       │   │   ├── routes.json
│   │       │   │   ├── settings.json
│   │       │   │   ├── sync.json
│   │       │   │   ├── thread.json
│   │       │   │   ├── toolCall.json
│   │       │   │   ├── update.json
│   │       │   │   └── welcome.json
│   │       │   ├── ko-KR
│   │       │   │   ├── about.json
│   │       │   │   ├── artifacts.json
│   │       │   │   ├── chat.json
│   │       │   │   ├── common.json
│   │       │   │   ├── components.json
│   │       │   │   ├── dialog.json
│   │       │   │   ├── index.ts
│   │       │   │   ├── mcp.json
│   │       │   │   ├── model.json
│   │       │   │   ├── newThread.json
│   │       │   │   ├── routes.json
│   │       │   │   ├── settings.json
│   │       │   │   ├── sync.json
│   │       │   │   ├── thread.json
│   │       │   │   ├── toolCall.json
│   │       │   │   ├── update.json
│   │       │   │   └── welcome.json
│   │       │   ├── ru-RU
│   │       │   │   ├── about.json
│   │       │   │   ├── artifacts.json
│   │       │   │   ├── chat.json
│   │       │   │   ├── common.json
│   │       │   │   ├── components.json
│   │       │   │   ├── dialog.json
│   │       │   │   ├── index.ts
│   │       │   │   ├── mcp.json
│   │       │   │   ├── model.json
│   │       │   │   ├── newThread.json
│   │       │   │   ├── routes.json
│   │       │   │   ├── settings.json
│   │       │   │   ├── sync.json
│   │       │   │   ├── thread.json
│   │       │   │   ├── toolCall.json
│   │       │   │   ├── update.json
│   │       │   │   └── welcome.json
│   │       │   ├── zh-CN
│   │       │   │   ├── about.json
│   │       │   │   ├── artifacts.json
│   │       │   │   ├── chat.json
│   │       │   │   ├── common.json
│   │       │   │   ├── components.json
│   │       │   │   ├── dialog.json
│   │       │   │   ├── index.ts
│   │       │   │   ├── mcp.json
│   │       │   │   ├── model.json
│   │       │   │   ├── newThread.json
│   │       │   │   ├── routes.json
│   │       │   │   ├── settings.json
│   │       │   │   ├── sync.json
│   │       │   │   ├── thread.json
│   │       │   │   ├── toolCall.json
│   │       │   │   ├── update.json
│   │       │   │   └── welcome.json
│   │       │   ├── zh-HK
│   │       │   │   ├── about.json
│   │       │   │   ├── artifacts.json
│   │       │   │   ├── chat.json
│   │       │   │   ├── common.json
│   │       │   │   ├── components.json
│   │       │   │   ├── dialog.json
│   │       │   │   ├── index.ts
│   │       │   │   ├── mcp.json
│   │       │   │   ├── model.json
│   │       │   │   ├── newThread.json
│   │       │   │   ├── routes.json
│   │       │   │   ├── settings.json
│   │       │   │   ├── sync.json
│   │       │   │   ├── thread.json
│   │       │   │   ├── toolCall.json
│   │       │   │   ├── update.json
│   │       │   │   └── welcome.json
│   │       │   └── zh-TW
│   │       │       ├── about.json
│   │       │       ├── artifacts.json
│   │       │       ├── chat.json
│   │       │       ├── common.json
│   │       │       ├── components.json
│   │       │       ├── dialog.json
│   │       │       ├── index.ts
│   │       │       ├── mcp.json
│   │       │       ├── model.json
│   │       │       ├── newThread.json
│   │       │       ├── routes.json
│   │       │       ├── settings.json
│   │       │       ├── sync.json
│   │       │       ├── thread.json
│   │       │       ├── toolCall.json
│   │       │       ├── update.json
│   │       │       └── welcome.json
│   │       ├── lib
│   │       │   ├── code.detect.ts
│   │       │   ├── code.lang.ts
│   │       │   ├── code.theme.ts
│   │       │   ├── float.cursor.ts
│   │       │   ├── image.ts
│   │       │   ├── markdown-parser
│   │       │   │   ├── blockquote-processor.ts
│   │       │   │   ├── index.ts
│   │       │   │   ├── inline-parsers
│   │       │   │   │   ├── checkbox-parser.ts
│   │       │   │   │   ├── emoji-parser.ts
│   │       │   │   │   ├── emphasis-parser.ts
│   │       │   │   │   ├── fence-parser.ts
│   │       │   │   │   ├── footnote-ref-parser.ts
│   │       │   │   │   ├── hardbreak-parser.ts
│   │       │   │   │   ├── highlight-parser.ts
│   │       │   │   │   ├── image-parser.ts
│   │       │   │   │   ├── index.ts
│   │       │   │   │   ├── inline-code-parser.ts
│   │       │   │   │   ├── insert-parser.ts
│   │       │   │   │   ├── link-parser.ts
│   │       │   │   │   ├── math-inline-parser.ts
│   │       │   │   │   ├── reference-parser.ts
│   │       │   │   │   ├── strikethrough-parser.ts
│   │       │   │   │   ├── strong-parser.ts
│   │       │   │   │   ├── subscript-parser.ts
│   │       │   │   │   ├── superscript-parser.ts
│   │       │   │   │   └── text-parser.ts
│   │       │   │   ├── node-parsers
│   │       │   │   │   ├── admonition-parser.ts
│   │       │   │   │   ├── blockquote-parser.ts
│   │       │   │   │   ├── code-block-parser.ts
│   │       │   │   │   ├── definition-list-parser.ts
│   │       │   │   │   ├── footnote-parser.ts
│   │       │   │   │   ├── hardbreak-parser.ts
│   │       │   │   │   ├── heading-parser.ts
│   │       │   │   │   ├── list-parser.ts
│   │       │   │   │   ├── math-block-parser.ts
│   │       │   │   │   ├── paragraph-parser.ts
│   │       │   │   │   ├── table-parser.ts
│   │       │   │   │   └── thematic-break-parser.ts
│   │       │   │   └── types.ts
│   │       │   ├── markdown.helper.ts
│   │       │   ├── utils.ts
│   │       │   └── watermark.ts
│   │       ├── main.ts
│   │       ├── router
│   │       │   └── index.ts
│   │       ├── stores
│   │       │   ├── agent.ts
│   │       │   ├── artifact.ts
│   │       │   ├── chat.ts
│   │       │   ├── mcp.ts
│   │       │   ├── organization.ts
│   │       │   ├── reference.ts
│   │       │   ├── settings.ts
│   │       │   ├── sync.ts
│   │       │   ├── team.ts
│   │       │   ├── theme.ts
│   │       │   ├── upgrade.ts
│   │       │   └── zent.ts
│   │       └── views
│   │           ├── AutomationTabView.vue
│   │           ├── ChatTabView.vue
│   │           ├── MarketTabView.vue
│   │           ├── SettingsTabView.vue
│   │           └── WelcomeView.vue
│   ├── shared
│   │   ├── chat.d.ts
│   │   ├── config.dict.ts
│   │   ├── i18n.ts
│   │   ├── logger.ts
│   │   └── presenter.d.ts
│   └── types
│       └── electron-store.d.ts
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.node.json
├── tsconfig.web.json
└── yarn.lock
```

Process finished with exit code 0

### API usage

API 를 쓸 일이 있을 때는 아래와 같이 api/index.ts 에 있는 apiRequest 를 이용한다.

await apiRequest(`/zentrun-zent/`, 'PUT', { slug: zent?.slug, agent: selectedAgent.value.slug });

### Vue Components

- Use Vue 3 Composition API with `<script setup>` syntax
- Component structure should follow this order:
  - Component imports
  - Props definition
  - Emits definition
  - Reactive variables
  - Computed properties
  - Methods
  - Lifecycle hooks

### TypeScript Usage

- Ensure proper typing for all variables and functions
- Use interface or type for complex object structures
- Maintain separate type definition files in the `/src/types` directory

### State Management

- Use Pinia for state management
- Follow a modular store structure

### Event Handling

- Use the provided event bus system for cross-component communication
- Main-to-renderer communication should use the established Electron IPC patterns

### Internationalization

- Use Vue I18n for all user-facing strings
- Define translations in separate language files

### Component Props

- Always define prop types explicitly
- Use required: true for mandatory props
- Provide default values for optional props

## Best Practices

1. **Error Handling**: Implement proper error handling and logging
2. **Code Comments**: Add meaningful comments for complex logic
3. **Naming Conventions**:
   - Use PascalCase for component names
   - Use camelCase for variables, properties, and functions
   - Use kebab-case for event names
4. **File Organization**: Keep related files together
5. **Testing**: Write tests for critical functionality

## Development Workflow

1. Understand the component architecture before making changes
2. Use TypeScript features to ensure type safety
3. Make use of the existing helper functions and utilities
4. Follow the established patterns for component communication

## Build and Deployment

The project uses Electron for cross-platform desktop application development with the following tools:
- Vue 3.5.13 for UI components
- TypeScript 5.8.3 for type safety
- Pinia 3.0.2 for state management
- Vite 6.3.4 for build tooling

Always ensure that your changes pass all linting and type checking before submitting.
