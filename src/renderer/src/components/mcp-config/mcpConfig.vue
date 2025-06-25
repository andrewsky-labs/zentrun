<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useMcpStore } from '@/stores/mcp'
import { useSettingsStore } from '@/stores/settings'
import type {
  MCPServerConfig,
  MCPToolDefinition,
  PromptListEntry,
  ResourceListEntry
} from '@shared/presenter'
import { useI18n } from 'vue-i18n'
import McpServerForm from './mcpServerForm.vue'
import McpInstallDialog from '../dialogs/mcp/install.vue'
import { useToast } from '../ui/toast'
import { useRoute, useRouter } from 'vue-router'
import { apiRequest } from '@/api'
import { Input } from '@/components/ui/input'
// Assuming other necessary imports like `Input`, `ScrollArea`, `Icon`, `Button` and `t` are already present or globally available.

// API data for MCP Servers
const mcpServers = ref<any[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

// Pagination
const currentPage = ref(0)
const itemsPerPage = ref(10)
const totalItems = ref(0)
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))

// Compute visible page numbers (limited to 5)
const visiblePageNumbers = computed(() => {
  if (totalPages.value <= 5) {
    // If there are 5 or fewer pages, show all of them
    return Array.from({ length: totalPages.value }, (_, i) => i + 1)
  }

  // Calculate the range of visible pages
  let startPage = Math.max(currentPage.value - 1, 1)
  let endPage = Math.min(startPage + 4, totalPages.value)

  // Adjust if we're near the end
  if (endPage === totalPages.value) {
    startPage = Math.max(endPage - 4, 1)
  }

  return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)
})

// Search
const searchQuery = ref('')
const isDescending = ref(false)

// Fetch MCP servers from API
const fetchMcpServers = async () => {
  isLoading.value = true
  error.value = null

  try {
    const params = {
      count: itemsPerPage.value,
      page: currentPage.value,
      desc: isDescending.value,
      searching: searchQuery.value
    }

    // Convert params to query string
    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&')

    const result = await apiRequest(`/zentrun-mcps/?${queryString}`)
    console.log("mcps result", result)
    mcpServers.value = result.mcps || []
    totalItems.value = result.totalLength || 0
  } catch (err) {
    console.error('Failed to fetch MCP servers:', err)
    error.value = err instanceof Error ? err.message : 'Failed to fetch MCP servers'
    mcpServers.value = []
  } finally {
    isLoading.value = false
  }
}

// Handle page change
const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchMcpServers()
}

// Handle search
const handleSearch = () => {
  currentPage.value = 0 // Reset to first page when searching
  fetchMcpServers()
}

// Handle sort direction change
const toggleSortDirection = () => {
  isDescending.value = !isDescending.value
  fetchMcpServers()
}

// Load data on component mount
onMounted(() => {
  fetchMcpServers()
})
// No mock data needed anymore

const activeFilter = ref('Latest'); // Default filter

const serverFilters = ['Featured', 'Latest', 'Clients', 'Hosted', 'Official', 'Innovations'];

// MCP 서버 상세 모달 상태
const isServerDetailModalOpen = ref(false)
const selectedServerDetail = ref(null)

// 안스톨 다이얼로그 상태
const isInstallDialogOpen = ref(false)

// Computed property to parse server data for installation
const serverDataForInstall = computed(() => {
  if (!selectedServerDetail.value?.data) return {}

  try {
    const parsedData = selectedServerDetail.value.data;
    let serverName;
    let serverData;
    if (!parsedData.mcpServers) {
      serverName = Object.keys(parsedData)[0]
      serverData = parsedData[serverName]
    } else {
      serverName = Object.keys(parsedData.mcpServers)[0]
      serverData = parsedData.mcpServers[serverName]
    }


    if (!serverName) return {}

    console.log('Server data for installation:', serverData)
    return serverData
  } catch (error) {
    console.error('Error parsing server data:', error)
    return {}
  }
})

