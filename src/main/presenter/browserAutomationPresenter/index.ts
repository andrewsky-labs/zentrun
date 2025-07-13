import { app } from 'electron'
import { spawn, ChildProcess } from 'child_process'
import { IBrowserAutomationPresenter } from '@shared/presenter'
import { ipcMain } from 'electron'
import { presenter } from '..'

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
   * Start Chrome with CDP enabled on port 9222
   */
  private async startChromeWithCDP(): Promise<void> {
    try {
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
          // Check if this is a DOM event log from our injected script
          if (event.args && event.args.length > 0) {
            // Special case for messages that come as separate args
            if (event.args.length >= 2 && event.args[0].value && event.args[1].value) {
              // Handle Click target outerHTML
              if (event.args[0].value === 'Click target outerHTML:') {
                const outerHTML = event.args[1].value;
                const specialMessage = `Click target outerHTML: ${outerHTML}`;
                console.log('Click target outerHTML detected in args:', specialMessage);
                processConsoleMessage(specialMessage);
                return; // Skip further processing for this event
              }

              // Handle target.outerHTML
              if (event.args[0].value === 'target.outerHTML:') {
                const outerHTML = event.args[1].value;
                const specialMessage = `target.outerHTML: ${outerHTML}`;
                console.log('target.outerHTML detected in args:', specialMessage);
                processConsoleMessage(specialMessage);
                return; // Skip further processing for this event
              }

              // Handle Input value
              if (event.args[0].value === 'Input value:') {
                const inputValue = event.args[1].value;
                const specialMessage = `Input value: ${inputValue}`;
                console.log('Input value detected in args:', specialMessage);
                processConsoleMessage(specialMessage);
                return; // Skip further processing for this event
              }

              // Handle Input target outerHTML
              if (event.args[0].value === 'Input target outerHTML:') {
                const outerHTML = event.args[1].value;
                const specialMessage = `Input target outerHTML: ${outerHTML}`;
                console.log('Input target outerHTML detected in args:', specialMessage);
                processConsoleMessage(specialMessage);
                return; // Skip further processing for this event
              }

              // Handle Form submitted
              if (event.args[0].value === 'Form submitted:') {
                const formData = event.args[1].value;
                const specialMessage = `Form submitted: ${formData}`;
                console.log('Form submission detected in args:', specialMessage);
                processConsoleMessage(specialMessage);
                return; // Skip further processing for this event
              }

              // Handle Form target outerHTML
              if (event.args[0].value === 'Form target outerHTML:') {
                const outerHTML = event.args[1].value;
                const specialMessage = `Form target outerHTML: ${outerHTML}`;
                console.log('Form target outerHTML detected in args:', specialMessage);
                processConsoleMessage(specialMessage);
                return; // Skip further processing for this event
              }

              // Handle Element selector
              if (event.args[0].value === 'Element selector:') {
                const selector = event.args[1].value;
                const specialMessage = `Element selector: ${selector}`;
                console.log('Element selector detected in args:', specialMessage);
                processConsoleMessage(specialMessage);
                return; // Skip further processing for this event
              }
            }

            // Try to extract the message from args
            const args = event.args.map(arg => arg.value || '').join(' ');
            console.log('Console message args:', args);

            if (args.includes('DOM Event captured:')) {
              console.log('DOM event log detected in args:', args);
              processConsoleMessage(args);
            } else if (args.includes('Click coordinates:')) {
              console.log('Click coordinates detected in args:', args);
              processConsoleMessage(args);
            } else if (args.includes('Input value:')) {
              console.log('Input value detected in args:', args);
              processConsoleMessage(args);
            } else if (args.includes('Form submitted:')) {
              console.log('Form submission detected in args:', args);
              processConsoleMessage(args);
            } else if (args.includes('Input changed:')) {
              console.log('Input change detected in args:', args);
              processConsoleMessage(args);
            } else if (args.includes('Element selector:')) {
              console.log('Element selector detected in args:', args);
              processConsoleMessage(args);
            }
          }

          if (event.text) {
            if (event.text.includes('DOM Event captured:')) {
              console.log('DOM event log detected in text:', event.text);
              processConsoleMessage(event.text);
            } else if (event.text.includes('Click coordinates:')) {
              console.log('Click coordinates detected in text:', event.text);
              processConsoleMessage(event.text);
            } else if (event.text.includes('Input value:')) {
              console.log('Input value detected in text:', event.text);
              processConsoleMessage(event.text);
            } else if (event.text.includes('Form submitted:')) {
              console.log('Form submission detected in text:', event.text);
              processConsoleMessage(event.text);
            } else if (event.text.includes('Input changed:')) {
              console.log('Input change detected in text:', event.text);
              processConsoleMessage(event.text);
            } else if (event.text.includes('Element selector:')) {
              console.log('Element selector detected in text:', event.text);
              processConsoleMessage(event.text);
            }
          }
        } catch (error) {
          console.error('Error processing console message:', error)
        }
      };

      // Helper function to process console messages
      const processConsoleMessage = (text) => {
        try {
          // Parse the event type and details
          const eventTypeMatch = text.match(/DOM Event captured: (\w+)/)
          if (eventTypeMatch && eventTypeMatch[1]) {
            const eventType = eventTypeMatch[1]
            console.log('Parsed event type:', eventType)

            // Handle click events
            if (eventType === 'click' || eventType === 'mousedown') {
              processClickEvent(text);
            }

            // Handle input events
            if (eventType === 'input' || eventType === 'change') {
              processInputEvent(text);
            }

            // Handle form submission events
            if (eventType === 'submit') {
              processFormSubmitEvent(text);
            }
          } else {
            // Direct processing for specific log patterns
            if (text.includes('Click coordinates:')) {
              processClickEvent(text);
            } else if (text.includes('Input value:') || text.includes('Input changed:')) {
              processInputEvent(text);
            } else if (text.includes('Form submitted:')) {
              processFormSubmitEvent(text);
            }
          }
        } catch (error) {
          console.error('Error in processConsoleMessage:', error);
        }
      };

      // Process click events from console logs
      const processClickEvent = (text) => {
        try {
          console.log('Captured click from DOM event at coordinates with text2:', text)
          // Look for coordinates in the message
          const coordsMatch = text.match(/Click coordinates: (\d+) (\d+)/)
          if (coordsMatch && coordsMatch[1] && coordsMatch[2]) {
            const x = parseInt(coordsMatch[1], 10)
            const y = parseInt(coordsMatch[2], 10)

            console.log('Captured click from DOM event at coordinates with text:', x, y, text)
            console.log('text:', text)

            // Look for element outerHTML
            let outerHTML = '';
            // Extract outerHTML from the console message - try multiple patterns
            // First, try to match the exact "Click target outerHTML:" pattern which is the most reliable
            const clickTargetMatch = text.match(/Click target outerHTML: ([^\n]+)/);
            if (clickTargetMatch && clickTargetMatch[1]) {
              outerHTML = clickTargetMatch[1].trim();
              console.log('Captured element outerHTML from Click target:', outerHTML);
            } else {
              // Fall back to other patterns if the first one doesn't match
              const outerHTMLMatch = text.match(/target\.outerHTML: ([^\n]+)/);
              if (outerHTMLMatch && outerHTMLMatch[1]) {
                outerHTML = outerHTMLMatch[1].trim();
                console.log('Captured element outerHTML from target.outerHTML:', outerHTML);
              }
            }

            // Look for element selector
            let selector = '';
            // Extract selector from the console message
            const selectorMatch = text.match(/Element selector: ([^\n]+)/);
            if (selectorMatch && selectorMatch[1]) {
              selector = selectorMatch[1].trim();
              console.log('Captured element selector:', selector);
            }

            // Look for element tag name
            let tagName = 'unknown';
            // Extract tag name from the console message
            const tagMatch = text.match(/Target element: ([a-z0-9]+)/i) || text.match(/태그명: ([a-z0-9]+)/i) || text.match(/Tag: ([a-z0-9]+)/i);
            if (tagMatch && tagMatch[1]) {
              tagName = tagMatch[1].toLowerCase();
              console.log('Captured element tag name:', tagName);
            }

            // Look for element ID
            let id = '';
            const idMatch = text.match(/ID: ([^\n]+)/);
            if (idMatch && idMatch[1] && idMatch[1] !== '없음') {
              id = idMatch[1].trim();
              console.log('Captured element ID:', id);
            }

            // Look for element name
            let name = '';
            const nameMatch = text.match(/Name 속성: ([^\n]+)/) || text.match(/Name: ([^\n]+)/);
            if (nameMatch && nameMatch[1] && nameMatch[1] !== '없음') {
              name = nameMatch[1].trim();
              console.log('Captured element name:', name);
            }

            // Look for element HTML (encoded)
            let elementHTML = '';
            const htmlMatch = text.match(/Element HTML \(encoded\): ([A-Za-z0-9+/=]+)/);
            if (htmlMatch && htmlMatch[1]) {
              try {
                // Decode the base64-encoded HTML
                const encodedHTML = htmlMatch[1].trim();
                elementHTML = decodeURIComponent(escape(atob(encodedHTML)));
                console.log('Decoded element HTML:', elementHTML);
              } catch (error) {
                console.error('Error decoding element HTML:', error);
              }
            }

            // Look for complete target element
            let targetElement = null;
            const targetMatch = text.match(/Complete target element: ({[\s\S]*?}(?=\n|$))/);
            if (targetMatch && targetMatch[1]) {
              try {
                targetElement = JSON.parse(targetMatch[1]);
                console.log('Parsed complete target element:', targetElement);
              } catch (error) {
                console.error('Error parsing complete target element:', error);
                // Try to extract the target element directly from the text
                try {
                  // Find the start and end of the JSON object
                  const start = text.indexOf('Complete target element: {');
                  if (start !== -1) {
                    let jsonText = text.substring(start + 'Complete target element: '.length);
                    // Find the matching closing brace
                    let braceCount = 0;
                    let endPos = 0;
                    for (let i = 0; i < jsonText.length; i++) {
                      if (jsonText[i] === '{') braceCount++;
                      if (jsonText[i] === '}') braceCount--;
                      if (braceCount === 0) {
                        endPos = i + 1;
                        break;
                      }
                    }
                    if (endPos > 0) {
                      jsonText = jsonText.substring(0, endPos);
                      targetElement = JSON.parse(jsonText);
                      console.log('Parsed complete target element (alternative method):', targetElement);
                    }
                  }
                } catch (altError) {
                  console.error('Error parsing complete target element (alternative method):', altError);
                }
              }
            }

            // Create a click action with all available information
            const clickAction = {
              type: 'click',
              x: x,
              y: y,
              selector: selector,
              tagName: tagName,
              id: id,
              name: name,
              elementHTML: elementHTML, // Include the complete HTML of the element
              outerHTML: outerHTML, // Include the outerHTML for more accurate selector generation
              targetElement: targetElement, // Include the complete target element
              source: 'dom-event'
            };

            console.log('Adding DOM click action to recorded actions:', clickAction)
            this.recordedActions.push(clickAction)

            // Send the action to the renderer process
            if (presenter.windowPresenter.mainWindow) {
              console.log('Sending DOM click action to renderer process')
              presenter.windowPresenter.mainWindow.webContents.send('action-captured', clickAction)
            }

            // Also try to get element details if possible
            handleMousePressed({ x, y }).catch(error => {
              console.error('Error handling DOM click event:', error)
            })
          }
        } catch (error) {
          console.error('Error processing click event:', error);
        }
      };

      // Process input events from console logs
      const processInputEvent = (text) => {
        try {
          // Look for input value
          let inputText = '';
          // Try to find Korean style input value first
          const koreanValueMatch = text.match(/입력값: ([^\n]+)/);
          if (koreanValueMatch && koreanValueMatch[1]) {
            inputText = koreanValueMatch[1].trim();
            console.log('Captured Korean style input value:', inputText);
          } else {
            // Fall back to English style input value
            const valueMatch = text.match(/Input value: ([^\n]+)/) || text.match(/Value: ([^\n]+)/);
            if (valueMatch && valueMatch[1]) {
              inputText = valueMatch[1].trim();
              console.log('Captured input from DOM event with value:', inputText);
            }
          }

          if (inputText) {
            // Look for element outerHTML
            let outerHTML = '';
            // First, try to match the exact "Input target outerHTML:" pattern which is the most reliable
            const inputTargetMatch = text.match(/Input target outerHTML: ([^\n]+)/);
            if (inputTargetMatch && inputTargetMatch[1]) {
              outerHTML = inputTargetMatch[1].trim();
              console.log('Captured input element outerHTML from Input target:', outerHTML);
            } else {
              // Fall back to other patterns if the first one doesn't match
              const outerHTMLMatch = text.match(/target\.outerHTML: ([^\n]+)/);
              if (outerHTMLMatch && outerHTMLMatch[1]) {
                outerHTML = outerHTMLMatch[1].trim();
                console.log('Captured input element outerHTML from target.outerHTML:', outerHTML);
              }
            }

            // Look for input selector
            let selector = '';
            // Extract selector from the console message
            const selectorMatch = text.match(/Input selector: ([^\n]+)/);
            if (selectorMatch && selectorMatch[1]) {
              selector = selectorMatch[1].trim();
              console.log('Captured input selector:', selector);
            }

            // Look for input tag name
            let tagName = 'input';
            const tagMatch = text.match(/태그명: ([a-z0-9]+)/i) || text.match(/Tag: ([a-z0-9]+)/i);
            if (tagMatch && tagMatch[1]) {
              tagName = tagMatch[1].toLowerCase();
              console.log('Captured input tag name:', tagName);
            }

            // Look for input type
            let inputType = 'text';
            const typeMatch = text.match(/Type: ([^\n]+)/);
            if (typeMatch && typeMatch[1] && typeMatch[1] !== '없음') {
              inputType = typeMatch[1].trim();
              console.log('Captured input type:', inputType);
            }

            // Look for input name
            let inputName = '';
            const nameMatch = text.match(/Name: ([^\n]+)/);
            if (nameMatch && nameMatch[1] && nameMatch[1] !== '없음') {
              inputName = nameMatch[1].trim();
              console.log('Captured input name:', inputName);
            }

            // Look for input ID
            let inputId = '';
            const idMatch = text.match(/ID: ([^\n]+)/);
            if (idMatch && idMatch[1] && idMatch[1] !== '없음') {
              inputId = idMatch[1].trim();
              console.log('Captured input ID:', inputId);
            }

            // Look for input placeholder
            let placeholder = '';
            const placeholderMatch = text.match(/Placeholder: ([^\n]+)/);
            if (placeholderMatch && placeholderMatch[1] && placeholderMatch[1] !== '없음') {
              placeholder = placeholderMatch[1].trim();
              console.log('Captured input placeholder:', placeholder);
            }

            // Look for element HTML (encoded)
            let elementHTML = '';
            const htmlMatch = text.match(/Element HTML \(encoded\): ([A-Za-z0-9+/=]+)/);
            if (htmlMatch && htmlMatch[1]) {
              try {
                // Decode the base64-encoded HTML
                const encodedHTML = htmlMatch[1].trim();
                elementHTML = decodeURIComponent(escape(atob(encodedHTML)));
                console.log('Decoded input element HTML:', elementHTML);
              } catch (error) {
                console.error('Error decoding input element HTML:', error);
              }
            }

            // Look for complete target element
            let targetElement = null;
            const targetMatch = text.match(/Complete target element: ({[\s\S]*?}(?=\n|$))/);
            if (targetMatch && targetMatch[1]) {
              try {
                targetElement = JSON.parse(targetMatch[1]);
                console.log('Parsed complete target element for input:', targetElement);
              } catch (error) {
                console.error('Error parsing complete target element for input:', error);
                // Try to extract the target element directly from the text
                try {
                  // Find the start and end of the JSON object
                  const start = text.indexOf('Complete target element: {');
                  if (start !== -1) {
                    let jsonText = text.substring(start + 'Complete target element: '.length);
                    // Find the matching closing brace
                    let braceCount = 0;
                    let endPos = 0;
                    for (let i = 0; i < jsonText.length; i++) {
                      if (jsonText[i] === '{') braceCount++;
                      if (jsonText[i] === '}') braceCount--;
                      if (braceCount === 0) {
                        endPos = i + 1;
                        break;
                      }
                    }
                    if (endPos > 0) {
                      jsonText = jsonText.substring(0, endPos);
                      targetElement = JSON.parse(jsonText);
                      console.log('Parsed complete target element for input (alternative method):', targetElement);
                    }
                  }
                } catch (altError) {
                  console.error('Error parsing complete target element for input (alternative method):', altError);
                }
              }
            }

            // Create a key action with all available information
            const keyAction = {
              type: 'keyDown',
              text: inputText,
              selector: selector,
              tagName: tagName,
              inputType: inputType,
              inputName: inputName,
              inputId: inputId,
              placeholder: placeholder,
              elementHTML: elementHTML, // Include the complete HTML of the element
              outerHTML: outerHTML, // Include the outerHTML for more accurate selector generation
              targetElement: targetElement, // Include the complete target element
              source: 'dom-event'
            };

            console.log('Adding input action to recorded actions:', keyAction)
            this.recordedActions.push(keyAction)

            // Send the action to the renderer process
            if (presenter.windowPresenter.mainWindow) {
              console.log('Sending input action to renderer process')
              presenter.windowPresenter.mainWindow.webContents.send('action-captured', keyAction)
            }
          }
        } catch (error) {
          console.error('Error processing input event:', error);
        }
      };

      // Process form submission events from console logs
      const processFormSubmitEvent = (text) => {
        try {
          console.log('Processing form submission event:', text);

          // Look for form data
          const formDataMatch = text.match(/Form submitted: ([^\n]+)/) || text.match(/Data: ({[^}]+})/);
          if (formDataMatch) {
            let formData = {};
            try {
              if (formDataMatch[1].startsWith('{')) {
                formData = JSON.parse(formDataMatch[1].replace(/'/g, '"'));
              }
            } catch (e) {
              console.error('Error parsing form data:', e);
            }

            // Look for element outerHTML - try multiple patterns
            let outerHTML = '';
            // First, try to match the exact "Form target outerHTML:" pattern which is the most reliable
            const formTargetMatch = text.match(/Form target outerHTML: ([^\n]+)/);
            if (formTargetMatch && formTargetMatch[1]) {
              outerHTML = formTargetMatch[1].trim();
              console.log('Captured form element outerHTML from Form target:', outerHTML);
            } else {
              // Fall back to other patterns if the first one doesn't match
              const outerHTMLMatch = text.match(/target\.outerHTML: ([^\n]+)/) ||
                                    text.match(/Generating selector from form element: ([^\n]+)/);
              if (outerHTMLMatch && outerHTMLMatch[1]) {
                outerHTML = outerHTMLMatch[1].trim();
                console.log('Captured form element outerHTML from alternative pattern:', outerHTML);
              }
            }

            // Look for form selector - try multiple patterns
            let selector = '';
            const selectorMatch = text.match(/Form selector: ([^\n]+)/) ||
                                 text.match(/Generated form selector: ([^\n]+)/) ||
                                 text.match(/form selector validation successful: ([^\n]+)/);
            if (selectorMatch && selectorMatch[1]) {
              selector = selectorMatch[1].trim();
              console.log('Captured form selector:', selector);
            }

            // Look for form ID
            let formId = '';
            const idMatch = text.match(/form#([^\s]+)/) || text.match(/ID: ([^\n]+)/);
            if (idMatch && idMatch[1] && idMatch[1] !== '없음') {
              formId = idMatch[1].trim();
              console.log('Captured form ID:', formId);
            }

            // Look for form name
            let formName = '';
            const nameMatch = text.match(/form\[name=([^\]]+)\]/) || text.match(/Name: ([^\n]+)/);
            if (nameMatch && nameMatch[1] && nameMatch[1] !== '없음') {
              formName = nameMatch[1].trim();
              console.log('Captured form name:', formName);
            }

            // Look for form method
            let formMethod = '';
            const methodMatch = text.match(/method="([^"]+)"/);
            if (methodMatch && methodMatch[1]) {
              formMethod = methodMatch[1].trim();
              console.log('Captured form method:', formMethod);
            }

            // Look for form action
            let formActionUrl = '';
            const actionMatch = text.match(/action="([^"]+)"/);
            if (actionMatch && actionMatch[1]) {
              formActionUrl = actionMatch[1].trim();
              console.log('Captured form action:', formActionUrl);
            }

            // Look for element HTML (encoded)
            let elementHTML = '';
            const htmlMatch = text.match(/Element HTML \(encoded\): ([A-Za-z0-9+/=]+)/);
            if (htmlMatch && htmlMatch[1]) {
              try {
                // Decode the base64-encoded HTML
                const encodedHTML = htmlMatch[1].trim();
                elementHTML = decodeURIComponent(escape(atob(encodedHTML)));
                console.log('Decoded form element HTML:', elementHTML);
              } catch (error) {
                console.error('Error decoding form element HTML:', error);
              }
            }

            // Create a form submission action with all available information
            const formAction = {
              type: 'formSubmit',
              selector: selector,
              formId: formId,
              formName: formName,
              formMethod: formMethod, // Include the form method (GET, POST, etc.)
              formAction: formActionUrl, // Include the form action URL
              formData: formData,
              elementHTML: elementHTML, // Include the complete HTML of the element
              outerHTML: outerHTML, // Include the outerHTML for more accurate selector generation
              source: 'dom-event'
            };

            console.log('Adding form submission action to recorded actions:', formAction)
            this.recordedActions.push(formAction)

            // Send the action to the renderer process
            if (presenter.windowPresenter.mainWindow) {
              console.log('Sending form submission action to renderer process')
              presenter.windowPresenter.mainWindow.webContents.send('action-captured', formAction)
            }
          }
        } catch (error) {
          console.error('Error processing form submission event:', error);
        }
      };

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
        await this.cdpClient.close()
        this.cdpClient = null
      }

      // Close Chrome process
      if (this.chromeProcess) {
        this.chromeProcess.kill()
        this.chromeProcess = null
      }

      return
    } catch (error) {
      console.error('Error stopping action capture:', error)
      throw error
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
   * Generate automation code from recorded actions
   */
  private async generateAutomationCode(event: Electron.IpcMainInvokeEvent, actions: any[]): Promise<string> {
    try {
      // Format the actions for the LLM
      const formattedActions = JSON.stringify(actions, null, 2)

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
           'click','keypress',
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
            // Create a standardized format for all events
            console.log('DOM Event:', event);
            console.log('DOM Event targeted:', event.target);
            console.log('DOM Event started:', event.target.outerHTML);
            console.log('DOM Event captured:', event.type);

            // Log the outerHTML as a separate message to ensure it's captured correctly
            if (event.target && event.target.outerHTML) {
              console.log('target.outerHTML:', event.target.outerHTML);
            }

            // For click events, store coordinates and target info
            if (event.type === 'click' || event.type === 'mousedown') {
              console.log('Click coordinates:', event.clientX, event.clientY);
              console.log('Click target outerHTML:', event.target.outerHTML);

              // Get detailed information about the target element
              try {
                const target = event.target;
                const tagName = target.tagName ? target.tagName.toLowerCase() : 'unknown';
                const id = target.id || '';
                const classes = target.className || '';
                const text = target.textContent ? target.textContent.substring(0, 50) : '';
                const name = target.name || '';
                const type = target.type || '';
                const href = target.href || '';

                // Get all data attributes
                const dataAttrs = {};
                if (target.attributes) {
                  for (let i = 0; i < target.attributes.length; i++) {
                    const attr = target.attributes[i];
                    if (attr.name.startsWith('data-')) {
                      dataAttrs[attr.name] = attr.value;
                    }
                  }
                }
                function safeStringify(obj, space = 2) {
                  const seen = new WeakSet();
                  return JSON.stringify(obj, function (key, value) {
                    if (typeof value === "object" && value !== null) {
                      if (seen.has(value)) {
                        return "[Circular]";
                      }
                      seen.add(value);
                    }
                    return value;
                  }, space);
                }

                console.log('=== Click Element Info ===');
                console.log('Tag:', tagName);
                console.log('ID:', id || '없음');
                console.log('클래스:', classes || '없음');
                console.log('Name 속성:', name || '없음');
                console.log('Type:', type || '없음');
                console.log('Value:', target.value || '없음');
                console.log('href:', href || '없음');
                console.log('Data 속성들:', JSON.stringify(dataAttrs));
                console.log('Element text:', text);
                console.log('target:', target);
                console.log('target.outerHTML:', target.outerHTML);

                // Log the outerHTML as a separate message to ensure it's captured correctly
                console.log('Click target outerHTML:', target.outerHTML);

                // Capture the complete HTML of the element
                // Base64 encode the outerHTML to handle special characters and multi-line HTML
                const encodedHTML = btoa(unescape(encodeURIComponent(target.outerHTML)));
                console.log('Element HTML (encoded):', encodedHTML);

                // Log the complete target element as a JSON string
                console.log('Complete target element:', JSON.stringify(target, (key, value) => {
                  // Avoid circular references and limit depth
                  if (key === 'parentNode' || key === 'ownerDocument' || key === 'childNodes') {
                    return undefined;
                  }
                  return value;
                }));
                console.log('======================');

                // Generate a reliable CSS selector for the element
                let selector = '';

                try {
                  // Log the outerHTML for debugging
                  console.log('Generating selector from element:', target.outerHTML);

                  // First, try to use unique attributes for a simple selector
                  if (id) {
                    // ID is the most reliable selector
                    selector = '#' + CSS.escape(id);
                  } else if (name) {
                    // Name attribute is also quite reliable
                    selector = tagName + '[name="' + CSS.escape(name) + '"]';
                  } else if (target.getAttribute('data-testid')) {
                    // data-testid is often used for testing and is reliable
                    selector = tagName + '[data-testid="' + CSS.escape(target.getAttribute('data-testid')) + '"]';
                  } else if (target.getAttribute('aria-label')) {
                    // aria-label can be useful for accessibility elements
                    selector = tagName + '[aria-label="' + CSS.escape(target.getAttribute('aria-label')) + '"]';
                  } else if (classes && classes.trim()) {
                    // Classes can be useful but less reliable if they change
                    selector = '.' + classes.trim().split(/\\s+/).map(c => CSS.escape(c)).join('.');
                  } else {
                    // As a last resort, create a path from the element to the root
                    let element = target;
                    const path = [];
                    let pathDepth = 0;
                    const MAX_PATH_DEPTH = 5; // Limit path depth to avoid overly complex selectors

                    while (element && element.nodeType === Node.ELEMENT_NODE && pathDepth < MAX_PATH_DEPTH) {
                      let elementSelector = element.nodeName.toLowerCase();

                      // Try to use unique attributes for this element in the path
                      if (element.id) {
                        elementSelector += '#' + CSS.escape(element.id);
                        path.unshift(elementSelector);
                        break; // ID is unique, so we can stop here
                      } else if (element.getAttribute('name')) {
                        elementSelector += '[name="' + CSS.escape(element.getAttribute('name')) + '"]';
                        path.unshift(elementSelector);
                        break; // Name is often unique enough
                      } else if (element.getAttribute('data-testid')) {
                        elementSelector += '[data-testid="' + CSS.escape(element.getAttribute('data-testid')) + '"]';
                        path.unshift(elementSelector);
                        break;
                      } else if (element.getAttribute('aria-label')) {
                        elementSelector += '[aria-label="' + CSS.escape(element.getAttribute('aria-label')) + '"]';
                        path.unshift(elementSelector);
                        break;
                      } else {
                        // If no unique attributes, use nth-child for more specificity
                        let sibling = element;
                        let nth = 1;
                        while (sibling = sibling.previousElementSibling) {
                          if (sibling.nodeName.toLowerCase() === elementSelector) nth++;
                        }
                        if (nth !== 1) elementSelector += ':nth-of-type(' + nth + ')';

                        // Add classes if available for more specificity
                        const elementClasses = element.className;
                        if (elementClasses && typeof elementClasses === 'string' && elementClasses.trim()) {
                          const classSelector = '.' + elementClasses.trim().split(/\\s+/).map(c => CSS.escape(c)).join('.');
                          elementSelector += classSelector;
                        }
                      }

                      path.unshift(elementSelector);
                      element = element.parentNode;
                      pathDepth++;
                    }

                    selector = path.join(' > ');
                  }

                  // Validate the selector by testing it
                  try {
                    const selectedElements = document.querySelectorAll(selector);
                    if (selectedElements.length === 0) {
                      console.log('Warning: Generated selector matches no elements');
                    } else if (selectedElements.length > 1) {
                      console.log('Warning: Generated selector matches multiple elements (' + selectedElements.length + ')');

                      // Try to make the selector more specific
                      if (selectedElements.length > 1 && target.textContent && target.textContent.trim()) {
                        const textContent = target.textContent.trim();
                        if (textContent.length < 50) { // Only use short text to avoid overly complex selectors
                          // Use a custom attribute selector instead of non-standard :contains()
                          // This is just for logging purposes, as we can't modify the DOM
                          console.log('Suggested refinement: Filter elements with text content:', textContent);

                          // For elements with exact text content (like buttons)
                          if (target.children.length === 0 && target.textContent === textContent) {
                            // For elements that only contain text (no child elements)
                            console.log('Element has exact text content, could use XPath: //' + tagName + '[text()="' + textContent.replace(/"/g, '\\"') + '"]');
                          }
                        }
                      }
                    } else if (selectedElements[0] !== target) {
                      console.log('Warning: Generated selector matches a different element than intended');
                    } else {
                      console.log('Selector validation successful');
                    }
                  } catch (validationError) {
                    console.error('Error validating selector:', validationError);
                  }
                } catch (selectorError) {
                  console.error('Error generating selector:', selectorError);

                  // Fallback to a simple selector if there was an error
                  selector = tagName;
                  if (id) selector += '#' + id;
                  else if (name) selector += '[name="' + name + '"]';
                }

                // Store the outerHTML as a separate property for use in selector generation
                console.log('Element outerHTML for selector:', target.outerHTML);
                console.log('Element selector:', selector);

                // For form elements, capture additional information
                if (tagName === 'input' || tagName === 'textarea' || tagName === 'select' || tagName === 'button') {
                  const formData = {};
                  if (target.form) {
                    const formElements = target.form.elements;
                    for (let i = 0; i < formElements.length; i++) {
                      const element = formElements[i];
                      if (element.name) {
                        formData[element.name] = element.value;
                      }
                    }
                    console.log('Form data:', JSON.stringify(formData));
                  }
                }
              } catch (error) {
                console.error('Error getting target details:', error);
              }
            }

            // For input events, store the value
            if (event.type === 'input' || event.type === 'change') {
              try {
                const target = event.target;
                const value = target.value || '';
                const tagName = target.tagName ? target.tagName.toLowerCase() : 'unknown';
                const inputType = target.type || 'text';
                const inputName = target.name || '';
                const inputId = target.id || '';
                const placeholder = target.placeholder || '';
                const classes = target.className || '';

                // Get all data attributes
                const dataAttrs = {};
                if (target.attributes) {
                  for (let i = 0; i < target.attributes.length; i++) {
                    const attr = target.attributes[i];
                    if (attr.name.startsWith('data-')) {
                      dataAttrs[attr.name] = attr.value;
                    }
                  }
                }
                function safeStringify(obj, space = 2) {
                  const seen = new WeakSet();
                  return JSON.stringify(obj, function (key, value) {
                    if (typeof value === "object" && value !== null) {
                      if (seen.has(value)) {
                        return "[Circular]";
                      }
                      seen.add(value);
                    }
                    return value;
                  }, space);
                }

                console.log('=== Input Element Info ===');
                console.log('Tag:', tagName);
                console.log('ID:', inputId || '없음');
                console.log('클래스:', classes || '없음');
                console.log('Name:', inputName || '없음');
                console.log('Type:', inputType || '없음');
                console.log('Placeholder:', placeholder || '없음');
                console.log('입력값:', value);
                console.log('Data 속성들:', JSON.stringify(dataAttrs));
                console.log('target:', target);
                console.log('target.outerHTML:', target.outerHTML);

                // Capture the complete HTML of the input element
                // Base64 encode the outerHTML to handle special characters and multi-line HTML
                const encodedHTML = btoa(unescape(encodeURIComponent(target.outerHTML)));
                console.log('Element HTML (encoded):', encodedHTML);

                // Log the complete target element as a JSON string
                console.log('Complete target element:', JSON.stringify(target, (key, value) => {
                  // Avoid circular references and limit depth
                  if (key === 'parentNode' || key === 'ownerDocument' || key === 'childNodes') {
                    return undefined;
                  }
                  return value;
                }));
                console.log('====================');

                // Log the outerHTML as a separate message to ensure it's captured correctly
                console.log('Input target outerHTML:', target.outerHTML);

                // Generate a reliable CSS selector for the input element
                let selector = '';

                try {
                  // Log the outerHTML for debugging
                  console.log('Generating selector from input element:', target.outerHTML);

                  // First, try to use unique attributes for a simple selector
                  if (inputId) {
                    // ID is the most reliable selector
                    selector = '#' + CSS.escape(inputId);
                  } else if (inputName) {
                    // Name attribute is also quite reliable for form elements
                    selector = tagName + '[name="' + CSS.escape(inputName) + '"]';
                  } else if (placeholder) {
                    // Placeholder is often unique for input elements
                    selector = tagName + '[placeholder="' + CSS.escape(placeholder) + '"]';
                  } else if (target.getAttribute('data-testid')) {
                    // data-testid is often used for testing and is reliable
                    selector = tagName + '[data-testid="' + CSS.escape(target.getAttribute('data-testid')) + '"]';
                  } else if (target.getAttribute('aria-label')) {
                    // aria-label can be useful for accessibility elements
                    selector = tagName + '[aria-label="' + CSS.escape(target.getAttribute('aria-label')) + '"]';
                  } else if (classes && classes.trim()) {
                    // Classes can be useful but less reliable if they change
                    selector = '.' + classes.trim().split(/\\s+/).map(c => CSS.escape(c)).join('.');
                  } else {
                    // As a last resort, create a path from the element to the root
                    let element = target;
                    const path = [];
                    let pathDepth = 0;
                    const MAX_PATH_DEPTH = 5; // Limit path depth to avoid overly complex selectors

                    while (element && element.nodeType === Node.ELEMENT_NODE && pathDepth < MAX_PATH_DEPTH) {
                      let elementSelector = element.nodeName.toLowerCase();

                      // Try to use unique attributes for this element in the path
                      if (element.id) {
                        elementSelector += '#' + CSS.escape(element.id);
                        path.unshift(elementSelector);
                        break; // ID is unique, so we can stop here
                      } else if (element.getAttribute('name')) {
                        elementSelector += '[name="' + CSS.escape(element.getAttribute('name')) + '"]';
                        path.unshift(elementSelector);
                        break; // Name is often unique enough
                      } else if (element.getAttribute('placeholder')) {
                        elementSelector += '[placeholder="' + CSS.escape(element.getAttribute('placeholder')) + '"]';
                        path.unshift(elementSelector);
                        break; // Placeholder is often unique for inputs
                      } else if (element.getAttribute('data-testid')) {
                        elementSelector += '[data-testid="' + CSS.escape(element.getAttribute('data-testid')) + '"]';
                        path.unshift(elementSelector);
                        break;
                      } else if (element.getAttribute('aria-label')) {
                        elementSelector += '[aria-label="' + CSS.escape(element.getAttribute('aria-label')) + '"]';
                        path.unshift(elementSelector);
                        break;
                      } else {
                        // If no unique attributes, use nth-child for more specificity
                        let sibling = element;
                        let nth = 1;
                        while (sibling = sibling.previousElementSibling) {
                          if (sibling.nodeName.toLowerCase() === elementSelector) nth++;
                        }
                        if (nth !== 1) elementSelector += ':nth-of-type(' + nth + ')';

                        // Add classes if available for more specificity
                        const elementClasses = element.className;
                        if (elementClasses && typeof elementClasses === 'string' && elementClasses.trim()) {
                          const classSelector = '.' + elementClasses.trim().split(/\\s+/).map(c => CSS.escape(c)).join('.');
                          elementSelector += classSelector;
                        }
                      }

                      path.unshift(elementSelector);
                      element = element.parentNode;
                      pathDepth++;
                    }

                    selector = path.join(' > ');
                  }

                  // Validate the selector by testing it
                  try {
                    const selectedElements = document.querySelectorAll(selector);
                    if (selectedElements.length === 0) {
                      console.log('Warning: Generated input selector matches no elements');
                    } else if (selectedElements.length > 1) {
                      console.log('Warning: Generated input selector matches multiple elements (' + selectedElements.length + ')');

                      // For input elements, try to make the selector more specific with type
                      if (inputType) {
                        const moreSpecificSelector = selector + '[type="' + CSS.escape(inputType) + '"]';
                        console.log('Trying more specific input selector with type:', moreSpecificSelector);
                      }
                    } else if (selectedElements[0] !== target) {
                      console.log('Warning: Generated input selector matches a different element than intended');
                    } else {
                      console.log('Input selector validation successful');
                    }
                  } catch (validationError) {
                    console.error('Error validating input selector:', validationError);
                  }
                } catch (selectorError) {
                  console.error('Error generating input selector:', selectorError);

                  // Fallback to a simple selector if there was an error
                  selector = tagName;
                  if (inputId) selector += '#' + inputId;
                  else if (inputName) selector += '[name="' + inputName + '"]';
                  else if (placeholder) selector += '[placeholder="' + placeholder + '"]';
                }

                // Store the outerHTML as a separate property for use in selector generation
                console.log('Input element outerHTML for selector:', target.outerHTML);
                console.log('Input selector:', selector);
              } catch (error) {
                console.error('Error getting input details:', error);
              }


            }

            // For key events, capture the key information
            if (event.type === 'keydown' || event.type === 'keyup' || event.type === 'keypress') {
              try {
                console.log('Key details:', {
                  key: event.key,
                  code: event.code,
                  keyCode: event.keyCode,
                  charCode: event.charCode,
                  target: event.target.tagName.toLowerCase() + (event.target.id ? '#' + event.target.id : '')
                });
              } catch (error) {
                console.error('Error getting key details:', error);
              }
            }

            // For mouse movement, capture coordinates periodically
            if (event.type === 'mousemove') {
              // Only log mouse movements occasionally to avoid flooding the console
              if (!window.__zentrunLastMouseMove || Date.now() - window.__zentrunLastMouseMove > 500) {
                console.log('Mouse position:', event.clientX, event.clientY);
                window.__zentrunLastMouseMove = Date.now();
              }
            }

            // For scroll events, capture the scroll position
            if (event.type === 'scroll') {
              console.log('Scroll position:', window.scrollX, window.scrollY);
            }

            // For form submission, capture all form data
            if (event.type === 'submit') {
              try {
                const form = event.target;
                const formData = new FormData(form);
                const formDataObj = {};
                for (const [key, value] of formData.entries()) {
                  formDataObj[key] = value;
                }
                console.log('Form submitted:', JSON.stringify(formDataObj));

                // Log the outerHTML as a separate message to ensure it's captured correctly
                console.log('Form target outerHTML:', form.outerHTML);

                // Generate a reliable CSS selector for the form element
                let formSelector = '';

                try {
                  // Log the outerHTML for debugging
                  console.log('Generating selector from form element:', form.outerHTML);

                  // First, try to use unique attributes for a simple selector
                  if (form.id) {
                    // ID is the most reliable selector
                    formSelector = '#' + CSS.escape(form.id);
                  } else if (form.name) {
                    // Name attribute is also quite reliable for forms
                    formSelector = 'form[name="' + CSS.escape(form.name) + '"]';
                  } else if (form.getAttribute('data-testid')) {
                    // data-testid is often used for testing and is reliable
                    formSelector = 'form[data-testid="' + CSS.escape(form.getAttribute('data-testid')) + '"]';
                  } else if (form.getAttribute('aria-label')) {
                    // aria-label can be useful for accessibility elements
                    formSelector = 'form[aria-label="' + CSS.escape(form.getAttribute('aria-label')) + '"]';
                  } else if (form.className && typeof form.className === 'string' && form.className.trim()) {
                    // Classes can be useful but less reliable if they change
                    formSelector = 'form.' + form.className.trim().split(/\\s+/).map(c => CSS.escape(c)).join('.');
                  } else if (form.action) {
                    // Form action can sometimes be useful
                    formSelector = 'form[action="' + CSS.escape(form.action) + '"]';
                  } else {
                    // As a last resort, create a path from the element to the root
                    let element = form;
                    const path = [];
                    let pathDepth = 0;
                    const MAX_PATH_DEPTH = 5; // Limit path depth to avoid overly complex selectors

                    while (element && element.nodeType === Node.ELEMENT_NODE && pathDepth < MAX_PATH_DEPTH) {
                      let elementSelector = element.nodeName.toLowerCase();

                      // Try to use unique attributes for this element in the path
                      if (element.id) {
                        elementSelector += '#' + CSS.escape(element.id);
                        path.unshift(elementSelector);
                        break; // ID is unique, so we can stop here
                      } else if (element.getAttribute('name')) {
                        elementSelector += '[name="' + CSS.escape(element.getAttribute('name')) + '"]';
                        path.unshift(elementSelector);
                        break; // Name is often unique enough
                      } else if (element.getAttribute('data-testid')) {
                        elementSelector += '[data-testid="' + CSS.escape(element.getAttribute('data-testid')) + '"]';
                        path.unshift(elementSelector);
                        break;
                      } else if (element.getAttribute('aria-label')) {
                        elementSelector += '[aria-label="' + CSS.escape(element.getAttribute('aria-label')) + '"]';
                        path.unshift(elementSelector);
                        break;
                      } else {
                        // If no unique attributes, use nth-child for more specificity
                        let sibling = element;
                        let nth = 1;
                        while (sibling = sibling.previousElementSibling) {
                          if (sibling.nodeName.toLowerCase() === elementSelector) nth++;
                        }
                        if (nth !== 1) elementSelector += ':nth-of-type(' + nth + ')';

                        // Add classes if available for more specificity
                        const elementClasses = element.className;
                        if (elementClasses && typeof elementClasses === 'string' && elementClasses.trim()) {
                          const classSelector = '.' + elementClasses.trim().split(/\\s+/).map(c => CSS.escape(c)).join('.');
                          elementSelector += classSelector;
                        }
                      }

                      path.unshift(elementSelector);
                      element = element.parentNode;
                      pathDepth++;
                    }

                    formSelector = path.join(' > ');
                  }

                  // Validate the selector by testing it
                  try {
                    const selectedElements = document.querySelectorAll(formSelector);
                    if (selectedElements.length === 0) {
                      console.log('Warning: Generated form selector matches no elements');
                    } else if (selectedElements.length > 1) {
                      console.log('Warning: Generated form selector matches multiple elements (' + selectedElements.length + ')');

                      // Try to make the selector more specific with method or enctype
                      if (form.method) {
                        const moreSpecificSelector = formSelector + '[method="' + CSS.escape(form.method) + '"]';
                        console.log('Trying more specific form selector with method:', moreSpecificSelector);
                      }
                      if (form.enctype) {
                        const moreSpecificSelector = formSelector + '[enctype="' + CSS.escape(form.enctype) + '"]';
                        console.log('Trying more specific form selector with enctype:', moreSpecificSelector);
                      }
                    } else if (selectedElements[0] !== form) {
                      console.log('Warning: Generated form selector matches a different element than intended');
                    } else {
                      console.log('Form selector validation successful');
                    }
                  } catch (validationError) {
                    console.error('Error validating form selector:', validationError);
                  }
                } catch (selectorError) {
                  console.error('Error generating form selector:', selectorError);

                  // Fallback to a simple selector if there was an error
                  formSelector = 'form';
                  if (form.id) formSelector += '#' + form.id;
                  else if (form.name) formSelector += '[name="' + form.name + '"]';
                }
                // Store the outerHTML for more accurate selector generation
                console.log('target.outerHTML:', form.outerHTML);

                // Encode the outerHTML to handle special characters and multi-line HTML
                try {
                  const encodedHTML = btoa(unescape(encodeURIComponent(form.outerHTML)));
                  console.log('Element HTML (encoded):', encodedHTML);
                } catch (error) {
                  console.error('Error encoding form outerHTML:', error);
                }

                // Log the form ID and name for easier extraction
                console.log('ID:', form.id || '없음');
                console.log('Name:', form.name || '없음');

                // Log the complete target element as a JSON string
                console.log('Complete target element:', JSON.stringify(form, (key, value) => {
                  // Avoid circular references and limit depth
                  if (key === 'parentNode' || key === 'ownerDocument' || key === 'childNodes') {
                    return undefined;
                  }
                  return value;
                }));

                console.log('Form selector:', formSelector);
              } catch (error) {
                console.error('Error capturing form submission:', error);
              }
            }
          };

          // Add listeners for all event types with capture phase
          console.log('Adding Zentrun event listeners for:', eventTypes.join(', '));
          eventTypes.forEach(type => {
            document.addEventListener(type, window.__zentrunEventHandler, true);
          });

          // Monitor all input fields for changes
          function setupInputMonitoring() {
            try {
              const inputElements = document.querySelectorAll('input, textarea, select');
              console.log('Setting up monitoring for', inputElements.length, 'input elements');

              inputElements.forEach(element => {
                // Add specific event listeners for input elements if they don't already have them
                if (!element.__zentrunMonitored) {
                  element.addEventListener('change', event => {
                    console.log('Input changed:', element.tagName.toLowerCase(),
                      element.id ? '#' + element.id : '',
                      element.name ? '[name=' + element.name + ']' : '',
                      'Value:', element.value);
                  });

                  element.addEventListener('focus', event => {
                    console.log('Input focused:', element.tagName.toLowerCase(),
                      element.id ? '#' + element.id : '',
                      element.name ? '[name=' + element.name + ']' : '');
                  });

                  element.__zentrunMonitored = true;
                }
              });

              // Monitor all forms
              const formElements = document.querySelectorAll('form');
              console.log('Setting up monitoring for', formElements.length, 'form elements');

              formElements.forEach(form => {
                if (!form.__zentrunMonitored) {
                  form.addEventListener('submit', event => {
                    const formData = new FormData(form);
                    const formDataObj = {};
                    for (const [key, value] of formData.entries()) {
                      formDataObj[key] = value;
                    }
                    console.log('Form submitted:',
                      form.id ? '#' + form.id : '',
                      form.name ? '[name=' + form.name + ']' : '',
                      'Data:', JSON.stringify(formDataObj));
                  });

                  form.__zentrunMonitored = true;
                }
              });
            } catch (error) {
              console.error('Error setting up input monitoring:', error);
            }
          }

          // Run input monitoring setup immediately
          setupInputMonitoring();

          // Add a MutationObserver to handle dynamically added content
          if (!window.__zentrunMutationObserver) {
            console.log('Setting up Zentrun MutationObserver');
            window.__zentrunMutationObserver = new MutationObserver(function(mutations) {
              console.log('DOM mutations detected, re-applying event listeners');
              // Re-apply event listeners to ensure they're on new elements
              setTimeout(() => {
                console.log('Re-applying Zentrun event listeners after DOM mutation');
                setupInputMonitoring();
              }, 500);
            });

            // Start observing the document with the configured parameters
            window.__zentrunMutationObserver.observe(document.body || document.documentElement, {
              childList: true,
              subtree: true
            });
          }

          // Periodically check and re-apply event listeners
          if (!window.__zentrunIntervalId) {
            console.log('Setting up Zentrun periodic check');
            window.__zentrunIntervalId = setInterval(() => {
              console.log('Zentrun periodic check: ensuring event listeners are active');
              setupInputMonitoring();
            }, 5000);
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
      this.cdpClient.close().catch(console.error)
      this.cdpClient = null
    }

    // Close Chrome process
    if (this.chromeProcess) {
      this.chromeProcess.kill()
      this.chromeProcess = null
    }
  }
}
