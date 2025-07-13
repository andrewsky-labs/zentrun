import { app } from 'electron'
import { spawn, ChildProcess } from 'child_process'
import { IBrowserAutomationPresenter } from '@shared/presenter'
import { ipcMain } from 'electron'
import { presenter } from '..'
import * as net from 'net'

const CDP = require('chrome-remote-interface')

/**
 * Presenter for browser automation using Chrome DevTools Protocol (CDP)
 */
export class BrowserAutomationPresenter implements IBrowserAutomationPresenter {
  private chromeProcess: ChildProcess | null = null
  private cdpClient: any | null = null
  private isRecording: boolean = false
  private recordedActions: any[] = []

  constructor() {
    this.registerIpcHandlers()
  }

  /**
   * Register IPC handlers for renderer process communication
   */
  private registerIpcHandlers() {
    ipcMain.handle('start-chrome-with-cdp', this.startChromeWithCDP.bind(this))
    ipcMain.handle('connect-to-cdp', this.connectToCDP.bind(this))
    ipcMain.handle('start-capturing-actions', this.startCapturingActions.bind(this))
    ipcMain.handle('stop-capturing-actions', this.stopCapturingActions.bind(this))
    ipcMain.handle('generate-automation-code', this.generateAutomationCode.bind(this))
  }