// MCP 서버 카드 클릭 시 모달 오픈 (mock data)
const openServerDetailModal = (server) => {
  console.log('openServerDetailModal', server)
  selectedServerDetail.value = server
  // 실제 연동 시 server 객체로 fetch 하면 됨
//   selectedServerDetail.value = {
//     "id": 1,
//     "created_at": "2025-04-07 09:59:21",
//     "updated_at": "2025-04-13 23:01:07",
//     "name": "Notion",
//     "by": "SkyMCP",
//     "user": null,
//     "type": null,
//     "description": "Notion MCP Server is a Model Context Protocol (MCP) server implementation that enables AI assistants to interact with Notion's API. This production-ready server provides a complete set of tools.",
//     "image_url": "https://d1w4uf5gel2p4w.cloudfront.net/notion-logo.png",
//     "command": null,
//     "fields": "null",
//     "categories": "null",
//     "tags": "[\"notion\", \"management\"]",
//     "isDisabled": null,
//     "usedCount": null,
//     "likeCount": null,
//     "data": "{\n" +
//       "  \"mcpServers\": {\n" +
//       "    \"context7\": {\n" +
//       "      \"command\": \"npx\",\n" +
//       "      \"args\": [\n" +
//       "        \"-y\",\n" +
//       "        \"@upstash/context7-mcp@latest\"\n" +
//       "      ]\n" +
//       "    }\n" +
//       "  }\n" +
//       "}",
//     "overview": `<div class="w-full md:flex-1"><div class="flex items-center gap-2 my-4"><a class="cursor-pointer py-2 px-4 font-medium flex items-center text-primary border-b-2 border-primary" href="?"><svg class="w-4 h-4 mr-1" fill="currentColor" height="1em" stroke="currentColor" stroke-width="0" style="cursor:default" viewbox="0 0 24 24" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20ZM11 7H13V9H11V7ZM11 11H13V17H11V11Z"></path></svg>Overview</a><a class="cursor-pointer py-2 px-4 font-medium flex items-center" href="?tab=content"><svg class="w-4 h-4 mr-1" fill="currentColor" height="1em" stroke="currentColor" stroke-width="0" style="cursor:default" viewbox="0 0 24 24" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M21 8V20.9932C21 21.5501 20.5552 22 20.0066 22H3.9934C3.44495 22 3 21.556 3 21.0082V2.9918C3 2.45531 3.4487 2 4.00221 2H14.9968L21 8ZM19 9H14V4H5V20H19V9ZM8 7H11V9H8V7ZM8 11H16V13H8V11ZM8 15H16V17H8V15Z"></path></svg>Content</a></div><div class="rounded-lg border bg-card text-card-foreground shadow-sm"><div class="flex flex-col space-y-1.5 p-6"><div class="text-2xl font-semibold leading-none tracking-tight">Overview</div></div><div class="p-6 pt-0"><div data-color-mode="light"><div class="wmde-markdown wmde-markdown-color markdown"><h2 id="what-is-crawl4ai-web-scraper-mcp-server"><a aria-hidden="true" class="anchor" href="#what-is-crawl4ai-web-scraper-mcp-server" node="[object Object]" rel="noopener noreferrer nofollow" tabindex="-1" target="_blank"><svg aria-hidden="true" class="octicon octicon-link" height="16" version="1.1" viewbox="0 0 16 16" width="16"><path d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z" fill-rule="evenodd"></path></svg></a>what is Crawl4AI Web Scraper MCP Server?</h2>
// <p>Crawl4AI Web Scraper MCP Server is a server that utilizes the crawl4ai library for web scraping and intelligent content extraction, designed for integration with AI agents.</p>
// <h2 id="how-to-use-crawl4ai-web-scraper-mcp-server"><a aria-hidden="true" class="anchor" href="#how-to-use-crawl4ai-web-scraper-mcp-server" node="[object Object]" rel="noopener noreferrer nofollow" tabindex="-1" target="_blank"><svg aria-hidden="true" class="octicon octicon-link" height="16" version="1.1" viewbox="0 0 16 16" width="16"><path d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z" fill-rule="evenodd"></path></svg></a>how to use Crawl4AI Web Scraper MCP Server?</h2>
// <p>To use the server, you can run it locally or via Docker. After setting up the environment and API keys, you can interact with it through various MCP tools to scrape web pages and extract content.</p>
// <h2 id="key-features-of-crawl4ai-web-scraper-mcp-server"><a aria-hidden="true" class="anchor" href="#key-features-of-crawl4ai-web-scraper-mcp-server" node="[object Object]" rel="noopener noreferrer nofollow" tabindex="-1" target="_blank"><svg aria-hidden="true" class="octicon octicon-link" height="16" version="1.1" viewbox="0 0 16 16" width="16"><path d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z" fill-rule="evenodd"></path></svg></a>key features of Crawl4AI Web Scraper MCP Server?</h2>
// <ul>
// <li>Exposes MCP tools for web interaction, including <code>scrape_url</code>, <code>extract_text_by_query</code>, and <code>smart_extract</code>.</li>
// <li>Configurable via environment variables for API keys.</li>
// <li>Supports Docker for easy deployment.</li>
// <li>Communicates over Server-Sent Events (SSE).</li>
// </ul>
// <h2 id="use-cases-of-crawl4ai-web-scraper-mcp-server"><a aria-hidden="true" class="anchor" href="#use-cases-of-crawl4ai-web-scraper-mcp-server" node="[object Object]" rel="noopener noreferrer nofollow" tabindex="-1" target="_blank"><svg aria-hidden="true" class="octicon octicon-link" height="16" version="1.1" viewbox="0 0 16 16" width="16"><path d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z" fill-rule="evenodd"></path></svg></a>use cases of Crawl4AI Web Scraper MCP Server?</h2>
// <ol>
// <li>Scraping web pages to retrieve content in Markdown format.</li>
// <li>Extracting specific text snippets based on user queries.</li>
// <li>Using LLMs to intelligently extract structured information from web pages.</li>
// </ol>
// <h2 id="faq-from-crawl4ai-web-scraper-mcp-server"><a aria-hidden="true" class="anchor" href="#faq-from-crawl4ai-web-scraper-mcp-server" node="[object Object]" rel="noopener noreferrer nofollow" tabindex="-1" target="_blank"><svg aria-hidden="true" class="octicon octicon-link" height="16" version="1.1" viewbox="0 0 16 16" width="16"><path d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z" fill-rule="evenodd"></path></svg></a>FAQ from Crawl4AI Web Scraper MCP Server?</h2>
// <ul>
// <li>What is the purpose of the <code>smart_extract</code> tool?</li>
// </ul>
// <blockquote>
// <p>It allows users to extract specific information from a webpage based on natural language instructions.</p>
// </blockquote>
// <ul>
// <li>Is Docker required to run the server?</li>
// </ul>
// <blockquote>
// <p>No, Docker is optional; you can also run the server locally with Python.</p>
// </blockquote>
// <ul>
// <li>What API keys are needed?</li>
// </ul>
// <blockquote>
// <p>The <code>GOOGLE_API_KEY</code> is required for the <code>smart_extract</code> tool to function.</p>
// </blockquote></div></div></div></div><div class="w-full mt-10"></div></div>`,
//     "content": `<div class="w-full md:flex-1"><div class="flex items-center gap-2 my-4"><a class="cursor-pointer py-2 px-4 font-medium flex items-center" href="?"><svg class="w-4 h-4 mr-1" fill="currentColor" height="1em" stroke="currentColor" stroke-width="0" style="cursor:default" viewbox="0 0 24 24" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20ZM11 7H13V9H11V7ZM11 11H13V17H11V11Z"></path></svg>Overview</a><a class="cursor-pointer py-2 px-4 font-medium flex items-center text-primary border-b-2 border-primary" href="?tab=content"><svg class="w-4 h-4 mr-1" fill="currentColor" height="1em" stroke="currentColor" stroke-width="0" style="cursor:default" viewbox="0 0 24 24" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M21 8V20.9932C21 21.5501 20.5552 22 20.0066 22H3.9934C3.44495 22 3 21.556 3 21.0082V2.9918C3 2.45531 3.4487 2 4.00221 2H14.9968L21 8ZM19 9H14V4H5V20H19V9ZM8 7H11V9H8V7ZM8 11H16V13H8V11ZM8 15H16V17H8V15Z"></path></svg>Content</a></div><div class="rounded-lg border bg-card text-card-foreground shadow-sm"><div class="flex flex-col space-y-1.5 p-6"><div class="text-2xl font-semibold leading-none tracking-tight">Content</div></div><div class="p-6 pt-0"><div data-color-mode="light"><div class="wmde-markdown wmde-markdown-color markdown"><h1 id="crawl4ai-web-scraper-mcp-server"><a aria-hidden="true" class="anchor" href="#crawl4ai-web-scraper-mcp-server" node="[object Object]" rel="noopener noreferrer nofollow" tabindex="-1" target="_blank"><svg aria-hidden="true" class="octicon octicon-link" height="16" version="1.1" viewbox="0 0 16 16" width="16"><path d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z" fill-rule="evenodd"></path></svg></a>Crawl4AI Web Scraper MCP Server</h1>
// <p><a href="https://opensource.org/licenses/MIT" node="[object Object]" rel="noopener noreferrer nofollow" target="_blank"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg"/></a> </p>
// <p>This project provides an MCP (Model Context Protocol) server that uses the <strong><a href="https://github.com/unclecode/crawl4ai" node="[object Object]" rel="noopener noreferrer nofollow" target="_blank">crawl4ai</a></strong> library to perform web scraping and intelligent content extraction tasks. It allows AI agents (like Claude, or agents built with LangChain/LangGraph) to interact with web pages, retrieve content, search for specific text, and perform LLM-based extraction based on natural language instructions.</p>
// <p>This server uses:</p>
// <ul>
// <li><strong><a href="https://github.com/model-context-protocol/mcp-py/blob/main/docs/fastmcp.md" node="[object Object]" rel="noopener noreferrer nofollow" target="_blank">FastMCP</a>:</strong> For creating the MCP server endpoint.</li>
// <li><strong><a href="https://github.com/unclecode/crawl4ai" node="[object Object]" rel="noopener noreferrer nofollow" target="_blank">crawl4ai</a>:</strong> For the core web crawling and extraction logic.</li>
// <li><strong><a href="https://github.com/theskumar/python-dotenv" node="[object Object]" rel="noopener noreferrer nofollow" target="_blank">dotenv</a>:</strong> For managing API keys via a <code>.env</code> file.</li>
// <li><strong>(Optional) Docker:</strong> For containerized deployment, bundling Python and dependencies.</li>
// </ul>
// <h2 id="features"><a aria-hidden="true" class="anchor" href="#features" node="[object Object]" rel="noopener noreferrer nofollow" tabindex="-1" target="_blank"><svg aria-hidden="true" class="octicon octicon-link" height="16" version="1.1" viewbox="0 0 16 16" width="16"><path d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z" fill-rule="evenodd"></path></svg></a>Features</h2>
// <ul>
// <li>Exposes MCP tools for web interaction:
// <ul>
// <li><code>scrape_url</code>: Get the full content of a webpage in Markdown format.</li>
// <li><code>extract_text_by_query</code>: Find specific text snippets on a page based on a query.</li>
// <li><code>smart_extract</code>: Use an LLM (currently Google Gemini) to extract structured information based on instructions.</li>
// </ul>
// </li>
// <li>Configurable via environment variables (API keys).</li>
// <li>Includes Docker configuration (<code>Dockerfile</code>) for easy, self-contained deployment.</li>
// <li>Communicates over Server-Sent Events (SSE) on port 8002 by default.</li>
// </ul>
// <h2 id="exposed-mcp-tools"><a aria-hidden="true" class="anchor" href="#exposed-mcp-tools" node="[object Object]" rel="noopener noreferrer nofollow" tabindex="-1" target="_blank"><svg aria-hidden="true" class="octicon octicon-link" height="16" version="1.1" viewbox="0 0 16 16" width="16"><path d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z" fill-rule="evenodd"></path></svg></a>Exposed MCP Tools</h2>
// <h3 id="scrape_url"><a aria-hidden="true" class="anchor" href="#scrape_url" node="[object Object]" rel="noopener noreferrer nofollow" tabindex="-1" target="_blank"><svg aria-hidden="true" class="octicon octicon-link" height="16" version="1.1" viewbox="0 0 16 16" width="16"><path d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z" fill-rule="evenodd"></path></svg></a><code>scrape_url</code></h3>
// <p>Scrape a webpage and return its content in Markdown format.</p>
// <p><strong>Arguments:</strong></p>
// <ul>
// <li><code>url</code> (str, <strong>required</strong>): The URL of the webpage to scrape.</li>
// </ul>
// <p><strong>Returns:</strong></p>
// <ul>
// <li>(str): The webpage content in Markdown format, or an error message.</li>
// </ul>
// <h3 id="extract_text_by_query"><a aria-hidden="true" class="anchor" href="#extract_text_by_query" node="[object Object]" rel="noopener noreferrer nofollow" tabindex="-1" target="_blank"><svg aria-hidden="true" class="octicon octicon-link" height="16" version="1.1" viewbox="0 0 16 16" width="16"><path d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z" fill-rule="evenodd"></path></svg></a><code>extract_text_by_query</code></h3>
// <p>Extract relevant text snippets from a webpage that contain a specific search query. Returns up to the first 5 matches found.</p>
// <p><strong>Arguments:</strong></p>
// <ul>
// <li><code>url</code> (str, <strong>required</strong>): The URL of the webpage to search within.</li>
// <li><code>query</code> (str, <strong>required</strong>): The text query to search for (case-insensitive).</li>
// <li><code>context_size</code> (int, <em>optional</em>): The number of characters to include before and after the matched query text in each snippet. Defaults to <code>300</code>.</li>
// </ul>
// <p><strong>Returns:</strong></p>
// <ul>
// <li>(str): A formatted string containing the found text snippets or a message indicating no matches were found, or an error message.</li>
// </ul>
// <h3 id="smart_extract"><a aria-hidden="true" class="anchor" href="#smart_extract" node="[object Object]" rel="noopener noreferrer nofollow" tabindex="-1" target="_blank"><svg aria-hidden="true" class="octicon octicon-link" height="16" version="1.1" viewbox="0 0 16 16" width="16"><path d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z" fill-rule="evenodd"></path></svg></a><code>smart_extract</code></h3>
// <p>Intelligently extract specific information from a webpage using the configured LLM (currently requires Google Gemini API key) based on a natural language instruction.</p>
// <p><strong>Arguments:</strong></p>
// <ul>
// <li><code>url</code> (str, <strong>required</strong>): The URL of the webpage to analyze and extract from.</li>
// <li><code>instruction</code> (str, <strong>required</strong>): Natural language instruction specifying what information to extract (e.g., "List all the speakers mentioned on this page", "Extract the main contact email address", "Summarize the key findings").</li>
// </ul>
// <p><strong>Returns:</strong></p>
// <ul>
// <li>(str): The extracted information (often formatted as JSON or structured text based on the instruction) or a message indicating no relevant information was found, or an error message (including if the required API key is missing).</li>
// </ul>
// <h2 id="setup-and-running"><a aria-hidden="true" class="anchor" href="#setup-and-running" node="[object Object]" rel="noopener noreferrer nofollow" tabindex="-1" target="_blank"><svg aria-hidden="true" class="octicon octicon-link" height="16" version="1.1" viewbox="0 0 16 16" width="16"><path d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z" fill-rule="evenodd"></path></svg></a>Setup and Running</h2>
// <p>You can run this server either locally or using the provided Docker configuration.</p>
// <h3 id="option-1-running-with-docker-recommended-for-deployment"><a aria-hidden="true" class="anchor" href="#option-1-running-with-docker-recommended-for-deployment" node="[object Object]" rel="noopener noreferrer nofollow" tabindex="-1" target="_blank"><svg aria-hidden="true" class="octicon octicon-link" height="16" version="1.1" viewbox="0 0 16 16" width="16"><path d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z" fill-rule="evenodd"></path></svg></a>Option 1: Running with Docker (Recommended for Deployment)</h3>
// <p>This method bundles Python and all necessary libraries. You only need Docker installed on the host machine.</p>
// <ol>
// <li><strong>Install Docker:</strong> Download and install <a href="https://www.docker.com/products/docker-desktop/" node="[object Object]" rel="noopener noreferrer nofollow" target="_blank">Docker Desktop</a> for your OS. Start Docker Desktop.</li>
// <li><strong>Clone Repository:</strong>
// <pre class="language-bash"><code class="language-bash code-highlight"><span class="code-line"><span class="token function">git</span> clone https://github.com/your-username/your-repo-name.git <span class="token comment"># Replace with your repo URL</span>
// </span><span class="code-line"><span class="token builtin class-name">cd</span> your-repo-name
// </span></code><div class="copied" data-code="git clone https://github.com/your-username/your-repo-name.git # Replace with your repo URL
// cd your-repo-name
// "><svg aria-hidden="true" class="octicon-copy" fill="currentColor" height="12" viewbox="0 0 16 16" width="12"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 010 1.5h-1.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 019.25 16h-7.5A1.75 1.75 0 010 14.25v-7.5z" fill-rule="evenodd"></path><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0114.25 11h-7.5A1.75 1.75 0 015 9.25v-7.5zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25h-7.5z" fill-rule="evenodd"></path></svg><svg aria-hidden="true" class="octicon-check" fill="currentColor" height="12" viewbox="0 0 16 16" width="12"><path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" fill-rule="evenodd"></path></svg></div></pre>
// </li>
// <li><strong>Create <code>.env</code> File:</strong> Create a file named <code>.env</code> in the project root directory and add your API keys:
// <pre><code class="language-.env code-highlight"><span class="code-line"># Required for the smart_extract tool
// </span><span class="code-line">GOOGLE_API_KEY=your_google_ai_api_key_here
// </span><span class="code-line">
// </span><span class="code-line"># Optional, checked by server but not currently used by tools
// </span><span class="code-line"># OPENAI_API_KEY=your_openai_key_here
// </span><span class="code-line"># MISTRAL_API_KEY=your_mistral_key_here
// </span></code><div class="copied" data-code="# Required for the smart_extract tool
// GOOGLE_API_KEY=your_google_ai_api_key_here
//
// # Optional, checked by server but not currently used by tools
// # OPENAI_API_KEY=your_openai_key_here
// # MISTRAL_API_KEY=your_mistral_key_here
// "><svg aria-hidden="true" class="octicon-copy" fill="currentColor" height="12" viewbox="0 0 16 16" width="12"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 010 1.5h-1.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 019.25 16h-7.5A1.75 1.75 0 010 14.25v-7.5z" fill-rule="evenodd"></path><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0114.25 11h-7.5A1.75 1.75 0 015 9.25v-7.5zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25h-7.5z" fill-rule="evenodd"></path></svg><svg aria-hidden="true" class="octicon-check" fill="currentColor" height="12" viewbox="0 0 16 16" width="12"><path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" fill-rule="evenodd"></path></svg></div></pre>
// </li>
// <li><strong>Build the Docker Image:</strong>
// <pre class="language-bash"><code class="language-bash code-highlight"><span class="code-line"><span class="token function">docker</span> build <span class="token parameter variable">-t</span> crawl4ai-mcp-server <span class="token builtin class-name">.</span>
// </span></code><div class="copied" data-code="docker build -t crawl4ai-mcp-server .
// "><svg aria-hidden="true" class="octicon-copy" fill="currentColor" height="12" viewbox="0 0 16 16" width="12"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 010 1.5h-1.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 019.25 16h-7.5A1.75 1.75 0 010 14.25v-7.5z" fill-rule="evenodd"></path><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0114.25 11h-7.5A1.75 1.75 0 015 9.25v-7.5zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25h-7.5z" fill-rule="evenodd"></path></svg><svg aria-hidden="true" class="octicon-check" fill="currentColor" height="12" viewbox="0 0 16 16" width="12"><path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" fill-rule="evenodd"></path></svg></div></pre>
// </li>
// <li><strong>Run the Container:</strong> This starts the server, making port 8002 available on your host machine. It uses <code>--env-file</code> to securely pass the API keys from your local <code>.env</code> file into the container's environment.
// <pre class="language-bash"><code class="language-bash code-highlight"><span class="code-line"><span class="token function">docker</span> run <span class="token parameter variable">-it</span> <span class="token parameter variable">--rm</span> <span class="token parameter variable">-p</span> <span class="token number">8002</span>:8002 --env-file .env crawl4ai-mcp-server
// </span></code><div class="copied" data-code="docker run -it --rm -p 8002:8002 --env-file .env crawl4ai-mcp-server
// "><svg aria-hidden="true" class="octicon-copy" fill="currentColor" height="12" viewbox="0 0 16 16" width="12"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 010 1.5h-1.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 019.25 16h-7.5A1.75 1.75 0 010 14.25v-7.5z" fill-rule="evenodd"></path><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0114.25 11h-7.5A1.75 1.75 0 015 9.25v-7.5zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25h-7.5z" fill-rule="evenodd"></path></svg><svg aria-hidden="true" class="octicon-check" fill="currentColor" height="12" viewbox="0 0 16 16" width="12"><path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" fill-rule="evenodd"></path></svg></div></pre>
// <ul>
// <li><code>-it</code>: Runs interactively.</li>
// <li><code>--rm</code>: Removes container on exit.</li>
// <li><code>-p 8002:8002</code>: Maps host port 8002 to container port 8002.</li>
// <li><code>--env-file .env</code>: Loads environment variables from your local <code>.env</code> file into the container. <strong>Crucial for API keys.</strong></li>
// <li><code>crawl4ai-mcp-server</code>: The name of the image you built.</li>
// </ul>
// </li>
// <li><strong>Server is Running:</strong> Logs will appear, indicating the server is listening on SSE (<code>http://0.0.0.0:8002</code>).</li>
// <li><strong>Connecting Client:</strong> Configure your MCP client (e.g., LangChain agent) to connect to <code>http://127.0.0.1:8002/sse</code> with <code>transport: "sse"</code>.</li>
// </ol>
// <h3 id="option-2-running-locally"><a aria-hidden="true" class="anchor" href="#option-2-running-locally" node="[object Object]" rel="noopener noreferrer nofollow" tabindex="-1" target="_blank"><svg aria-hidden="true" class="octicon octicon-link" height="16" version="1.1" viewbox="0 0 16 16" width="16"><path d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z" fill-rule="evenodd"></path></svg></a>Option 2: Running Locally</h3>
// <p>This requires Python and manual installation of dependencies on your host machine.</p>
// <ol>
// <li><strong>Install Python:</strong> Ensure Python &gt;= 3.9 (check <code>crawl4ai</code> requirements if needed, 3.10+ recommended).</li>
// <li><strong>Clone Repository:</strong>
// <pre class="language-bash"><code class="language-bash code-highlight"><span class="code-line"><span class="token function">git</span> clone https://github.com/your-username/your-repo-name.git <span class="token comment"># Replace with your repo URL</span>
// </span><span class="code-line"><span class="token builtin class-name">cd</span> your-repo-name
// </span></code><div class="copied" data-code="git clone https://github.com/your-username/your-repo-name.git # Replace with your repo URL
// cd your-repo-name
// "><svg aria-hidden="true" class="octicon-copy" fill="currentColor" height="12" viewbox="0 0 16 16" width="12"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 010 1.5h-1.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 019.25 16h-7.5A1.75 1.75 0 010 14.25v-7.5z" fill-rule="evenodd"></path><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0114.25 11h-7.5A1.75 1.75 0 015 9.25v-7.5zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25h-7.5z" fill-rule="evenodd"></path></svg><svg aria-hidden="true" class="octicon-check" fill="currentColor" height="12" viewbox="0 0 16 16" width="12"><path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" fill-rule="evenodd"></path></svg></div></pre>
// </li>
// <li><strong>Create Virtual Environment (Recommended):</strong>
// <pre class="language-bash"><code class="language-bash code-highlight"><span class="code-line">python <span class="token parameter variable">-m</span> venv venv
// </span><span class="code-line"><span class="token builtin class-name">source</span> venv/bin/activate <span class="token comment"># Linux/macOS</span>
// </span><span class="code-line"><span class="token comment"># venv\\Scripts\\activate # Windows</span>
// </span></code><div class="copied" data-code="python -m venv venv
// source venv/bin/activate # Linux/macOS
// # venv\\Scripts\\activate # Windows
// "><svg aria-hidden="true" class="octicon-copy" fill="currentColor" height="12" viewbox="0 0 16 16" width="12"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 010 1.5h-1.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 019.25 16h-7.5A1.75 1.75 0 010 14.25v-7.5z" fill-rule="evenodd"></path><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0114.25 11h-7.5A1.75 1.75 0 015 9.25v-7.5zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25h-7.5z" fill-rule="evenodd"></path></svg><svg aria-hidden="true" class="octicon-check" fill="currentColor" height="12" viewbox="0 0 16 16" width="12"><path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" fill-rule="evenodd"></path></svg></div></pre>
// <em>(Or use Conda: <code>conda create --name crawl4ai-env python=3.11 -y &amp;&amp; conda activate crawl4ai-env</code>)</em></li>
// <li><strong>Install Dependencies:</strong>
// <pre class="language-bash"><code class="language-bash code-highlight"><span class="code-line">pip <span class="token function">install</span> <span class="token parameter variable">-r</span> requirements.txt
// </span></code><div class="copied" data-code="pip install -r requirements.txt
// "><svg aria-hidden="true" class="octicon-copy" fill="currentColor" height="12" viewbox="0 0 16 16" width="12"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 010 1.5h-1.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 019.25 16h-7.5A1.75 1.75 0 010 14.25v-7.5z" fill-rule="evenodd"></path><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0114.25 11h-7.5A1.75 1.75 0 015 9.25v-7.5zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25h-7.5z" fill-rule="evenodd"></path></svg><svg aria-hidden="true" class="octicon-check" fill="currentColor" height="12" viewbox="0 0 16 16" width="12"><path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" fill-rule="evenodd"></path></svg></div></pre>
// </li>
// <li><strong>Create <code>.env</code> File:</strong> Create a file named <code>.env</code> in the project root directory and add your API keys (same content as in Docker setup step 3).</li>
// <li><strong>Run the Server:</strong>
// <pre class="language-bash"><code class="language-bash code-highlight"><span class="code-line">python your_server_script_name.py <span class="token comment"># e.g., python webcrawl_mcp_server.py</span>
// </span></code><div class="copied" data-code="python your_server_script_name.py # e.g., python webcrawl_mcp_server.py
// "><svg aria-hidden="true" class="octicon-copy" fill="currentColor" height="12" viewbox="0 0 16 16" width="12"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 010 1.5h-1.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 019.25 16h-7.5A1.75 1.75 0 010 14.25v-7.5z" fill-rule="evenodd"></path><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0114.25 11h-7.5A1.75 1.75 0 015 9.25v-7.5zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25h-7.5z" fill-rule="evenodd"></path></svg><svg aria-hidden="true" class="octicon-check" fill="currentColor" height="12" viewbox="0 0 16 16" width="12"><path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" fill-rule="evenodd"></path></svg></div></pre>
// </li>
// <li><strong>Server is Running:</strong> It will listen on <code>http://127.0.0.1:8002/sse</code>.</li>
// <li><strong>Connecting Client:</strong> Configure your MCP client to connect to <code>http://127.0.0.1:8002/sse</code>.</li>
// </ol>
// <h2 id="environment-variables"><a aria-hidden="true" class="anchor" href="#environment-variables" node="[object Object]" rel="noopener noreferrer nofollow" tabindex="-1" target="_blank"><svg aria-hidden="true" class="octicon octicon-link" height="16" version="1.1" viewbox="0 0 16 16" width="16"><path d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z" fill-rule="evenodd"></path></svg></a>Environment Variables</h2>
// <p>The server uses the following environment variables, typically loaded from an <code>.env</code> file:</p>
// <ul>
// <li><code>GOOGLE_API_KEY</code>: <strong>Required</strong> for the <code>smart_extract</code> tool to function (uses Google Gemini). Get one from <a href="https://aistudio.google.com/app/apikey" node="[object Object]" rel="noopener noreferrer nofollow" target="_blank">Google AI Studio</a>.</li>
// <li><code>OPENAI_API_KEY</code>: Checked for existence but <strong>not currently used</strong> by any tool in this version.</li>
// <li><code>MISTRAL_API_KEY</code>: Checked for existence but <strong>not currently used</strong> by any tool in this version.</li>
// </ul>
// <h2 id="example-agent-interaction"><a aria-hidden="true" class="anchor" href="#example-agent-interaction" node="[object Object]" rel="noopener noreferrer nofollow" tabindex="-1" target="_blank"><svg aria-hidden="true" class="octicon octicon-link" height="16" version="1.1" viewbox="0 0 16 16" width="16"><path d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z" fill-rule="evenodd"></path></svg></a>Example Agent Interaction</h2>
// <pre><code class="code-highlight"><span class="code-line"># Example using the agent CLI from the previous setup
// </span><span class="code-line">
// </span><span class="code-line">You: scrape_url https://example.com
// </span><span class="code-line">Agent: Thinking...
// </span><span class="code-line">[Agent calls scrape_url tool]
// </span><span class="code-line">Agent: [Markdown content of example.com]
// </span><span class="code-line">------------------------------
// </span><span class="code-line">You: extract text from https://en.wikipedia.org/wiki/Web_scraping using the query "ethical considerations"
// </span><span class="code-line">Agent: Thinking...
// </span><span class="code-line">[Agent calls extract_text_by_query tool]
// </span><span class="code-line">Agent: Found X matches for 'ethical considerations' on the page. Here are the relevant sections:
// </span><span class="code-line">Match 1:
// </span><span class="code-line">... text snippet ...
// </span><span class="code-line">---
// </span><span class="code-line">Match 2:
// </span><span class="code-line">... text snippet ...
// </span><span class="code-line">------------------------------
// </span><span class="code-line">You: Use smart_extract on https://blog.google/technology/ai/google-gemini-ai/ to get the main points about Gemini models
// </span><span class="code-line">Agent: Thinking...
// </span><span class="code-line">[Agent calls smart_extract tool with Google API Key]
// </span><span class="code-line">Agent: Successfully extracted information based on your instruction:
// </span><span class="code-line">{
// </span><span class="code-line">  "main_points": [
// </span><span class="code-line">    "Gemini is Google's most capable AI model family (Ultra, Pro, Nano).",
// </span><span class="code-line">    "Designed to be multimodal, understanding text, code, audio, image, video.",
// </span><span class="code-line">    "Outperforms previous models on various benchmarks.",
// </span><span class="code-line">    "Being integrated into Google products like Bard and Pixel."
// </span><span class="code-line">  ]
// </span><span class="code-line">}
// </span><span class="code-line">
// </span></code><div class="copied" data-code="# Example using the agent CLI from the previous setup
//
// You: scrape_url https://example.com
// Agent: Thinking...
// [Agent calls scrape_url tool]
// Agent: [Markdown content of example.com]
// ------------------------------
// You: extract text from https://en.wikipedia.org/wiki/Web_scraping using the query &quot;ethical considerations&quot;
// Agent: Thinking...
// [Agent calls extract_text_by_query tool]
// Agent: Found X matches for 'ethical considerations' on the page. Here are the relevant sections:
// Match 1:
// ... text snippet ...
// ---
// Match 2:
// ... text snippet ...
// ------------------------------
// You: Use smart_extract on https://blog.google/technology/ai/google-gemini-ai/ to get the main points about Gemini models
// Agent: Thinking...
// [Agent calls smart_extract tool with Google API Key]
// Agent: Successfully extracted information based on your instruction:
// {
//   &quot;main_points&quot;: [
//     &quot;Gemini is Google's most capable AI model family (Ultra, Pro, Nano).&quot;,
//     &quot;Designed to be multimodal, understanding text, code, audio, image, video.&quot;,
//     &quot;Outperforms previous models on various benchmarks.&quot;,
//     &quot;Being integrated into Google products like Bard and Pixel.&quot;
//   ]
// }
//
// "><svg aria-hidden="true" class="octicon-copy" fill="currentColor" height="12" viewbox="0 0 16 16" width="12"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 010 1.5h-1.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 019.25 16h-7.5A1.75 1.75 0 010 14.25v-7.5z" fill-rule="evenodd"></path><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0114.25 11h-7.5A1.75 1.75 0 015 9.25v-7.5zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25h-7.5z" fill-rule="evenodd"></path></svg><svg aria-hidden="true" class="octicon-check" fill="currentColor" height="12" viewbox="0 0 16 16" width="12"><path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" fill-rule="evenodd"></path></svg></div></pre>
// <h2 id="files"><a aria-hidden="true" class="anchor" href="#files" node="[object Object]" rel="noopener noreferrer nofollow" tabindex="-1" target="_blank"><svg aria-hidden="true" class="octicon octicon-link" height="16" version="1.1" viewbox="0 0 16 16" width="16"><path d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z" fill-rule="evenodd"></path></svg></a>Files</h2>
// <ul>
// <li><code>your_server_script_name.py</code>: The main Python script for the MCP server (e.g., <code>webcrawl_mcp_server.py</code>).</li>
// <li><code>Dockerfile</code>: Instructions for building the Docker container image.</li>
// <li><code>requirements.txt</code>: Python dependencies.</li>
// <li><code>.env.example</code>: (Recommended) An example environment file showing needed keys. <strong>Do not commit your actual <code>.env</code> file.</strong></li>
// <li><code>.gitignore</code>: Specifies intentionally untracked files for Git (should include <code>.env</code>).</li>
// <li><code>README.md</code>: This file.</li>
// </ul>
// <h2 id="contributing"><a aria-hidden="true" class="anchor" href="#contributing" node="[object Object]" rel="noopener noreferrer nofollow" tabindex="-1" target="_blank"><svg aria-hidden="true" class="octicon octicon-link" height="16" version="1.1" viewbox="0 0 16 16" width="16"><path d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z" fill-rule="evenodd"></path></svg></a>Contributing</h2>
// <p>(Add contribution guidelines if desired)</p>
// <h2 id="license"><a aria-hidden="true" class="anchor" href="#license" node="[object Object]" rel="noopener noreferrer nofollow" tabindex="-1" target="_blank"><svg aria-hidden="true" class="octicon octicon-link" height="16" version="1.1" viewbox="0 0 16 16" width="16"><path d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z" fill-rule="evenodd"></path></svg></a>License</h2>
// <p>(Specify your license, e.g., MIT License)</p></div></div></div></div><div class="w-full mt-10"></div></div>`,
//     "slug": "skymcp-notion",
//     "slug_raw": "notion"
//   }
  isServerDetailModalOpen.value = true
}

