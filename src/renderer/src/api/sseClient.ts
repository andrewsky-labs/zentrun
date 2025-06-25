import { API_BASE_URL } from './index';
import { processSyncData } from './syncUtils';

/**
 * SSE Client for handling Server-Sent Events
 * This client connects to the server and listens for organization updates
 */
class SSEClient {
  private eventSource: EventSource | null = null;
  private reconnectTimeout: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3 seconds
  private isConnecting = false;

  /**
   * Initialize the SSE connection
   */
  public init(): void {
    if (this.eventSource || this.isConnecting) {
      return;
    }

    this.connect();
  }

  /**
   * Connect to the SSE endpoint
   */
  private connect(): void {
    try {
      this.isConnecting = true;
      const token = localStorage.getItem('jwt'); // Same token used in apiRequest
      const url = `${API_BASE_URL}/sse/sync-zentrun/?token=${token}`;

      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        console.log('SSE connection established');
        this.reconnectAttempts = 0;
      };

      this.eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        this.handleConnectionError();
      };

      // Listen for sync events
      this.eventSource.addEventListener('sync-zentrun', this.handleSync);

      this.isConnecting = false;
    } catch (error) {
      console.error('Failed to connect to SSE:', error);
      this.isConnecting = false;
      this.handleConnectionError();
    }
  }

  /**
   * Handle connection errors and implement reconnection logic
   */
  private handleConnectionError(): void {
    this.close();

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * this.reconnectAttempts;

      console.log(`Attempting to reconnect in ${delay / 1000} seconds (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      this.reconnectTimeout = window.setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached. Giving up.');
    }
  }

  /**
   * Handle sync events
   * Process comprehensive data including organizations, teams, agents, and zents
   */
  private handleSync = (event: MessageEvent): void => {
    try {
      console.log("event");
      console.log(event);
      const syncData = JSON.parse(event.data);
      // Use the common processSyncData function from syncUtils
      processSyncData(syncData);
    } catch (error) {
      console.error('Error handling sync event:', error);
    }
  };


  /**
   * Close the SSE connection
   */
  public close(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }
}

// Create a singleton instance
export const sseClient = new SSEClient();