  /**
   * Check if a port is in use
   * @param port The port to check
   * @returns Promise that resolves to true if the port is in use, false otherwise
   */
  private isPortInUse(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer()

      server.once('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          // Port is in use
          resolve(true)
        } else {
          // Some other error occurred
          console.error('Error checking port:', err)
          resolve(false)
        }
      })

      server.once('listening', () => {
        // Port is free, close the server
        server.close()
        resolve(false)
      })

      server.listen(port)
    })
  }

  /**
   * Start Chrome with CDP enabled on port 9222
   */
  private async startChromeWithCDP(): Promise<void> {
    try {
      // Check if port 9222 is already in use
      const portInUse = await this.isPortInUse(9222)

      // If port is already in use, assume Chrome is already running with CDP enabled
      if (portInUse) {
        console.log('Port 9222 is already in use. Assuming Chrome is already running with CDP enabled.')
        return
      }

      // Close any existing Chrome process
      if (this.chromeProcess) {
        this.chromeProcess.kill()
        this.chromeProcess = null
      }

      // Determine Chrome executable path based on platform
      let chromePath = ''
      switch (process.platform) {
        case 'win32':
          chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
          break
        case 'darwin':
          chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
          break
        case 'linux':
          chromePath = '/usr/bin/google-chrome'
          break
        default:
          throw new Error(`Unsupported platform: ${process.platform}`)
      }

      console.log('Starting Chrome with CDP enabled on port 9222...')

      // Start Chrome with remote debugging enabled
      this.chromeProcess = spawn(chromePath, [
        '--remote-debugging-port=9222',
        '--no-first-run',
        '--no-default-browser-check',
        '--user-data-dir=' + app.getPath('userData') + '/ChromeProfile'
      ])

      // Handle process events
      this.chromeProcess.on('error', (err) => {
        console.error('Failed to start Chrome:', err)
      })

      this.chromeProcess.on('exit', (code) => {
        console.log(`Chrome process exited with code ${code}`)
        this.chromeProcess = null
      })

      // Wait for Chrome to start
      await new Promise(resolve => setTimeout(resolve, 2000))
      console.log('Chrome started successfully with CDP enabled')

      return
    } catch (error) {
      console.error('Error starting Chrome with CDP:', error)
      throw error
    }
  }

  /**
   * Connect to Chrome DevTools Protocol
   */
  private async connectToCDP(): Promise<void> {
    try {
      // Close any existing CDP connection
      if (this.cdpClient) {
        await this.cdpClient.close()
        this.cdpClient = null
      }

      // Connect to CDP
      this.cdpClient = await CDP({ port: 9222 })
      console.log('Connected to CDP, client:', this.cdpClient ? 'available' : 'not available')

      // Log available domains
      console.log('Available domains:', Object.keys(this.cdpClient).filter(key => typeof this.cdpClient[key] === 'object'))

      // Enable necessary domains
      const { Network, Page, DOM, Runtime } = this.cdpClient;

      // Enable domains one by one to identify any issues
      await Network.enable();
      console.log('Network domain enabled')
      await Page.enable();
      console.log('Page domain enabled')
      await DOM.enable();
      console.log('DOM domain enabled')
      await Runtime.enable();
      console.log('Runtime domain enabled')

      // Try multiple approaches to enable the Input domain
      try {
        // Use the send method directly without checking for Input domain
        try {
          console.log('Trying to enable Input domain using send method')
          await this.cdpClient.send('Input.enable');
          console.log('Input domain enabled successfully using send method')

          // Set up synthetic event configuration using send method
          try {
            console.log('Configuring Input domain for synthetic events using send method')
            await this.cdpClient.send('Input.setIgnoreInputEvents', { ignore: false });
            console.log('Input domain configured for synthetic events using send method')
          } catch (configSendError) {
            console.error('Error configuring Input domain for synthetic events using send method:', configSendError);
          }
        } catch (sendError) {
          console.error('Error enabling Input domain using send method:', sendError);

          // Try using command method as fallback
          try {
            console.log('Trying to enable Input domain using command method')
            await this.cdpClient.command('Input.enable');
            console.log('Input domain enabled successfully using command method')

            // Set up synthetic event configuration using command method
            try {
              console.log('Configuring Input domain for synthetic events using command method')
              await this.cdpClient.command('Input.setIgnoreInputEvents', { ignore: false });
              console.log('Input domain configured for synthetic events using command method')
            } catch (configCommandError) {
              console.error('Error configuring Input domain for synthetic events using command method:', configCommandError);
            }
          } catch (commandError) {
            console.error('Error enabling Input domain using command method:', commandError);
            console.warn('Failed to enable Input domain using all available methods');
            // Don't throw an error, just continue without Input domain
          }
        }
      } catch (inputError) {
        console.error('Error enabling Input domain:', inputError);
        // Continue without Input domain if it fails, but log a warning
        console.warn('Continuing without Input domain - mouse and keyboard events will not be captured');
      }

      // Always try to enable DOM events explicitly, regardless of Input domain status
      try {
        console.log('Enabling DOM events for capturing user interactions')
        await this.enableDOMEvents();
        console.log('DOM events enabled successfully')
      } catch (domEventsError) {
        console.error('Error enabling DOM events:', domEventsError);
      }

      return
    } catch (error) {
      console.error('Error connecting to CDP:', error)
      throw error
    }
  }

  /**
   * Start capturing user actions
   */
  private async startCapturingActions(): Promise<void> {
    try {
      if (!this.cdpClient) {
        throw new Error('CDP client not connected')
      }

      this.isRecording = true
      this.recordedActions = []

      console.log('Starting to capture actions, CDP client available:', !!this.cdpClient)

      // Set up event listeners for user actions
      const { DOM, Runtime } = this.cdpClient;

      // Define handlers for each event type
      const handleMousePressed = async (event) => {
        console.log('Mouse pressed event received:', event)
        if (!this.isRecording) return

        try {
          // Get the element at the click position
          console.log('Getting node for location:', event.x, event.y)
          const { nodeId } = await DOM.getNodeForLocation({
            x: event.x,
            y: event.y
          })
          console.log('Node ID:', nodeId)

          // Get element details
          console.log('Getting node details for nodeId:', nodeId)
          const { node } = await DOM.describeNode({ nodeId })
          console.log('Node details:', node)

          // Create a selector for the element
          console.log('Creating selector for nodeId:', nodeId)
          const selector = await this.createSelector(nodeId)
          console.log('Generated selector:', selector)

          const clickAction = {
            type: 'click',
            x: event.x,
            y: event.y,
            selector,
            tagName: node.nodeName,
            attributes: node.attributes,
            elementHTML: selector // Include the outerHTML as elementHTML
          };

          console.log('Adding click action to recorded actions:', clickAction)
          this.recordedActions.push(clickAction)

          // Send the action to the renderer process
          if (presenter.windowPresenter.mainWindow) {
            console.log('Sending click action to renderer process')
            presenter.windowPresenter.mainWindow.webContents.send('action-captured', clickAction) // Send the entire clickAction object
          }
        } catch (error) {
          console.error('Error processing click event:', error)
        }
      };

      const handleKeyDown = (event) => {
        console.log('Key down event received:', event)
        if (!this.isRecording) return

        // Only record printable characters and special keys
        if (event.text || ['Enter', 'Tab', 'Backspace', 'Delete', 'Escape'].includes(event.key)) {
          const keyAction = {
            type: 'keyDown',
            key: event.key,
            text: event.text
          };

          console.log('Adding key action to recorded actions:', keyAction)
          this.recordedActions.push(keyAction)

          // Send the action to the renderer process
          if (presenter.windowPresenter.mainWindow) {
            console.log('Sending key action to renderer process')
            presenter.windowPresenter.mainWindow.webContents.send('action-captured', keyAction)
          }
        }
      };

      const handleFrameNavigated = (event) => {
        console.log('Frame navigated event received:', event)
        if (!this.isRecording || !event.frame.url) return

        const navigationAction = {
          type: 'navigation',
          url: event.frame.url
        };

        console.log('Adding navigation action to recorded actions:', navigationAction)
        this.recordedActions.push(navigationAction)

        // Send the action to the renderer process
        if (presenter.windowPresenter.mainWindow) {
          console.log('Sending navigation action to renderer process')
          presenter.windowPresenter.mainWindow.webContents.send('action-captured', navigationAction)
        }

        // Re-enable DOM events after navigation
        setTimeout(async () => {
          try {
            console.log('Page navigated, re-enabling DOM events after timeout')
            await this.enableDOMEvents();
            console.log('DOM events re-enabled after navigation')
          } catch (error) {
            console.error('Error re-enabling DOM events after navigation timeout:', error)
          }
        }, 1000); // Wait 1 second for page to load
      };

      // Set up a console message handler to capture DOM events from the page
      const handleConsoleMessage = (event) => {
        console.log('Console message received:', event)

        try {
          // Check if this is a DOM_EVENT_DATA message (unified event data)
          // First check in args
          if (event.args && event.args.length >= 2 &&
              event.args[0].value === 'DOM_EVENT_DATA:' &&
              event.args[1].value) {
            try {
              // Parse the JSON data
              const eventData = JSON.parse(event.args[1].value);
              console.log('Parsed DOM_EVENT_DATA from args:', eventData);

              // Process the event based on its type
              if (eventData.type === 'click' || eventData.type === 'mousedown') {
                processUnifiedClickEvent(eventData);
              } else if (eventData.type === 'input' || eventData.type === 'change') {
                processUnifiedInputEvent(eventData);
              } else if (eventData.type === 'submit') {
                processUnifiedFormSubmitEvent(eventData);
              }

              return; // Skip further processing for this event
            } catch (jsonError) {
              console.error('Error parsing DOM_EVENT_DATA JSON from args:', jsonError);
            }
          }

          // Then check in text
          if (event.text && event.text.includes('DOM_EVENT_DATA:')) {
            try {
              // Extract and parse the JSON data
              const jsonStr = event.text.substring(event.text.indexOf('DOM_EVENT_DATA:') + 'DOM_EVENT_DATA:'.length).trim();
              const eventData = JSON.parse(jsonStr);
              console.log('Parsed DOM_EVENT_DATA from text:', eventData);

              // Process the event based on its type
              if (eventData.type === 'click' || eventData.type === 'mousedown') {
                processUnifiedClickEvent(eventData);
              } else if (eventData.type === 'input' || eventData.type === 'change') {
                processUnifiedInputEvent(eventData);
              } else if (eventData.type === 'submit') {
                processUnifiedFormSubmitEvent(eventData);
              }

              return; // Skip further processing for this event
            } catch (jsonError) {
              console.error('Error parsing DOM_EVENT_DATA JSON from text:', jsonError);
            }
          }

          // If we get here, it's not a DOM_EVENT_DATA message, so we'll ignore it
          // We're only interested in the unified event data format
        } catch (error) {
          console.error('Error processing console message:', error)
        }
      };

      // Process unified click events from DOM_EVENT_DATA
      const processUnifiedClickEvent = function(eventData) {
        try {
          console.log('Processing unified click event:', eventData);

          // Extract relevant information from the simplified event data
          const type = 'click';
          // Use clientX/clientY which are now at the top level in the simplified format
          const x = eventData.clientX || 0;
          const y = eventData.clientY || 0;
          const selector = eventData.selector || '';
          const tagName = eventData.target?.tagName || 'unknown';
          const id = eventData.target?.id || '';
          const name = eventData.target?.name || '';

          // Generate unique element identifier
          const howToDetect = this.generateUniqueElementIdentifier(eventData.target?.outerHTML || '');

          // Create a click action with essential information
          const clickAction = {
            type: type,
            x: x,
            y: y,
            selector: selector,
            outerHTML: eventData.target?.outerHTML,
            tagName: tagName,
            id: id,
            name: name,
            howToDetect: howToDetect,
            source: 'dom-event-unified'
          };

          console.log('Adding unified DOM click action to recorded actions:', clickAction);
          // Always push to the recordedActions array
          this.recordedActions.push(clickAction);

          // Send the action to the renderer process
          if (presenter.windowPresenter.mainWindow) {
            console.log('Sending unified DOM click action to renderer process');
            presenter.windowPresenter.mainWindow.webContents.send('action-captured', clickAction);
          }
        } catch (error) {
          console.error('Error processing unified click event:', error);
        }
      }.bind(this);

      // Process unified input events from DOM_EVENT_DATA
      const processUnifiedInputEvent = function(eventData) {
        try {
          console.log('Processing unified input event:', eventData);

          // Extract relevant information from the simplified event data
          // In the new format, value is directly in eventData or in target
          const inputText = eventData.value || eventData.target?.value || '';
          const selector = eventData.selector || '';
          const tagName = eventData.target?.tagName || 'input';
          const inputType = eventData.target?.type || 'text';
          const inputName = eventData.target?.name || '';
          const inputId = eventData.target?.id || '';

          // Generate unique element identifier
          const howToDetect = this.generateUniqueElementIdentifier(eventData.target?.outerHTML || '');

          // Create a key action with essential information
          const keyAction = {
            type: 'keyDown',
            text: inputText,
            selector: selector,
            outerHTML: eventData.target?.outerHTML,
            tagName: tagName,
            inputType: inputType,
            inputName: inputName,
            inputId: inputId,
            howToDetect: howToDetect,
            source: 'dom-event-unified'
          };

          console.log('Adding unified input action to recorded actions:', keyAction);
          // Always push to the recordedActions array
          this.recordedActions.push(keyAction);

          // Send the action to the renderer process
          if (presenter.windowPresenter.mainWindow) {
            console.log('Sending unified input action to renderer process');
            presenter.windowPresenter.mainWindow.webContents.send('action-captured', keyAction);
          }
        } catch (error) {
          console.error('Error processing unified input event:', error);
        }
      }.bind(this);

      // Process unified form submission events from DOM_EVENT_DATA
      const processUnifiedFormSubmitEvent = function(eventData) {
        try {
          console.log('Processing unified form submission event:', eventData);

          // Extract relevant information from the simplified event data
          const formData = eventData.formData || {};
          const selector = eventData.selector || '';
          const tagName = eventData.target?.tagName || 'form';
          const id = eventData.target?.id || '';
          const name = eventData.target?.name || '';

          // Generate unique element identifier
          const howToDetect = this.generateUniqueElementIdentifier(eventData.target?.outerHTML || '');

          // Create a form submission action with essential information
          const formAction = {
            type: 'submit',
            formData: formData,
            selector: selector,
            outerHTML: eventData.target?.outerHTML,
            tagName: tagName,
            id: id,
            name: name,
            howToDetect: howToDetect,
            source: 'dom-event-unified'
          };

          console.log('Adding unified form submission action to recorded actions:', formAction);
          // Always push to the recordedActions array
          this.recordedActions.push(formAction);

          // Send the action to the renderer process
          if (presenter.windowPresenter.mainWindow) {
            console.log('Sending unified form submission action to renderer process');
            presenter.windowPresenter.mainWindow.webContents.send('action-captured', formAction);
          }
        } catch (error) {
          console.error('Error processing unified form submission event:', error);
        }
      }.bind(this);

      // Try multiple approaches to register event listeners
      console.log('Registering event listeners...')

      // First, make sure DOM events are enabled
      await this.enableDOMEvents();
      console.log('DOM events enabled before registering listeners')

      try {
        // First approach: using the on method
        console.log('Trying to register event listeners using on method')
        this.cdpClient.on('Input.mousePressed', handleMousePressed);
        this.cdpClient.on('Input.keyDown', handleKeyDown);
        this.cdpClient.on('Page.frameNavigated', handleFrameNavigated);
        this.cdpClient.on('Runtime.consoleAPICalled', handleConsoleMessage);
        console.log('Event listeners registered successfully using on method')
      } catch (onError) {
        console.error('Error setting up event listeners using on method:', onError);

        try {
          // Second approach: using the addListener method
          console.log('Trying to register event listeners using addListener method')
          if (typeof this.cdpClient.addListener === 'function') {
            this.cdpClient.addListener('Input.mousePressed', handleMousePressed);
            this.cdpClient.addListener('Input.keyDown', handleKeyDown);
            this.cdpClient.addListener('Page.frameNavigated', handleFrameNavigated);
            this.cdpClient.addListener('Runtime.consoleAPICalled', handleConsoleMessage);
            console.log('Event listeners registered successfully using addListener method')
          } else {
            throw new Error('addListener method not available');
          }
        } catch (addListenerError) {
          console.error('Error setting up event listeners using addListener method:', addListenerError);

          // Third approach: using domain-specific event registration
          console.log('Trying to register event listeners using domain-specific event registration')
          try {
            if (this.cdpClient.Input) {
              console.log('Registering Input domain event listeners')
              this.cdpClient.Input.mousePressed(handleMousePressed);
              this.cdpClient.Input.keyDown(handleKeyDown);
            } else {
              console.warn('Input domain not available for event registration');
            }

            if (this.cdpClient.Page) {
              console.log('Registering Page domain event listener')
              this.cdpClient.Page.frameNavigated(handleFrameNavigated);
            } else {
              console.warn('Page domain not available for event registration');
            }

            if (this.cdpClient.Runtime) {
              console.log('Registering Runtime domain event listener')
              this.cdpClient.Runtime.consoleAPICalled(handleConsoleMessage);
            } else {
              console.warn('Runtime domain not available for event registration');
            }
          } catch (domainError) {
            console.error('Error setting up domain-specific event listeners:', domainError);
            console.warn('Failed to register event listeners using all available methods');
            console.warn('Only navigation events may be captured');
          }
        }
      }

      return
    } catch (error) {
      console.error('Error starting action capture:', error)
      throw error
    }
  }

  /**
   * Stop capturing user actions
   */
  private async stopCapturingActions(): Promise<void> {
    try {
      this.isRecording = false

      // Close CDP connection
      if (this.cdpClient) {
        console.log('Closing CDP connection...')
        await this.cdpClient.close()
        this.cdpClient = null
        console.log('CDP connection closed')
      }

      // Close Chrome process only if it was started by this presenter
      if (this.chromeProcess) {
        console.log('Killing Chrome process that was started by this presenter...')
        // Force kill the process to ensure it's terminated
        // this.chromeProcess.kill('SIGKILL')
        // this.chromeProcess.stdin.pause();
        this.chromeProcess.kill();
        this.chromeProcess = null
        console.log('Chrome process killed')
      } else {
        console.log('No Chrome process to kill or Chrome was not started by this presenter')
      }

      return
    } catch (error) {
      console.error('Error stopping action capture:', error)
      throw error
    }
  }

  /**
   * Generate a unique element identifier based on outerHTML
   * This function analyzes the HTML and determines the best way to uniquely identify the element
   */
  private generateUniqueElementIdentifier(outerHTML: string): any {
    if (!outerHTML) {
      return { type: 'unknown', value: null };
    }

    try {
      // Use regex to extract information from the outerHTML since we're in Node.js environment
      // Extract tag name
      const tagMatch = outerHTML.match(/<([a-zA-Z0-9]+)/);
      const tagName = tagMatch ? tagMatch[1].toLowerCase() : 'unknown';

      // Extract id attribute
      const idMatch = outerHTML.match(/id=["']([^"']*)["']/);
      const id = idMatch ? idMatch[1] : '';

      // Extract class attribute
      const classMatch = outerHTML.match(/class=["']([^"']*)["']/);
      const className = classMatch ? classMatch[1] : '';

      // Extract text content from HTML (handling nested tags)
      let textContent = this.extractTextFromHTML(outerHTML);
      console.log("textContent");
      console.log(textContent);

      // Extract other attributes
      const attributeRegex = /([a-zA-Z0-9_-]+)=["']([^"']*)["']/g;
      const attributes: Array<{name: string, value: string}> = [];
      let attrMatch;
      while ((attrMatch = attributeRegex.exec(outerHTML)) !== null) {
        const attrName = attrMatch[1];
        if (attrName !== 'id' && attrName !== 'class') {
          attributes.push({ name: attrName, value: attrMatch[2] });
        }
      }

      // Priority order for identification:
      // 1. ID (most specific)
      if (id) {
        return {
          type: 'id',
          value: id,
          selector: `#${id}`
        };
      }

      // 2. ID + class combination
      if (id && className) {
        return {
          type: 'id_class',
          value: { id, class: className },
          selector: `#${id}.${className.replace(/\s+/g, '.')}`
        };
      }

      // 3. Tag + text content (for elements with text)
      if (tagName && textContent && textContent.length > 0 && textContent.length < 50) {
        return {
          type: 'tag_text',
          value: { tag: tagName, text: textContent },
          selector: `${tagName}:contains("${textContent}")`
        };
      }

      // 4. Tag + class combination
      if (tagName && className) {
        return {
          type: 'tag_class',
          value: { tag: tagName, class: className, textContent: textContent },
          selector: `${tagName}.${className.replace(/\s+/g, '.')}`
        };
      }

      // 5. Tag + attribute (for elements with distinctive attributes)
      if (tagName && attributes.length > 0) {
        const attr = attributes[0]; // Use the first non-id, non-class attribute
        return {
          type: 'tag_attr',
          value: { tag: tagName, attr: attr.name, attrValue: attr.value, textContent: textContent },
          selector: `${tagName}[${attr.name}="${attr.value}"]`
        };
      }

      // 6. Class only
      if (className) {
        return {
          type: 'class',
          value: className,
          selector: `.${className.replace(/\s+/g, '.')}`
        };
      }

      // 7. Tag + position (least specific, but can work as fallback)
      return {
        type: 'tag_position',
        value: { tag: tagName, outerHTML: outerHTML, textContent: textContent },
        selector: tagName,
        note: 'Multiple elements may match this selector. Use with nth-child or similar to specify exact element.'
      };
    } catch (error) {
      console.error('Error generating unique element identifier:', error);
      return {
        type: 'raw_html',
        value: outerHTML,
        note: 'Failed to parse HTML. Using raw outerHTML as fallback.'
      };
    }
  }

  /**
   * Create a CSS selector for a DOM node
   */
  private async createSelector(nodeId: number): Promise<string> {
    if (!this.cdpClient) {
      console.warn('Cannot create selector: CDP client not available')
      return ''
    }

    try {
      // Get the object ID for the node
      console.log('Resolving node ID to object:', nodeId)
      const { object } = await this.cdpClient.DOM.resolveNode({ nodeId })
      console.log('Resolved object:', object)

      if (!object || !object.objectId) {
        console.warn('Cannot create selector: No valid object ID for node')
        return ''
      }

      // Execute a function to get a unique selector for the element
      console.log('Calling function on object to get selector')
      const result = await this.cdpClient.Runtime.callFunctionOn({
        objectId: object.objectId,
        functionDeclaration: `
          function() {
            function getSelector(el) {
              try {
                // Directly return the outerHTML as the selector
                return el.outerHTML;
              } catch (error) {
                console.error('Error getting outerHTML:', error);
                return el.tagName ? el.tagName.toLowerCase() : 'unknown';
              }
            }

            return getSelector(this);
          }
        `,
        returnByValue: true
      })
      console.log('Function result:', result)

      if (!result || !result.result || typeof result.result.value !== 'string') {
        console.warn('Failed to generate selector: Invalid result', result)
        return ''
      }

      console.log('Generated selector:', result.result.value)
      return result.result.value || ''
    } catch (error) {
      console.error('Error creating selector:', error)
      return ''
    }
  }

  /**
   * Recursively sanitize an object to ensure it can be safely stringified
   * Handles circular references, non-serializable types, and truncates long strings
   */
  private sanitizeForJSON(obj: any, maxDepth: number = 10, currentDepth: number = 0): any {
    // Base case: if we've gone too deep or the object is null/undefined
    if (currentDepth > maxDepth || obj === null || obj === undefined) {
      return obj;
    }

    // Handle different types
    if (typeof obj === 'function') {
      return '[Function]'; // Replace functions with a placeholder
    }

    if (typeof obj === 'symbol') {
      return obj.toString(); // Convert symbols to strings
    }

    if (typeof obj !== 'object') {
      // For primitive types (string, number, boolean)
      if (typeof obj === 'string' && obj.length > 1000) {
        return obj.substring(0, 1000) + '...'; // Truncate long strings
      }
      return obj;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeForJSON(item, maxDepth, currentDepth + 1));
    }

    // Handle objects
    const sanitized: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        try {
          sanitized[key] = this.sanitizeForJSON(obj[key], maxDepth, currentDepth + 1);
        } catch (error) {
          sanitized[key] = '[Sanitized: Non-serializable data]';
        }
      }
    }
    return sanitized;
  }

  /**
   * Generate automation code from recorded actions
   * This function sanitizes the actions to ensure they can be safely stringified,
   * then uses an LLM to generate Python code that reproduces the recorded actions
   */
  private async generateAutomationCode(actions): Promise<string> {
    try {
      console.log("generateAutomationCode: " , actions);

      // Sanitize actions to ensure they can be safely stringified
      const sanitizedActions = this.sanitizeForJSON(actions);

      // Try to stringify the sanitized actions
      let formattedActions;
      try {
        formattedActions = JSON.stringify(sanitizedActions, null, 2);
      } catch (error) {
        console.error('Error stringifying sanitized actions:', error);
        // If we still can't stringify, create a simplified version with just essential properties
        const simplifiedActions = actions.map(action => ({
          type: action.type || 'unknown',
          selector: typeof action.selector === 'string' ? action.selector : '[Complex selector]',
          tagName: action.tagName || 'unknown',
          // Include other essential properties based on action type
          ...(action.type === 'click' && { x: action.x, y: action.y }),
          ...(action.type === 'keyDown' && { text: action.text }),
          ...(action.type === 'navigation' && { url: action.url })
        }));
        formattedActions = JSON.stringify(simplifiedActions, null, 2);
      }

      // Create a prompt for the LLM
      const prompt = `
I need to create a browser automation script based on the following recorded user actions:

\`\`\`json
${formattedActions}
\`\`\`

Please generate a Python script using Selenium and Chrome DevTools Protocol (CDP) that reproduces these actions.
The script should:
1. Initialize Chrome with CDP enabled on port 9222
2. Connect to CDP
3. Navigate to the URLs and perform the recorded actions (clicks, keyboard inputs, etc.)
4. Use both Selenium for high-level actions and CDP for more complex interactions
5. Include proper error handling and waiting for elements
6. Be well-commented and easy to understand

Please provide only the Python code without any explanations.
      `.trim()

      // Use the LLM provider to generate the code
      const response = await presenter.llmproviderPresenter.generateCompletionStandalone({
        model: presenter.configPresenter.getDefaultModel(),
        provider: presenter.configPresenter.getDefaultProvider(),
        messages: [
          {
            role: 'system',
            content: 'You are an expert in browser automation. Generate clean, working Python code using Selenium and Chrome DevTools Protocol.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2000
      })

      // Extract the code from the response
      let code = response.content

      // If the response contains markdown code blocks, extract just the code
      if (code.includes('```python')) {
        code = code.split('```python')[1].split('```')[0].trim()
      } else if (code.includes('```')) {
        code = code.split('```')[1].split('```')[0].trim()
      }

      return code
    } catch (error) {
      console.error('Error generating automation code:', error)
      throw error
    }
  }

  /**
   * Enable DOM events for capturing user interactions
   */
  private async enableDOMEvents(): Promise<void> {
    if (!this.cdpClient) {
      throw new Error('CDP client not connected')
    }

    try {
      // Enable DOM events using Runtime.evaluate
      const script = `
        (function() {
          console.log('Zentrun DOM event capture script starting...');

          // Add event listeners to capture all user interactions
          const eventTypes = [
            'click', 'mousedown', 'keypress',
            'input', 'change', 'submit'
          ];

          // Remove any existing listeners first to avoid duplicates
          if (window.__zentrunEventHandler) {
            console.log('Removing existing Zentrun event listeners');
            eventTypes.forEach(type => {
              document.removeEventListener(type, window.__zentrunEventHandler, true);
            });
          }

          // Define a global event handler with a unique name
          window.__zentrunEventHandler = function(event) {
            try {
              // Skip events on document or window
              if (event.target === document || event.target === window) {
                return;
              }

              const target = event.target;

              // Extract only essential target data
              const targetData = {
                tagName: target.tagName ? target.tagName.toLowerCase() : 'unknown',
                id: target.id || '',
                name: target.name || '',
                type: target.type || '',
                outerHTML: event.target.outerHTML || '',
                value: target.value || ''
              };

              // Create a simplified event data object with only essential information
              let eventData = {
                type: event.type,
                target: targetData
              };

              // Add event-specific data
              if (event.type === 'click' || event.type === 'mousedown') {
                // For click events, add coordinates
                eventData.clientX = event.clientX;
                eventData.clientY = event.clientY;
              } else if (event.type === 'input' || event.type === 'change') {
                // For input events, ensure value is captured
                eventData.value = target.value || '';
              } else if (event.type === 'submit') {
                // For form submissions, capture basic form data
                const formData = {};
                if (target.form) {
                  const formElements = target.form.elements;
                  for (let i = 0; i < formElements.length; i++) {
                    const element = formElements[i];
                    if (element.name) {
                      formData[element.name] = element.value;
                    }
                  }
                  eventData.formData = formData;
                }
              }

              // Generate a simple selector for the element
              let selector = '';
              try {
                if (target.id) {
                  selector = '#' + CSS.escape(target.id);
                } else if (target.name) {
                  selector = targetData.tagName + '[name="' + CSS.escape(target.name) + '"]';
                } else {
                  selector = targetData.tagName;
                }
                eventData.selector = selector;
              } catch (error) {
                console.error('Error generating selector:', error);
              }

              // Log the simplified event data as a single message
              console.log('DOM_EVENT_DATA:', JSON.stringify(eventData));
            } catch (error) {
              console.error('Error getting target details:', error);
            }
          };

          // Add listeners for all event types with capture phase
          console.log('Adding Zentrun event listeners for:', eventTypes.join(', '));
          eventTypes.forEach(type => {
            document.addEventListener(type, window.__zentrunEventHandler, true);
          });

          // Add a MutationObserver to handle dynamically added content
          if (!window.__zentrunMutationObserver) {
            console.log('Setting up Zentrun MutationObserver');
            window.__zentrunMutationObserver = new MutationObserver(function(mutations) {
              console.log('DOM mutations detected');
              // No need to re-apply event listeners since they're added to the document
            });

            // Start observing the document with the configured parameters
            window.__zentrunMutationObserver.observe(document.body || document.documentElement, {
              childList: true,
              subtree: true
            });
          }

          console.log('Zentrun DOM event capture script installed successfully');
          return 'Zentrun DOM event listeners registered successfully';
        })();
      `;

      // Execute the script in the page context
      const result = await this.cdpClient.Runtime.evaluate({
        expression: script,
        returnByValue: true,
        awaitPromise: false
      });

      console.log('DOM events setup result:', result);

      // Also try to execute the script in all frames
      try {
        const { frameTree } = await this.cdpClient.Page.getFrameTree();
        console.log('Frame tree:', frameTree);

        // Execute the script in each frame
        const processFrame = async (frame) => {
          try {
            console.log('Injecting DOM events script into frame:', frame.frame.id);
            const frameResult = await this.cdpClient.Runtime.evaluate({
              expression: script,
              contextId: frame.frame.executionContextId,
              returnByValue: true,
              awaitPromise: false
            });
            console.log('Frame DOM events setup result:', frameResult);
          } catch (frameError) {
            console.error('Error injecting DOM events into frame:', frame.frame.id, frameError);
          }

          // Process child frames recursively
          if (frame.childFrames) {
            for (const childFrame of frame.childFrames) {
              await processFrame(childFrame);
            }
          }
        };

        if (frameTree.childFrames) {
          for (const childFrame of frameTree.childFrames) {
            await processFrame(childFrame);
          }
        }
      } catch (frameError) {
        console.error('Error processing frames for DOM events:', frameError);
      }

      return;
    } catch (error) {
      console.error('Error enabling DOM events:', error);
      throw error;
    }
  }

  /**
   * Extract text content from HTML string, handling nested tags
   * @param html The HTML string to extract text from
   * @returns The extracted text content
   */
  private extractTextFromHTML(html: string): string {
    if (!html) return '';

    try {
      console.log('Original HTML:', html);

      // Step 1: Remove all script and style tags and their content
      let cleanHtml = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
      console.log('After removing script/style tags:', cleanHtml);

      // Step 2: Use a more robust approach to extract text from nested HTML
      // This recursive function extracts text from HTML by handling nested tags
      const extractTextRecursively = (htmlStr: string): string => {
        // Base case: if the string doesn't contain any HTML tags, return it
        if (!htmlStr.includes('<')) return htmlStr;

        let result = '';
        let inTag = false;
        let currentText = '';

        for (let i = 0; i < htmlStr.length; i++) {
          const char = htmlStr[i];

          if (char === '<') {
            // We're entering a tag
            inTag = true;
            // Add any accumulated text to the result
            if (currentText) {
              result += currentText;
              currentText = '';
            }
          } else if (char === '>') {
            // We're exiting a tag
            inTag = false;
            // Add a space to preserve word boundaries
            currentText = ' ';
          } else if (!inTag) {
            // We're not in a tag, so this is text content
            currentText += char;
          }
        }

        // Add any remaining text
        if (currentText) {
          result += currentText;
        }

        return result;
      };

      // Apply the recursive text extraction
      cleanHtml = extractTextRecursively(cleanHtml);
      console.log('After recursive text extraction:', cleanHtml);

      // Step 3: Decode HTML entities
      cleanHtml = this.decodeHTMLEntities(cleanHtml);
      console.log('After decoding HTML entities:', cleanHtml);

      // Step 4: Normalize whitespace (replace multiple spaces, newlines, tabs with a single space)
      cleanHtml = cleanHtml.replace(/\s+/g, ' ').trim();
      console.log('Final extracted text:', cleanHtml);

      return cleanHtml;
    } catch (error) {
      console.error('Error extracting text from HTML:', error);
      return '';
    }
  }

  /**
   * Decode HTML entities in a string
   * @param html The HTML string with entities to decode
   * @returns The decoded string
   */
  private decodeHTMLEntities(html: string): string {
    if (!html) return '';

    try {
      // Create a textarea element to use the browser's built-in HTML entity decoding
      // Since we're in Node.js, we'll use a simple replacement approach for common entities
      return html
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
    } catch (error) {
      console.error('Error decoding HTML entities:', error);
      return html;
    }
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    // Remove IPC handlers
    ipcMain.removeHandler('start-chrome-with-cdp')
    ipcMain.removeHandler('connect-to-cdp')
    ipcMain.removeHandler('start-capturing-actions')
    ipcMain.removeHandler('stop-capturing-actions')
    ipcMain.removeHandler('generate-automation-code')

    // Close CDP connection
    if (this.cdpClient) {
      console.log('Closing CDP connection during dispose...')
      this.cdpClient.close().catch(console.error)
      this.cdpClient = null
      console.log('CDP connection closed')
    }

    // Close Chrome process only if it was started by this presenter
    if (this.chromeProcess) {
      console.log('Killing Chrome process during dispose...')
      // Force kill the process to ensure it's terminated
      this.chromeProcess.kill('SIGKILL')
      this.chromeProcess = null
      console.log('Chrome process killed during dispose')
    } else {
      console.log('No Chrome process to kill during dispose or Chrome was not started by this presenter')
    }
  }
}