// 태그 파싱
const parseTags = (tagsString) => {
  try {
    return JSON.parse(tagsString)
  } catch (e) {
    return []
  }
}

const filteredMcpServers = computed(() => {
  // Use the API data instead of mock data
  return mcpServers.value;
});

// Dummy 't' function if not already provided by i18n setup
// const t = (key, defaultValue) => defaultValue || key;
// Ensure `t` is available from your i18n setup.

// 使用MCP Store
const mcpStore = useMcpStore()
// 使用 Settings Store
const settingsStore = useSettingsStore()
// 国际化
const { t } = useI18n()
// Toast通知
const { toast } = useToast()
// 使用路由
const route = useRoute()

const router = useRouter()

// 本地UI状态
const activeTab = ref<'servers' | 'tools' | 'prompts' | 'resources' | 'marketplace'>('servers')
const isAddServerDialogOpen = ref(false)
const isEditServerDialogOpen = ref(false)
const isResetConfirmDialogOpen = ref(false)
const isRemoveConfirmDialogOpen = ref(false)
const selectedServer = ref<string>('')
const selectedTool = ref<MCPToolDefinition | null>(null)
const selectedPrompt = ref<string>('')
const selectedResource = ref<string>('')
const promptResult = ref<string>('')
const resourceContent = ref<string>('')
const promptParams = ref<string>('{}')
const promptLoading = ref(false)
const resourceLoading = ref(false)
const jsonPromptError = ref(false)

// 将toolInputs和toolResults移到本地组件
const localToolInputs = ref<Record<string, string>>({})
const localToolResults = ref<Record<string, string>>({})
const jsonError = ref<Record<string, boolean>>({})

// 当选择工具时，初始化本地输入
watch(selectedTool, (newTool) => {
  if (newTool) {
    const toolName = newTool.function.name
    if (!localToolInputs.value[toolName]) {
      localToolInputs.value[toolName] = '{}'
    }
    jsonError.value[toolName] = false
  }
})

// 验证JSON格式
const validateJson = (input: string, toolName: string): boolean => {
  try {
    JSON.parse(input)
    jsonError.value[toolName] = false
    return true
  } catch (e) {
    jsonError.value[toolName] = true
    return false
  }
}

// 验证Prompt参数JSON格式
const validatePromptJson = (input: string): boolean => {
  try {
    JSON.parse(input)
    jsonPromptError.value = false
    return true
  } catch (e) {
    jsonPromptError.value = true
    return false
  }
}

// 选择工具
const selectTool = (tool: MCPToolDefinition) => {
  selectedTool.value = tool
}

// 选择Prompt
const selectPrompt = (prompt: PromptListEntry) => {
  selectedPrompt.value = prompt.name
  promptResult.value = ''
}

// 选择Resource
const selectResource = (resource: ResourceListEntry) => {
  selectedResource.value = resource.uri
  resourceContent.value = ''
}

// 处理MCP服务器安装完成
const handleInstallComplete = async () => {
  isInstallDialogOpen.value = false
  isServerDetailModalOpen.value = false

  // 刷新服务器列表
  await mcpStore.loadConfig()

  toast({
    title: t('mcp.installSuccess'),
    description: t('mcp.serverInstalled', { name: selectedServerDetail.value?.name }),
    variant: 'default'
  })
}

// 加载资源内容
const loadResourceContent = async (resource: ResourceListEntry) => {
  if (!resource) return

  try {
    resourceLoading.value = true
    const result = await mcpStore.readResource(resource) // 传递完整的resource对象
    // 类型断言和检查
    if (result && typeof result === 'object' && 'content' in result) {
      const typedResult = result as { content: unknown }
      resourceContent.value =
        typeof typedResult.content === 'string'
          ? typedResult.content
          : JSON.stringify(typedResult.content, null, 2)
    } else {
      resourceContent.value = typeof result === 'string' ? result : JSON.stringify(result, null, 2)
    }
  } catch (error) {
    console.error('加载资源内容失败:', error)
    resourceContent.value = `加载失败: ${error}`
  } finally {
    resourceLoading.value = false
  }
}

// 调用Prompt
const callPrompt = async (prompt: PromptListEntry) => {
  if (!prompt) return
  if (!validatePromptJson(promptParams.value)) return

  try {
    promptLoading.value = true
    const params = JSON.parse(promptParams.value)
    const result = await mcpStore.getPrompt(prompt, params) // 传递完整的prompt对象

    // 处理返回结果
    if (result && typeof result === 'object') {
      // 检查是否包含messages字段
      const typedResult = result as Record<string, unknown>
      if ('messages' in typedResult) {
        promptResult.value = JSON.stringify(typedResult.messages, null, 2)
      } else {
        promptResult.value = JSON.stringify(typedResult, null, 2)
      }
    } else {
      promptResult.value = typeof result === 'string' ? result : JSON.stringify(result, null, 2)
    }
  } catch (error) {
    console.error('调用Prompt失败:', error)
    promptResult.value = `调用失败: ${error}`
  } finally {
    promptLoading.value = false
  }
}

// 添加服务器
const handleAddServer = async (serverName: string, serverConfig: MCPServerConfig) => {
  const result = await mcpStore.addServer(serverName, serverConfig)
  if (result.success) {
    isAddServerDialogOpen.value = false
  }
}

// 编辑服务器
const handleEditServer = async (serverName: string, serverConfig: Partial<MCPServerConfig>) => {
  const success = await mcpStore.updateServer(serverName, serverConfig)
  if (success) {
    isEditServerDialogOpen.value = false
    selectedServer.value = ''
  }
}

// 删除服务器
const handleRemoveServer = async (serverName: string) => {
  // 检查是否为inmemory服务，如果是则不允许删除
  const config = mcpStore.config.mcpServers[serverName]
  if (config?.type === 'inmemory') {
    toast({
      title: t('settings.mcp.cannotRemoveBuiltIn'),
      description: t('settings.mcp.builtInServerCannotBeRemoved'),
      variant: 'destructive'
    })
    return
  }

  selectedServer.value = serverName
  isRemoveConfirmDialogOpen.value = true
}

// 确认删除服务器
const confirmRemoveServer = async () => {
  const serverName = selectedServer.value
  await mcpStore.removeServer(serverName)
  isRemoveConfirmDialogOpen.value = false
}

// 切换服务器的默认状态
const handleToggleDefaultServer = async (serverName: string) => {
  // 检查是否已经是默认服务器
  const isDefault = mcpStore.config.defaultServers.includes(serverName)
  console.log('mcpStore.config.defaultServers', mcpStore.config.defaultServers)
  // 如果不是默认服务器，且已达到最大数量，显示提示
  if (!isDefault && mcpStore.config.defaultServers.length > 30) {
    toast({
      title: t('mcp.errors.maxDefaultServersReached'),
      description: t('settings.mcp.removeDefaultFirst'),
      variant: 'destructive'
    })
    return
  }

  const result = await mcpStore.toggleDefaultServer(serverName)
  if (!result.success) {
    toast({
      title: t('common.error.operationFailed'),
      description: result.message,
      variant: 'destructive'
    })
  }
}

// 启动/停止服务器
const handleToggleServer = async (serverName: string) => {
  if (mcpStore.serverLoadingStates[serverName]) {
    return
  }
  const success = await mcpStore.toggleServer(serverName)
  if (!success) {
    // 显示错误提示
    const isRunning = mcpStore.serverStatuses[serverName]
    alert(
      `${serverName} ${isRunning ? t('settings.mcp.stopped') : t('settings.mcp.running')}${t('common.error.requestFailed')}`
    )
  }
}

// 恢复默认服务
const handleResetToDefaultServers = async () => {
  const success = await mcpStore.resetToDefaultServers()
  if (success) {
    isResetConfirmDialogOpen.value = false
  } else {
    alert(t('common.error.requestFailed'))
  }
}

// 打开编辑服务器对话框
const openEditServerDialog = (serverName: string) => {
  // 如果是Dify知识库检索服务器，则跳转到知识库设置页面
  if (serverName === 'difyKnowledge') {
    router.push({
      name: 'settings-knowledge-base',
      query: { subtab: 'dify' } // 确保激活服务器子标签
    })
    return
  }
  if (serverName === 'ragflowKnowledge') {
    router.push({
      name: 'settings-knowledge-base',
      query: { subtab: 'ragflow' } // 确保激活服务器子标签
    })
    return
  }
  if (serverName === 'fastGptKnowledge') {
    router.push({
      name: 'settings-knowledge-base',
      query: { subtab: 'fastgpt' } // 确保激活服务器子标签
    })
    return
  }
  selectedServer.value = serverName
  isEditServerDialogOpen.value = true
}

// 调用工具
const callTool = async (toolName: string) => {
  if (!validateJson(localToolInputs.value[toolName], toolName)) {
    return
  }

  try {
    // 调用工具前更新全局store里的参数
    const params = JSON.parse(localToolInputs.value[toolName])
    // 设置全局store参数，以便mcpStore.callTool能使用
    mcpStore.toolInputs[toolName] = params

    // 调用工具
    const result = await mcpStore.callTool(toolName)
    if (result) {
      localToolResults.value[toolName] = result.content || ''
    }
    return result
  } catch (error) {
    console.error('调用工具出错:', error)
    localToolResults.value[toolName] = String(error)
  }
  return
}

// 监听标签切换
watch(
  activeTab,
  async (newTab) => {
    if (newTab === 'tools') {
      await mcpStore.loadTools()
      await mcpStore.loadClients()
    } else if (newTab === 'prompts') {
      await mcpStore.loadPrompts()
    } else if (newTab === 'resources') {
      await mcpStore.loadResources()
    }
  },
  { immediate: true }
)

// 计算属性：区分内置服务和普通服务
const inMemoryServers = computed(() => {
  return mcpStore.serverList.filter((server) => {
    const config = mcpStore.config.mcpServers[server.name]
    return config?.type === 'inmemory'
  })
})

const regularServers = computed(() => {
  return mcpStore.serverList.filter((server) => {
    const config = mcpStore.config.mcpServers[server.name]
    return config?.type !== 'inmemory'
  })
})

// 获取内置服务器的本地化名称和描述
const getLocalizedServerName = (serverName: string) => {
  return t(`mcp.inmemory.${serverName}.name`, serverName)
}

const getLocalizedServerDesc = (serverName: string, fallbackDesc: string) => {
  return t(`mcp.inmemory.${serverName}.desc`, fallbackDesc)
}

// 监听 MCP 安装缓存
watch(
  () => settingsStore.mcpInstallCache,
  (newCache) => {
    if (newCache) {
      // 打开添加服务器对话框
      isAddServerDialogOpen.value = true
    }
  },
  { immediate: true }
)

watch(isAddServerDialogOpen, (newIsAddServerDialogOpen) => {
  // 当添加服务器对话框关闭时，清理缓存
  if (!newIsAddServerDialogOpen) {
    // 清理缓存
    settingsStore.clearMcpInstallCache()
  }
})

// 监听URL查询参数，设置活动标签页
watch(
  () => route.query.subtab,
  (newSubtab) => {
    console.log('newSubtab', newSubtab)
    if (
      newSubtab === 'servers' ||
      newSubtab === 'tools' ||
      newSubtab === 'prompts' ||
      newSubtab === 'resources'
    ) {
      activeTab.value = newSubtab
    }
  },
  { immediate: true }
)

// 添加计算属性：获取当前选中的提示模板对象
const selectedPromptObj = computed(() => {
  return mcpStore.prompts.find((p) => p.name === selectedPrompt.value)
})

// 添加计算属性：获取默认参数模板
const defaultPromptParams = computed(() => {
  if (!selectedPromptObj.value) return '{}'

  // 获取 arguments 字段
  const promptArgs = selectedPromptObj.value.arguments || {}

  // 如果 arguments 是数组，将其转换为对象
  if (Array.isArray(promptArgs)) {
    const argsObject = promptArgs.reduce(
      (acc, arg) => {
        acc[arg.name] = '' // 为每个参数设置空值
        return acc
      },
      {} as Record<string, string>
    )
    return JSON.stringify(argsObject, null, 2)
  }

  // 如果已经是对象，直接返回
  return JSON.stringify(promptArgs, null, 2)
})

// 监听选中提示模板变化，更新参数
watch(selectedPrompt, () => {
  promptParams.value = defaultPromptParams.value
})

// 格式化 JSON 字符串
const formatJson = (json: string): string => {
  try {
    const obj = JSON.parse(json)
    return JSON.stringify(obj, null, 2)
  } catch (e) {
    return json
  }
}

// 添加计算属性：获取当前选中的资源对象
const selectedResourceObj = computed(() => {
  return mcpStore.resources.find((r) => r.uri === selectedResource.value)
})

// 添加计算属性：判断内容是否是JSON
const isJsonContent = computed(() => {
  if (!resourceContent.value) return false

  try {
    // 尝试将内容解析为JSON
    JSON.parse(resourceContent.value)
    return true
  } catch (e) {
    return false
  }
})

// 添加计算属性：解析JSON内容为带有语法高亮的部分
const jsonParts = computed(() => {
  if (!isJsonContent.value || !resourceContent.value) return []

  try {
    // 格式化JSON字符串
    const formattedJson = JSON.stringify(JSON.parse(resourceContent.value), null, 2)

    // 解析JSON，将其分解为带有类型的部分
    const parts: Array<{ type: string; content: string }> = []

    // 简单的词法分析，识别不同类型的JSON元素
    const regex = /"([^"]+)":|"([^"]+)"|-?\d+\.?\d*|true|false|null|[[\]{}:,]/g
    let match
    let lastIndex = 0

    while ((match = regex.exec(formattedJson)) !== null) {
      // 添加匹配前的空白字符
      if (match.index > lastIndex) {
        parts.push({
          type: 'whitespace',
          content: formattedJson.substring(lastIndex, match.index)
        })
      }

      const value = match[0]

      // 确定元素类型
      if (value.endsWith(':')) {
        // 键
        parts.push({
          type: 'key',
          content: value
        })
      } else if (value.startsWith('"')) {
        // 字符串值
        parts.push({
          type: 'string',
          content: value
        })
      } else if (/^-?\d+\.?\d*$/.test(value)) {
        // 数字
        parts.push({
          type: 'number',
          content: value
        })
      } else if (value === 'true' || value === 'false') {
        // 布尔值
        parts.push({
          type: 'boolean',
          content: value
        })
      } else if (value === 'null') {
        // null值
        parts.push({
          type: 'null',
          content: value
        })
      } else if (/^[[\]{}:,]$/.test(value)) {
        // 括号和分隔符
        parts.push({
          type: 'bracket',
          content: value
        })
      } else {
        // 其他
        parts.push({
          type: 'other',
          content: value
        })
      }

      lastIndex = regex.lastIndex
    }

    // 添加剩余部分
    if (lastIndex < formattedJson.length) {
      parts.push({
        type: 'whitespace',
        content: formattedJson.substring(lastIndex)
      })
    }

    return parts
  } catch (e) {
    return [{ type: 'text', content: resourceContent.value }]
  }
})

// 根据JSON部分类型获取CSS类名
const getJsonPartClass = (type: string): string => {
  switch (type) {
    case 'key':
      return 'json-key'
    case 'string':
      return 'json-string'
    case 'number':
      return 'json-number'
    case 'boolean':
      return 'json-boolean'
    case 'null':
      return 'json-null'
    case 'bracket':
      return 'json-bracket'
    default:
      return ''
  }
}

// 添加计算属性：获取参数描述
const promptArgsDescription = computed(() => {
  if (!selectedPromptObj.value) return []
  const promptArgs = selectedPromptObj.value.arguments || {}

  if (Array.isArray(promptArgs)) {
    return promptArgs.map((arg) => ({
      name: arg.name,
      description: arg.description || '',
      required: arg.required || false
    }))
  }

  return []
})
</script>

<template>
  <div class="h-full flex flex-col w-full">
    <!-- 选项卡 -->
    <div class="flex border-b mb-4 px-4">
      <button :class="activeTab === 'servers'
        ? 'px-3 py-1.5 text-sm border-b-2 border-primary font-medium text-primary'
        : 'px-3 py-1.5 text-sm text-muted-foreground'
        " @click="activeTab = 'servers'">
        {{ t('settings.mcp.tabs.servers') }}
      </button>
      <button :class="activeTab === 'marketplace'
        ? 'px-3 py-1.5 text-sm border-b-2 border-primary font-medium text-primary'
        : 'px-3 py-1.5 text-sm text-muted-foreground'
        " @click="activeTab = 'marketplace'">
        {{ t('settings.mcp.tabs.marketplace', 'Marketplace') }}
      </button>
      <button :class="activeTab === 'tools'
        ? 'px-3 py-1.5 text-sm ml-2 border-b-2 border-primary font-medium text-primary'
        : 'px-3 py-1.5 text-sm ml-2 text-muted-foreground'
        " @click="activeTab = 'tools'">
        {{ t('settings.mcp.tabs.tools') }}
      </button>
      <button :class="activeTab === 'prompts'
        ? 'px-3 py-1.5 text-sm ml-2 border-b-2 border-primary font-medium text-primary'
        : 'px-3 py-1.5 text-sm ml-2 text-muted-foreground'
        " @click="activeTab = 'prompts'">
        {{ t('settings.mcp.tabs.prompts') }}
      </button>
      <button :class="activeTab === 'resources'
        ? 'px-3 py-1.5 text-sm ml-2 border-b-2 border-primary font-medium text-primary'
        : 'px-3 py-1.5 text-sm ml-2 text-muted-foreground'
        " @click="activeTab = 'resources'">
        {{ t('settings.mcp.tabs.resources') }}
      </button>
    </div>

    <div class="flex overflow-hidden px-4 h-full">
      <!-- 服务器配置选项卡 -->
      <ScrollArea v-if="activeTab === 'servers'" class="h-full w-full">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-base font-medium">{{ t('settings.mcp.serverList') }}</h3>
          <div class="flex space-x-2">
            <Dialog v-model:open="isResetConfirmDialogOpen">
              <DialogTrigger as-child>
                <Button variant="outline" size="sm">
                  <Icon icon="lucide:refresh-cw" class="mr-2 h-4 w-4" />
                  {{ t('settings.mcp.resetToDefault') }}
                </Button>
              </DialogTrigger>
              <DialogContent class="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{{ t('settings.mcp.resetConfirmTitle') }}</DialogTitle>
                  <DialogDescription>
                    {{ t('settings.mcp.resetConfirmDescription') }}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" @click="isResetConfirmDialogOpen = false">
                    {{ t('common.cancel') }}
                  </Button>
                  <Button variant="default" @click="handleResetToDefaultServers">
                    {{ t('settings.mcp.resetConfirm') }}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog v-model:open="isAddServerDialogOpen">
              <DialogTrigger as-child>
                <Button variant="outline" size="sm">
                  <Icon icon="lucide:plus" class="mr-2 h-4 w-4" />
                  {{ t('settings.mcp.addServer') }}
                </Button>
              </DialogTrigger>
              <DialogContent class="w-[640px] px-0 h-[80vh] flex flex-col">
                <DialogHeader class="px-4 flex-shrink-0">
                  <DialogTitle>{{ t('settings.mcp.addServerDialog.title') }}</DialogTitle>
                </DialogHeader>
                <McpServerForm :default-json-config="settingsStore.mcpInstallCache || undefined"
                  @submit="handleAddServer" />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div v-if="mcpStore.configLoading" class="flex justify-center py-8">
          <Icon icon="lucide:loader" class="h-8 w-8 animate-spin" />
        </div>

        <div v-else-if="mcpStore.serverList.length === 0" class="text-center py-8 text-muted-foreground text-lg">
          {{ t('settings.mcp.noServersFound') }}
        </div>

        <div v-else class="space-y-4 pb-4 pr-4">
          <!-- 内置服务 -->
          <div v-if="inMemoryServers.length > 0" class="server-item">
            <h4 class="text-sm font-medium mb-2 text-muted-foreground">
              {{ t('settings.mcp.builtInServers') }}
            </h4>
            <div v-for="server in inMemoryServers" :key="server.name"
              class="border rounded-lg overflow-hidden bg-card mb-4">
              <div class="flex items-center p-4">
                <div class="flex-1 min-w-0">
                  <div>
                    <div class="flex items-center">
                      <span class="text-xl mr-2 flex-shrink-0">{{ server.icons }}</span>
                      <h4 class="text-sm font-medium truncate">
                        {{ getLocalizedServerName(server.name) }}
                      </h4>
                      <span :class="[
                        'ml-2 px-2 py-0.5 text-xs rounded-full flex-shrink-0',
                        server.isRunning
                          ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                      ]">
                        {{
                          server.isRunning ? t('settings.mcp.running') : t('settings.mcp.stopped')
                        }}
                      </span>
                    </div>
                    <p class="text-xs text-muted-foreground mt-1 break-words">
                      {{ getLocalizedServerDesc(server.name, server.descriptions) }}
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <Button variant="outline" size="icon" class="h-8 w-8 rounded-lg text-muted-foreground"
                          :disabled="mcpStore.configLoading" @click="handleToggleServer(server.name)">
                          <Icon v-if="mcpStore.serverLoadingStates[server.name]" icon="lucide:loader"
                            class="h-4 w-4 animate-spin" />
                          <Icon v-else :icon="server.isRunning ? 'lucide:square' : 'lucide:play'" class="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {{
                            server.isRunning
                              ? t('settings.mcp.stopServer')
                              : t('settings.mcp.startServer')
                          }}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <Button variant="outline" size="icon" class="h-8 w-8 rounded-lg" :class="server.isDefault
                          ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                          : 'text-muted-foreground'
                          " :disabled="mcpStore.configLoading" @click="handleToggleDefaultServer(server.name)">
                          <Icon v-if="server.isDefault" icon="lucide:check-circle" class="h-4 w-4" />
                          <Icon v-else icon="lucide:circle" class="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {{
                            server.isDefault
                              ? t('settings.mcp.removeDefault')
                              : t('settings.mcp.setAsDefault')
                          }}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <Button variant="outline" size="icon" class="h-8 w-8 rounded-lg text-muted-foreground"
                          :disabled="mcpStore.configLoading" @click="openEditServerDialog(server.name)">
                          <Icon icon="lucide:edit" class="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{{ t('settings.mcp.editServer') }}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <div class="bg-muted dark:bg-zinc-800 px-4 py-2 overflow-hidden">
                <div class="flex justify-between items-center">
                  <div class="text-xs font-mono overflow-hidden text-ellipsis whitespace-nowrap pr-2 flex-1 w-0">
                    {{ server.command }} {{ server.args.join(' ') }}
                  </div>
                  <div class="flex space-x-2 flex-shrink-0">
                    <span
                      class="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 rounded-full shrink-0">
                      {{ t('settings.mcp.builtIn') }}
                    </span>
                    <span v-if="server.isDefault"
                      class="ml-2 px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full shrink-0">
                      {{ t('settings.mcp.default') }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 普通服务标题 -->
            <h4 v-if="regularServers.length > 0" class="text-sm font-medium mb-2 mt-6 text-muted-foreground">
              {{ t('settings.mcp.customServers') }}
            </h4>
          </div>

          <!-- 普通服务 -->
          <div v-for="server in regularServers" :key="server.name" class="border rounded-lg overflow-hidden bg-card">
            <div class="flex items-center p-4">
              <div class="flex-1 min-w-0">
                <div>
                  <div class="flex items-center">
                    <span class="text-xl mr-2 flex-shrink-0">{{ server.icons }}</span>
                    <h4 class="text-sm font-medium truncate">{{ server.name }}</h4>
                    <span :class="[
                      'ml-2 px-2 py-0.5 text-xs rounded-full flex-shrink-0',
                      server.isRunning
                        ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                    ]">
                      {{ server.isRunning ? t('settings.mcp.running') : t('settings.mcp.stopped') }}
                    </span>
                  </div>
                  <p class="text-xs text-muted-foreground mt-1 break-words">
                    {{ server.descriptions }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <Button variant="outline" size="icon" class="h-8 w-8 rounded-lg text-muted-foreground"
                        :disabled="mcpStore.configLoading" @click="handleToggleServer(server.name)">
                        <Icon v-if="mcpStore.serverLoadingStates[server.name]" icon="lucide:loader"
                          class="h-4 w-4 animate-spin" />
                        <Icon v-else :icon="server.isRunning ? 'lucide:square' : 'lucide:play'" class="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {{
                          server.isRunning
                            ? t('settings.mcp.stopServer')
                            : t('settings.mcp.startServer')
                        }}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <Button variant="outline" size="icon" class="h-8 w-8 rounded-lg" :class="server.isDefault
                        ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                        : 'text-muted-foreground'
                        " :disabled="mcpStore.configLoading" @click="handleToggleDefaultServer(server.name)">
                        <Icon v-if="server.isDefault" icon="lucide:check-circle" class="h-4 w-4" />
                        <Icon v-else icon="lucide:circle" class="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {{
                          server.isDefault
                            ? t('settings.mcp.removeDefault')
                            : t('settings.mcp.setAsDefault')
                        }}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <Button variant="outline" size="icon" class="h-8 w-8 rounded-lg text-muted-foreground"
                        :disabled="mcpStore.configLoading" @click="openEditServerDialog(server.name)">
                        <Icon icon="lucide:edit" class="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{{ t('settings.mcp.editServer') }}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <Button variant="outline" size="icon" class="h-8 w-8 rounded-lg text-muted-foreground"
                        :disabled="mcpStore.configLoading" @click="handleRemoveServer(server.name)">
                        <Icon icon="lucide:trash" class="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{{ t('settings.mcp.removeServer') }}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <div class="bg-muted dark:bg-zinc-800 px-4 py-2 overflow-hidden">
              <div class="flex justify-between items-center">
                <div v-if="server.type === 'http'"
                  class="text-xs font-mono overflow-hidden text-ellipsis whitespace-nowrap pr-2 flex-1 w-0">
                  {{ server.baseUrl }}
                </div>
                <div v-else class="text-xs font-mono overflow-hidden text-ellipsis whitespace-nowrap pr-2 flex-1 w-0">
                  {{ server.command }} {{ server.args.join(' ') }}
                </div>
                <span v-if="server.isDefault"
                  class="ml-2 px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full shrink-0">
                  {{ t('settings.mcp.default') }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>

      <div v-if="activeTab === 'marketplace'" class="h-full w-full flex flex-col overflow-hidden p-4 sm:p-6 gap-4">
        <!-- Filter Tabs -->
<!--        <div class="flex-shrink-0 flex flex-wrap justify-center gap-2 border-b border-border pb-3 mb-2">-->
<!--          <Button-->
<!--            v-for="filterKey in serverFilters"-->
<!--            :key="filterKey"-->
<!--            variant="ghost"-->
<!--            size="sm"-->
<!--            @click="activeFilter = filterKey"-->
<!--            :class="['hover:bg-accent', activeFilter === filterKey ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'text-muted-foreground']"-->
<!--          >-->
<!--            &lt;!&ndash; Example icons, you can customize these &ndash;&gt;-->
<!--            <Icon v-if="filterKey === 'Featured'" icon="lucide:star" class="h-4 w-4 mr-1.5"/>-->
<!--            <Icon v-if="filterKey === 'Latest'" icon="lucide:clock" class="h-4 w-4 mr-1.5"/>-->
<!--            <Icon v-if="filterKey === 'Clients'" icon="lucide:users" class="h-4 w-4 mr-1.5"/>-->
<!--            <Icon v-if="filterKey === 'Hosted'" icon="lucide:server" class="h-4 w-4 mr-1.5"/>-->
<!--            <Icon v-if="filterKey === 'Official'" icon="lucide:shield-check" class="h-4 w-4 mr-1.5"/>-->
<!--            <Icon v-if="filterKey === 'Innovations'" icon="lucide:sparkles" class="h-4 w-4 mr-1.5"/>-->
<!--            {{ t(`mcp.marketplace.filters.${filterKey.toLowerCase()}`, filterKey) }}-->
<!--          </Button>-->
<!--        </div>-->

        <!-- Search and Sort Controls -->
        <div class="mb-4 flex flex-col sm:flex-row gap-3">
          <div class="flex-grow">
            <div class="relative">
              <Input
                v-model="searchQuery"
                :placeholder="t('mcp.marketplace.searchPlaceholder', 'Search MCP servers...')"
                class="pr-10"
                @keyup.enter="handleSearch"
              />
              <Button
                variant="ghost"
                size="icon"
                class="absolute right-1 top-1/2 -translate-y-1/2"
                @click="handleSearch"
              >
                <Icon icon="lucide:search" class="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button
            variant="outline"
            size="default"
            @click="toggleSortDirection"
            class="flex items-center gap-1"
          >
            <Icon :icon="isDescending ? 'lucide:sort-desc' : 'lucide:sort-asc'" class="h-4 w-4" />
            {{ isDescending ? t('mcp.marketplace.sortDesc', 'Newest First') : t('mcp.marketplace.sortAsc', 'Oldest First') }}
          </Button>
        </div>

        <!-- Server List Area -->
        <ScrollArea class="flex-grow h-full">
          <div class="mb-2 flex justify-between items-center">
            <h2 class="text-xl font-semibold">{{ t('mcp.marketplace.listTitle', activeFilter + ' MCP Servers') }}</h2>
            <div class="text-sm text-muted-foreground">
              {{ t('mcp.marketplace.showing', 'Showing') }} {{ mcpServers.length }} {{ t('mcp.marketplace.of', 'of') }} {{ totalItems }} {{ t('mcp.marketplace.servers', 'servers') }}
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="isLoading" class="text-center py-12">
            <Icon icon="lucide:loader" class="h-12 w-12 mx-auto mb-2 text-primary animate-spin"/>
            <p>{{ t('mcp.marketplace.loading', 'Loading MCP Servers...') }}</p>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="text-center py-12 text-destructive">
            <Icon icon="lucide:alert-triangle" class="h-12 w-12 mx-auto mb-2"/>
            <p>{{ error }}</p>
            <Button variant="outline" class="mt-4" @click="fetchMcpServers">
              {{ t('mcp.marketplace.retry', 'Retry') }}
            </Button>
          </div>

          <!-- Server Grid -->
          <div v-else-if="filteredMcpServers.length > 0"
               class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <div v-for="server in filteredMcpServers" :key="server.id"
                 class="bg-card border border-border rounded-lg p-3 sm:p-4 shadow-sm hover:shadow-xl transition-all duration-200 ease-in-out transform hover:-translate-y-1 flex flex-col cursor-pointer"
                 @click="openServerDetailModal(server)">

              <div class="flex items-start mb-2">
                <img :src="server.image_url || 'https://placehold.co/100x100?text=' + server.name.charAt(0)" :alt="server.name"
                     class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg mr-3 object-cover flex-shrink-0 shadow"/>
                <div class="flex-grow min-w-0">
                  <h3 class="text-base font-semibold truncate leading-tight" :title="server.name">{{ server.name }}</h3>
                  <p class="text-xs text-muted-foreground">By: {{ server.by || t('mcp.marketplace.unknown', 'Unknown') }}</p>
                </div>
                <Icon icon="lucide:star"
                      class="h-4 w-4 text-yellow-400 fill-current ml-2 flex-shrink-0 cursor-pointer hover:text-yellow-300"/>
              </div>

              <p class="text-xs text-muted-foreground line-clamp-3 flex-grow mb-3 leading-relaxed">
                {{ server.description || t('mcp.marketplace.noDescription', 'No description available.') }}
              </p>

              <div class="mt-auto pt-2 border-t border-border/60">
                <div v-if="server.tags && server.tags.length > 0" class="flex flex-wrap gap-1">
                        <span v-for="tag in server.tags.slice(0, 3)" :key="tag"
                              class="px-2 py-0.5 text-[10px] bg-muted text-muted-foreground rounded-full font-medium">
                          {{ tag }}
                        </span>
                </div>
                <div v-else class="text-[10px] text-muted-foreground italic">
                  {{ t('mcp.marketplace.noTags', 'No tags') }}
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="text-center py-12 text-muted-foreground">
            <Icon icon="lucide:server-off" class="h-12 w-12 mx-auto mb-2 text-gray-400"/>
            <p>{{ t('mcp.marketplace.noResults', 'No MCP Servers found matching your criteria.') }}</p>
          </div>

          <!-- Pagination Controls -->
          <div v-if="totalPages > 1" class="flex justify-center items-center gap-2 mt-6">
            <!-- Previous Page Button -->
            <Button
              variant="outline"
              size="icon"
              :disabled="currentPage === 0"
              @click="handlePageChange(currentPage - 1)"
            >
              <Icon icon="lucide:chevron-left" class="h-4 w-4" />
            </Button>

            <!-- First Page Button (if not in visible range) -->
            <div v-if="visiblePageNumbers[0] > 1" class="flex items-center">
              <Button
                variant="outline"
                size="sm"
                @click="handlePageChange(0)"
                class="min-w-[32px]"
              >
                1
              </Button>
              <!-- Ellipsis after first page if needed -->
              <div v-if="visiblePageNumbers[0] > 2" class="mx-1 text-muted-foreground">...</div>
            </div>

            <!-- Visible Page Numbers (limited to 5) -->
            <div v-for="page in visiblePageNumbers" :key="page" class="flex items-center">
              <Button
                :variant="currentPage === page - 1 ? 'default' : 'outline'"
                size="sm"
                @click="handlePageChange(page - 1)"
                class="min-w-[32px]"
              >
                {{ page }}
              </Button>
            </div>

            <!-- Last Page Button (if not in visible range) -->
            <div v-if="visiblePageNumbers[visiblePageNumbers.length - 1] < totalPages" class="flex items-center">
              <!-- Ellipsis before last page if needed -->
              <div v-if="visiblePageNumbers[visiblePageNumbers.length - 1] < totalPages - 1" class="mx-1 text-muted-foreground">...</div>
              <Button
                variant="outline"
                size="sm"
                @click="handlePageChange(totalPages - 1)"
                class="min-w-[32px]"
              >
                {{ totalPages }}
              </Button>
            </div>

            <!-- Next Page Button -->
            <Button
              variant="outline"
              size="icon"
              :disabled="currentPage === totalPages - 1"
              @click="handlePageChange(currentPage + 1)"
            >
              <Icon icon="lucide:chevron-right" class="h-4 w-4" />
            </Button>
          </div>
        </ScrollArea>
      </div>

      <!-- 调试工具选项卡 -->
      <div v-if="activeTab === 'tools'" class="h-full w-full grid grid-cols-[200px_1fr] gap-2 overflow-hidden">
        <!-- 左侧工具列表 -->
        <div class="h-full flex flex-col overflow-hidden border-r pr-2">
          <ScrollArea class="h-full w-full">
            <div v-if="mcpStore.toolsLoading" class="flex justify-center py-4">
              <Icon icon="lucide:loader" class="h-6 w-6 animate-spin" />
            </div>

            <div v-else-if="mcpStore.tools.length === 0" class="text-center py-4 text-sm text-muted-foreground">
              {{ t('mcp.tools.noToolsAvailable') }}
            </div>

            <div v-else class="space-y-1">
              <div v-for="tool in mcpStore.tools" :key="tool.function.name"
                class="p-2 rounded-md cursor-pointer hover:bg-accent text-sm"
                :class="{ 'bg-accent': selectedTool?.function.name === tool.function.name }" @click="selectTool(tool)">
                <div class="font-medium">{{ tool.function.name }}</div>
                <div class="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {{ tool.function.description }}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        <!-- 右侧操作区域 -->
        <div class="h-full flex flex-col overflow-hidden">
          <ScrollArea class="h-full w-full">
            <div class="px-4">
              <div v-if="!selectedTool" class="text-center text-sm text-muted-foreground py-8">
                {{ t('mcp.tools.selectTool') }}
              </div>

              <div v-else>
                <div class="mb-3">
                  <h3 class="text-sm font-medium">{{ selectedTool.function.name }}</h3>
                  <p class="text-xs text-muted-foreground">
                    {{ selectedTool.function.description }}
                  </p>
                </div>

                <!-- 工具参数说明 -->
                <div v-if="selectedTool.function.parameters?.properties" class="mb-3">
                  <div class="text-xs font-medium mb-2">{{ t('mcp.tools.parameters') }}</div>
                  <div class="space-y-2">
                    <div v-for="(prop, key) in selectedTool.function.parameters.properties" :key="key"
                      class="p-2 bg-muted/50 rounded-md">
                      <div class="flex items-center gap-2">
                        <span class="font-mono text-xs">{{ key }}</span>
                        <span v-if="selectedTool.function.parameters.required?.includes(key)"
                          class="text-xs text-red-500">*</span>
                      </div>
                      <div v-if="prop.description" class="text-xs text-muted-foreground mt-1">
                        {{ prop.description }}
                      </div>
                      <div v-if="prop.type" class="text-xs text-muted-foreground mt-1">
                        {{ t('mcp.tools.type') }}: {{ prop.type }}
                      </div>
                      <div v-if="prop.annotations" class="text-xs text-muted-foreground mt-1">
                        {{ t('mcp.tools.annotations') }}: {{ JSON.stringify(prop.annotations, null, 2) }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 工具参数输入 -->
                <div class="space-y-3 mb-3">
                  <div class="space-y-1">
                    <label class="text-xs font-medium">
                      {{ t('mcp.tools.input') }}
                      <span class="text-red-500">*</span>
                    </label>
                    <textarea v-model="localToolInputs[selectedTool.function.name]"
                      class="flex h-24 w-full rounded-md border border-input bg-transparent px-2 py-1.5 text-xs shadow-sm transition-colors file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                      placeholder="{}" :class="{ 'border-red-500': jsonError[selectedTool.function.name] }" @input="
                        validateJson(
                          localToolInputs[selectedTool.function.name],
                          selectedTool.function.name
                        )
                        "></textarea>
                  </div>
                </div>

                <!-- 调用按钮和结果显示 -->
                <div class="space-y-3">
                  <Button class="w-full" :disabled="mcpStore.toolLoadingStates[selectedTool.function.name] ||
                    jsonError[selectedTool.function.name]
                    " @click="callTool(selectedTool.function.name)">
                    <Icon v-if="mcpStore.toolLoadingStates[selectedTool.function.name]" icon="lucide:loader"
                      class="mr-2 h-4 w-4 animate-spin" />
                    {{
                      mcpStore.toolLoadingStates[selectedTool.function.name]
                        ? t('mcp.tools.runningTool')
                        : t('mcp.tools.executeButton')
                    }}
                  </Button>

                  <div v-if="localToolResults[selectedTool.function.name]" class="mt-3 mb-4">
                    <div class="text-sm font-medium mb-1">{{ t('mcp.tools.resultTitle') }}</div>
                    <pre class="bg-muted p-3 rounded-md text-sm overflow-auto">{{
                      localToolResults[selectedTool.function.name]
                    }}</pre>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>

      <!-- 提示模板选项卡 -->
      <div v-if="activeTab === 'prompts'" class="h-full w-full grid grid-cols-[200px_1fr] gap-2 overflow-hidden">
        <!-- 左侧提示模板列表 -->
        <div class="h-full flex flex-col overflow-hidden border-r pr-2">
          <ScrollArea class="h-full w-full">
            <div v-if="mcpStore.toolsLoading" class="flex justify-center py-4">
              <Icon icon="lucide:loader" class="h-6 w-6 animate-spin" />
            </div>

            <div v-else-if="mcpStore.prompts.length === 0" class="text-center py-4 text-sm text-muted-foreground">
              {{ t('mcp.prompts.noPromptsAvailable') }}
            </div>

            <div v-else class="space-y-1">
              <div v-for="prompt in mcpStore.prompts" :key="prompt.name"
                class="p-2 rounded-md cursor-pointer hover:bg-accent text-sm"
                :class="{ 'bg-accent': selectedPrompt === prompt.name }" @click="selectPrompt(prompt)">
                <div class="font-medium">{{ prompt.name }}</div>
                <div class="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {{ prompt.description || t('mcp.prompts.noDescription') }}
                </div>
                <div class="text-xs text-muted-foreground mt-1">
                  {{ prompt.client.name }}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        <!-- 右侧操作区域 -->
        <div class="h-full flex flex-col overflow-hidden">
          <ScrollArea class="h-full w-full">
            <div class="px-4">
              <div v-if="!selectedPrompt" class="text-center text-sm text-muted-foreground py-8">
                {{ t('mcp.prompts.selectPrompt') }}
              </div>

              <div v-else>
                <div class="mb-3">
                  <h3 class="text-sm font-medium">{{ selectedPrompt }}</h3>
                  <p v-if="selectedPromptObj?.description" class="text-xs text-muted-foreground">
                    {{ selectedPromptObj.description }}
                  </p>
                </div>

                <!-- 提示参数输入 -->
                <div class="space-y-3 mb-3">
                  <div class="space-y-1">
                    <div class="flex justify-between items-center">
                      <label class="text-xs font-medium">
                        {{ t('mcp.prompts.parameters') }}
                      </label>
                      <Button variant="ghost" size="sm" class="h-6 text-xs" @click="promptParams = defaultPromptParams">
                        <Icon icon="lucide:refresh-cw" class="mr-1 h-3 w-3" />
                        {{ t('mcp.prompts.resetToDefault') }}
                      </Button>
                    </div>

                    <!-- 参数描述区域 -->
                    <div v-if="promptArgsDescription.length > 0" class="mb-2 p-2 bg-muted/50 rounded-md">
                      <div v-for="arg in promptArgsDescription" :key="arg.name"
                        class="text-xs text-muted-foreground mb-1 last:mb-0">
                        <span class="font-medium">{{ arg.name }}</span>
                        <span v-if="arg.required" class="ml-1 text-red-500">*</span>
                        <span class="ml-1">- {{ arg.description }}</span>
                      </div>
                    </div>

                    <div class="relative">
                      <textarea v-model="promptParams"
                        class="flex h-48 w-full rounded-md border border-input bg-transparent px-2 py-1.5 text-xs shadow-sm transition-colors file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                        placeholder="{}" :class="{ 'border-red-500': jsonPromptError }"
                        @input="validatePromptJson(promptParams)"
                        @blur="promptParams = formatJson(promptParams)"></textarea>
                      <div v-if="jsonPromptError" class="absolute right-2 top-2 text-xs text-red-500">
                        {{ t('mcp.prompts.invalidJson') }}
                      </div>
                    </div>
                    <p class="text-xs text-muted-foreground">
                      {{ t('mcp.prompts.parametersHint') }}
                    </p>
                  </div>
                </div>

                <!-- 调用按钮和结果显示 -->
                <div class="space-y-3">
                  <Button class="w-full" :disabled="promptLoading || jsonPromptError"
                    @click="callPrompt(selectedPromptObj as PromptListEntry)">
                    <Icon v-if="promptLoading" icon="lucide:loader" class="mr-2 h-4 w-4 animate-spin" />
                    {{
                      promptLoading
                        ? t('mcp.prompts.runningPrompt')
                        : t('mcp.prompts.executeButton')
                    }}
                  </Button>

                  <div v-if="promptResult" class="mt-3 mb-4">
                    <div class="text-sm font-medium mb-1">{{ t('mcp.prompts.resultTitle') }}</div>
                    <pre class="bg-muted p-3 rounded-md text-sm overflow-auto">{{
                      promptResult
                    }}</pre>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>

      <!-- 资源选项卡 -->
      <div v-if="activeTab === 'resources'" class="h-full w-full grid grid-cols-[200px_1fr] gap-2 overflow-hidden">
        <!-- 左侧资源列表 -->
        <div class="h-full flex flex-col overflow-hidden border-r pr-2">
          <ScrollArea class="h-full w-full">
            <div v-if="mcpStore.toolsLoading" class="flex justify-center py-4">
              <Icon icon="lucide:loader" class="h-6 w-6 animate-spin" />
            </div>

            <div v-else-if="mcpStore.resources.length === 0" class="text-center py-4 text-sm text-muted-foreground">
              {{ t('mcp.resources.noResourcesAvailable') }}
            </div>

            <div v-else class="space-y-1">
              <div v-for="resource in mcpStore.resources" :key="resource.uri"
                class="p-2 rounded-md cursor-pointer hover:bg-accent text-sm"
                :class="{ 'bg-accent': selectedResource === resource.uri }" @click="selectResource(resource)">
                <div class="font-medium">{{ resource.name || resource.uri }}</div>
                <div class="text-xs text-muted-foreground mt-1">
                  {{ resource.client.name }}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        <!-- 右侧操作区域 -->
        <div class="h-full flex flex-col overflow-hidden">
          <ScrollArea class="h-full w-full">
            <div class="px-4">
              <div v-if="!selectedResource" class="text-center text-sm text-muted-foreground py-8">
                {{ t('mcp.resources.selectResource') }}
              </div>

              <div v-else>
                <div class="mb-3">
                  <h3 class="text-sm font-medium">{{ selectedResource }}</h3>
                  <p class="text-xs text-muted-foreground">
                    {{ selectedResourceObj?.name || '' }}
                  </p>
                </div>

                <!-- 加载资源按钮 -->
                <Button class="w-full mb-3" :disabled="resourceLoading"
                  @click="loadResourceContent(selectedResourceObj as ResourceListEntry)">
                  <Icon v-if="resourceLoading" icon="lucide:loader" class="mr-2 h-4 w-4 animate-spin" />
                  {{
                    resourceLoading ? t('mcp.resources.loading') : t('mcp.resources.loadContent')
                  }}
                </Button>

                <!-- 资源内容显示 -->
                <div class="resource-section mb-4">
                  <div class="resource-content-container">
                    <div v-if="resourceLoading" class="resource-loading">
                      <Icon icon="lucide:loader" class="h-8 w-8 animate-spin" />
                      <h3>{{ t('mcp.resources.loading') }}</h3>
                    </div>
                    <div v-else-if="resourceContent">
                      <div v-if="isJsonContent" class="json-viewer">
                        <span v-for="(part, index) in jsonParts" :key="index" :class="getJsonPartClass(part.type)">{{
                          part.content }}</span>
                      </div>
                      <pre v-else class="resource-raw-content">{{ resourceContent }}</pre>
                    </div>
                    <div v-else class="empty-content">
                      <h3>{{ t('mcp.resources.pleaseSelect') }}</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  </div>

  <!-- 编辑服务器对话框 -->
  <Dialog v-model:open="isEditServerDialogOpen">
    <DialogContent class="w-[640px] px-0 h-[80vh] flex flex-col">
      <DialogHeader class="px-4 flex-shrink-0">
        <DialogTitle>{{ t('settings.mcp.editServerDialog.title') }}</DialogTitle>
      </DialogHeader>
      <McpServerForm v-if="selectedServer && mcpStore.config.mcpServers[selectedServer]" :server-name="selectedServer"
        :initial-config="mcpStore.config.mcpServers[selectedServer]" :edit-mode="true"
        @submit="(name, config) => handleEditServer(name, config)" />
    </DialogContent>
  </Dialog>

  <!-- 删除服务器确认对话框 -->
  <Dialog v-model:open="isRemoveConfirmDialogOpen">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{{ t('settings.mcp.removeServerDialog.title') }}</DialogTitle>
        <DialogDescription>
          {{ t('settings.mcp.confirmRemoveServer', { name: selectedServer }) }}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="isRemoveConfirmDialogOpen = false">
          {{ t('common.cancel') }}
        </Button>
        <Button variant="destructive" @click="confirmRemoveServer">
          {{ t('common.confirm') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  <!-- MCP 서버 상세 모달 -->
  <Dialog v-model:open="isServerDetailModalOpen">
    <DialogContent class="sm:max-w-full max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-3">
          <img v-if="selectedServerDetail?.image_url" :src="selectedServerDetail?.image_url" :alt="selectedServerDetail?.name" class="w-8 h-8 rounded-lg object-cover shadow"/>
          <span>{{ selectedServerDetail?.name }}</span>
        </DialogTitle>
        <DialogDescription class="flex items-center gap-1">
          <span>By: {{ selectedServerDetail?.by }}</span>
          <span v-if="selectedServerDetail?.created_at" class="text-xs text-muted-foreground ml-2">
            Created: {{ new Date(selectedServerDetail.created_at).toLocaleDateString() }}
          </span>
        </DialogDescription>
      </DialogHeader>
      <div class="py-4">
        <div class="mb-4">
          <h4 class="text-sm font-medium mb-1">Description</h4>
          <p class="text-sm text-muted-foreground">{{ selectedServerDetail?.description }}</p>
        </div>
        <div class="mb-10" v-if="selectedServerDetail?.tags">
          <h4 class="text-sm font-medium mb-1">Tags</h4>
          <div class="flex flex-wrap gap-1">
            <span v-for="tag in parseTags(selectedServerDetail?.tags)" :key="tag" class="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full">
              {{ tag }}
            </span>
          </div>
        </div>
        <Button variant="default" @click="isInstallDialogOpen = true">
          {{ t('common.install', 'install') }}
        </Button>
        <div class="mb-4 mt-10" v-if="selectedServerDetail?.data">
          <h4 class="text-sm font-medium mb-1">Server Configuration</h4>
          <div class="bg-muted rounded-md p-3 text-xs font-mono overflow-x-auto">
            <pre>{{ formatJson(selectedServerDetail?.data) }}</pre>
          </div>
        </div>
        <div v-if="selectedServerDetail?.slug" class="text-xs text-muted-foreground">
          <span>Slug: {{ selectedServerDetail?.slug }}</span>
        </div>
        <div class="mb-4" v-if="selectedServerDetail?.overview">
          <h4 class="text-sm font-medium mb-1">Overview</h4>
          <div class="bg-muted rounded-md p-3 text-xs font-mono overflow-x-auto">
            <p  v-html="selectedServerDetail?.overview" />
          </div>
        </div>
        <div class="mb-4" v-if="selectedServerDetail?.content">
          <h4 class="text-sm font-medium mb-1">Content</h4>
          <div class="bg-muted rounded-md p-3 text-xs font-mono overflow-x-auto">
            <p  v-html="selectedServerDetail?.content" />
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="isServerDetailModalOpen = false">
          {{ t('common.close') }}
        </Button>
        <Button variant="default" @click="isInstallDialogOpen = true">
          {{ t('common.install', 'install') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  <!-- MCP Install Dialog -->
  <McpInstallDialog
    v-model:isOpen="isInstallDialogOpen"
    :serverData="serverDataForInstall"
    :serverName="selectedServerDetail?.name"
    @install="handleInstallComplete"
  />
</template>

<style scoped>
/* JSON查看器样式 */
.json-viewer {
  font-family: 'Fira Code', 'Courier New', monospace;
  background-color: var(--color-background-muted);
  border-radius: 8px;
  padding: 16px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 400px;
  overflow-y: auto;
  line-height: 1.6;
  font-size: 14px;
  box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--color-border);
}

.resource-raw-content {
  font-family: 'Fira Code', 'Courier New', monospace;
  background-color: var(--color-background-muted);
  border-radius: 8px;
  padding: 16px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 400px;
  overflow-y: auto;
  line-height: 1.6;
  font-size: 14px;
  border: 1px solid var(--color-border);
}

.json-key {
  color: var(--color-primary);
  font-weight: 600;
}

.json-string {
  color: var(--color-success);
}

.json-number {
  color: var(--color-warning);
}

.json-boolean {
  color: var(--color-info);
}

.json-null {
  color: var(--color-destructive);
  font-style: italic;
}

.json-bracket {
  color: var(--color-foreground);
  font-weight: 600;
}

.resource-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.empty-content {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  border: 1px dashed var(--color-border);
  border-radius: 8px;
  color: var(--color-muted-foreground);
}

.resource-section {
  margin-top: 16px;
}

.resource-content-container {
  margin-top: 8px;
}
</style>
