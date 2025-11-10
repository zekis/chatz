/**
 * Chatz Widget Module
 * Main floating chat widget for Frappe Desk
 */

const ChatzWidget = {
	config: null,
	conversationId: null,
	isOpen: false,
	isLoading: false,

	/**
	 * Scroll chat to bottom with multiple attempts to handle animations
	 */
	scrollToBottom: function() {
		const messagesDiv = document.getElementById("chatz-messages");
		if (!messagesDiv) return;

		// Scroll immediately
		messagesDiv.scrollTop = messagesDiv.scrollHeight;

		// Scroll multiple times with delays to catch content at different rendering stages
		setTimeout(() => { messagesDiv.scrollTop = messagesDiv.scrollHeight; }, 50);
		setTimeout(() => { messagesDiv.scrollTop = messagesDiv.scrollHeight; }, 150);
		setTimeout(() => { messagesDiv.scrollTop = messagesDiv.scrollHeight; }, 300);
	},

	/**
	 * Initialize the widget
	 * @param {Object} apiConfig - API configuration
	 */
	init: function(apiConfig) {
		this.config = apiConfig;
		this.conversationId = ChatzHistoryManager.generateConversationId();
		this.isGuest = apiConfig.user === "Guest";

		// Apply customization BEFORE creating widget so CSS variables are set
		this.applyCustomization();

		this.createWidget();
		this.attachEventListeners();

		// Update all icons to match current API
		this.updateChatTabIcon();
		this.updateToggleIcon();
		this.updateInputIcon();

		// Load available APIs (only for logged-in users)
		if (!this.isGuest) {
			this.loadAvailableAPIs();
		}

		// Load last conversation if available (only for logged-in users)
		if (!this.isGuest) {
			this.loadLastConversation();
		} else {
			// For guests, load from localStorage
			const guestHistory = this.loadGuestHistory();
			if (guestHistory && guestHistory.length > 0) {
				// Restore conversation from localStorage
				guestHistory.forEach(msg => {
					this.addMessageToDisplay(msg.role, msg.content, msg.timestamp);
				});

				// Scroll to bottom after loading history
				this.scrollToBottom();
			} else {
				// No history, show greeting
				if (this.config.greeting_message) {
					this.addMessageToDisplay("assistant", this.config.greeting_message, new Date().toISOString());
				}
			}
		}
	},

	/**
	 * Create widget HTML structure
	 */
	createWidget: function() {
		const title = this.config.widget_title || "Chatz";
		const icon = this.config.widget_icon || "comment";
		const isGuest = this.config.user === "Guest";

		// Get Frappe icon SVG if available, otherwise use default
		let iconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
			<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
		</svg>`;

		// Try to use Frappe icon if available
		if (frappe && frappe.utils && frappe.utils.icon) {
			iconSVG = frappe.utils.icon(icon, 'md');
		}

		// Build tabs HTML - hide Assistants and History for guests
		let tabsHTML = `
			<button class="chatz-tab chatz-tab-active" id="chatz-tab-chat" data-tab="chat">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
				</svg>
				<span>Chat</span>
			</button>`;

		if (!isGuest) {
			tabsHTML += `
			<button class="chatz-tab" id="chatz-tab-assistants" data-tab="assistants">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<rect x="3" y="3" width="7" height="7"></rect>
					<rect x="14" y="3" width="7" height="7"></rect>
					<rect x="14" y="14" width="7" height="7"></rect>
					<rect x="3" y="14" width="7" height="7"></rect>
				</svg>
				<span>Assistants</span>
			</button>
			<button class="chatz-tab" id="chatz-tab-history" data-tab="history">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="10"></circle>
					<polyline points="12 6 12 12 16 14"></polyline>
				</svg>
				<span>History</span>
			</button>`;
		}

		// Build dropdown for mobile
		let dropdownHTML = `
			<select class="chatz-tab-dropdown" id="chatz-tab-dropdown">
				<option value="chat">Chat</option>`;

		if (!isGuest) {
			dropdownHTML += `
				<option value="assistants">Assistants</option>
				<option value="history">History</option>`;
		}

		dropdownHTML += `</select>`;

		const widgetHTML = `
			<div id="chatz-widget" class="chatz-widget">
				<div class="chatz-toggle-btn" id="chatz-toggle">
					${iconSVG}
				</div>
				<div class="chatz-container" id="chatz-container" style="display: none;">
					<div class="chatz-header">
						${dropdownHTML}
						<div class="chatz-tabs">
							${tabsHTML}
						</div>
						<div class="chatz-header-actions">
							<button class="chatz-icon-btn" id="chatz-refresh" title="Refresh">
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<polyline points="23 4 23 10 17 10"></polyline>
									<polyline points="1 20 1 14 7 14"></polyline>
									<path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
								</svg>
							</button>
							<button class="chatz-icon-btn" id="chatz-maximize" title="Maximize">
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
								</svg>
							</button>
							<button class="chatz-icon-btn" id="chatz-close" title="Close">
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<line x1="18" y1="6" x2="6" y2="18"></line>
									<line x1="6" y1="6" x2="18" y2="18"></line>
								</svg>
							</button>
						</div>
					</div>
					<div class="chatz-content">
						<div class="chatz-view chatz-view-active" id="chatz-view-chat">
							<div class="chatz-messages" id="chatz-messages"></div>
							<div class="chatz-input-wrapper">
								<div class="chatz-input-container">
									<div class="chatz-input-icon">
										${iconSVG}
									</div>
									<textarea id="chatz-input" placeholder="Ask me anything..." rows="1"></textarea>
									<button id="chatz-send" class="chatz-send-btn">
										<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
											<path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
										</svg>
									</button>
								</div>
							</div>
						</div>
						<div class="chatz-view" id="chatz-view-assistants" style="display: none;">
							<div class="chatz-panel-header">
								<h4>AI Assistants</h4>
								<p>Select an AI model to chat with</p>
							</div>
							<div class="chatz-models-list" id="chatz-models-list"></div>
						</div>
						<div class="chatz-view" id="chatz-view-history" style="display: none;">
							<div class="chatz-panel-header">
								<h4>Chat History</h4>
							</div>
							<div class="chatz-history-list" id="chatz-history-list"></div>
						</div>
					</div>
				</div>
			</div>
		`;

		document.body.insertAdjacentHTML("beforeend", widgetHTML);
	},

	/**
	 * Apply custom colors and styling
	 */
	applyCustomization: function() {
		const primaryColor = this.config.primary_color || "#667eea";
		const secondaryColor = this.config.secondary_color || "#764ba2";

		// Set CSS variables on the root element
		document.documentElement.style.setProperty('--chatz-primary-color', primaryColor);
		document.documentElement.style.setProperty('--chatz-secondary-color', secondaryColor);
	},

	/**
	 * Update the chat tab icon to match the current API
	 */
	updateChatTabIcon: function() {
		const chatTab = document.getElementById("chatz-tab-chat");
		if (!chatTab) return;

		// Get the icon from config
		let iconHTML = '';
		if (this.config.widget_icon && frappe && frappe.utils && frappe.utils.icon) {
			iconHTML = frappe.utils.icon(this.config.widget_icon, 'sm');
		} else {
			// Default chat icon
			iconHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
			</svg>`;
		}

		// Update the tab content
		chatTab.innerHTML = `${iconHTML}<span>Chat</span>`;
	},

	/**
	 * Update the toggle button icon to match the current API
	 */
	updateToggleIcon: function() {
		const toggleBtn = document.getElementById("chatz-toggle");
		if (!toggleBtn) return;

		// Get the icon from config
		let iconHTML = '';
		if (this.config.widget_icon && frappe && frappe.utils && frappe.utils.icon) {
			iconHTML = frappe.utils.icon(this.config.widget_icon, 'md');
		} else {
			// Default chat icon
			iconHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
				<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
			</svg>`;
		}

		// Update the toggle button content
		toggleBtn.innerHTML = iconHTML;
	},

	/**
	 * Update the input icon to match the current API
	 */
	updateInputIcon: function() {
		const inputIcon = document.querySelector(".chatz-input-icon");
		if (!inputIcon) return;

		// Get the icon from config
		let iconHTML = '';
		if (this.config.widget_icon && frappe && frappe.utils && frappe.utils.icon) {
			iconHTML = frappe.utils.icon(this.config.widget_icon, 'md');
		} else {
			// Default chat icon
			iconHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
				<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
			</svg>`;
		}

		// Update the input icon content
		inputIcon.innerHTML = iconHTML;
	},

	/**
	 * Attach event listeners
	 */
	attachEventListeners: function() {
		const toggleBtn = document.getElementById("chatz-toggle");
		const closeBtn = document.getElementById("chatz-close");
		const sendBtn = document.getElementById("chatz-send");
		const input = document.getElementById("chatz-input");
		const refreshBtn = document.getElementById("chatz-refresh");
		const maximizeBtn = document.getElementById("chatz-maximize");

		// Tab buttons
		const tabChat = document.getElementById("chatz-tab-chat");
		const tabAssistants = document.getElementById("chatz-tab-assistants");
		const tabHistory = document.getElementById("chatz-tab-history");
		const tabDropdown = document.getElementById("chatz-tab-dropdown");

		toggleBtn.addEventListener("click", () => this.toggleWidget());
		closeBtn.addEventListener("click", () => this.toggleWidget());
		sendBtn.addEventListener("click", () => this.sendMessage());
		refreshBtn.addEventListener("click", () => this.startNewChat());
		maximizeBtn.addEventListener("click", () => this.toggleMaximize());

		// Tab switching - horizontal tabs
		if (tabChat) {
			tabChat.addEventListener("click", () => this.switchTab("chat"));
		}

		// Only attach listeners for tabs that exist (not present for guests)
		if (tabAssistants) {
			tabAssistants.addEventListener("click", () => this.switchTab("assistants"));
		}
		if (tabHistory) {
			tabHistory.addEventListener("click", () => this.switchTab("history"));
		}

		// Tab switching - mobile dropdown
		if (tabDropdown) {
			tabDropdown.addEventListener("change", (e) => this.switchTab(e.target.value));
		}

		// Send on Enter (Shift+Enter for new line)
		input.addEventListener("keydown", (e) => {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				this.sendMessage();
			}
		});
	},

	/**
	 * Switch between tabs
	 */
	switchTab: function(tabName) {
		// Update tab buttons
		document.querySelectorAll(".chatz-tab").forEach(tab => {
			tab.classList.remove("chatz-tab-active");
		});
		const tabButton = document.getElementById(`chatz-tab-${tabName}`);
		if (tabButton) {
			tabButton.classList.add("chatz-tab-active");
		}

		// Update dropdown
		const dropdown = document.getElementById("chatz-tab-dropdown");
		if (dropdown) {
			dropdown.value = tabName;
		}

		// Update views
		document.querySelectorAll(".chatz-view").forEach(view => {
			view.style.display = "none";
			view.classList.remove("chatz-view-active");
		});
		const activeView = document.getElementById(`chatz-view-${tabName}`);
		activeView.style.display = "flex";
		activeView.classList.add("chatz-view-active");

		// Load data for specific tabs
		if (tabName === "assistants") {
			this.loadAvailableAPIs();
		} else if (tabName === "history") {
			this.loadConversationHistory();
		}
	},

	/**
	 * Toggle widget visibility
	 */
	toggleWidget: function() {
		const container = document.getElementById("chatz-container");
		this.isOpen = !this.isOpen;
		container.style.display = this.isOpen ? "flex" : "none";

		// Scroll to bottom when opening the widget
		if (this.isOpen) {
			this.scrollToBottom();
		}
	},

	/**
	 * Toggle maximize mode
	 */
	toggleMaximize: function() {
		const container = document.getElementById("chatz-container");
		const maximizeBtn = document.getElementById("chatz-maximize");

		if (!container) return;

		// Toggle maximized class
		const isMaximized = container.classList.toggle("chatz-maximized");

		// Update button icon and title
		if (isMaximized) {
			maximizeBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path></svg>`;
			maximizeBtn.title = "Restore";
		} else {
			maximizeBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>`;
			maximizeBtn.title = "Maximize";
		}
	},

	/**
	 * Send message to API
	 */
	sendMessage: async function() {
		const input = document.getElementById("chatz-input");
		const message = input.value.trim();

		if (!message || this.isLoading) return;

		// Add user message to display
		this.addMessageToDisplay("user", message);
		input.value = "";

		// Get context
		const context = ChatzContext.getCurrentContext();

		// Save user message to history
		if (!this.isGuest) {
			// Logged-in users: save to backend
			ChatzHistoryManager.saveMessage(
				this.conversationId,
				"user",
				message,
				context,
				this.config.api_config_name,
				(result) => {
					if (result && result.status === "error") {
						console.error("Chatz: Failed to save user message:", result.message);
						// Don't show error to user for message saving - it's not critical
					}
				}
			);
		} else {
			// Guests: save to localStorage
			this.saveGuestMessage("user", message);
		}

		// Get conversation history
		this.isLoading = true;

		// If viewing a document, fetch its data to include in context
		if (context.doctype && context.docname) {
			frappe.call({
				method: "frappe.client.get",
				args: {
					doctype: context.doctype,
					name: context.docname
				},
				callback: (r) => {
					if (r.message) {
						context.document_data = r.message;
					}
					// Now get conversation history
					this.proceedWithMessage(context, message);
				},
				error: () => {
					// If fetch fails, proceed without document data
					this.proceedWithMessage(context, message);
				}
			});
		} else {
			// No document context, proceed directly
			this.proceedWithMessage(context, message);
		}
	},

	/**
	 * Proceed with sending message after context is ready
	 */
	proceedWithMessage: function(context, message) {
		// For guests, skip history retrieval and just send the message
		const processMessage = (history) => {
			const messages = ChatzAPIClient.buildMessagesArray(
				this.config,
				history,
				message,
				context
			);

			// Show thinking bubble
			this.showThinkingBubble();

			// Call API
			let fullResponse = "";
			let firstChunk = true;
			ChatzAPIClient.callStreamingAPI(
				this.config,
				messages,
				(chunk) => {
					fullResponse += chunk;
					if (firstChunk) {
						// Remove thinking bubble and add actual message on first chunk
						this.removeThinkingBubble();
						this.addMessageToDisplay("assistant", "");
						firstChunk = false;
					}
					this.updateLastMessage(fullResponse, true); // Still streaming
				},
				() => {
					this.isLoading = false;
					this.updateLastMessage(fullResponse, false); // Streaming complete
					// Save assistant response to history
					if (!this.isGuest) {
						// Logged-in users: save to backend
						ChatzHistoryManager.saveMessage(
							this.conversationId,
							"assistant",
							fullResponse,
							context,
							this.config.api_config_name,
							(result) => {
								if (result && result.status === "error") {
									console.error("Chatz: Failed to save assistant message:", result.message);
									// Don't show error to user for message saving - it's not critical
								}
							}
						);
					} else {
						// Guests: save to localStorage
						this.saveGuestMessage("assistant", fullResponse);
					}
				},
				(error) => {
					this.isLoading = false;
					this.addMessageToDisplay("error", error);
				}
			);
		};

		// Get conversation history
		if (!this.isGuest) {
			// Logged-in users: get from backend
			ChatzHistoryManager.getConversationHistory(this.conversationId, 10, (result) => {
				if (result && result.status === "success") {
					const history = result.messages || [];
					processMessage(history);
				} else {
					this.isLoading = false;
					const errorMsg = result ? result.message : "Failed to get conversation history";
					this.addMessageToDisplay("error", "Error: " + errorMsg);
				}
			});
		} else {
			// Guests: get from localStorage
			const guestHistory = this.loadGuestHistory();
			// Convert guest history format to match backend format
			const history = guestHistory.map(msg => ({
				message_type: msg.role,
				message_content: msg.content
			}));
			processMessage(history);
		}
	},

	/**
	 * Show typing indicator while waiting for response
	 */
	showThinkingBubble: function() {
		const messagesDiv = document.getElementById("chatz-messages");
		const thinkingEl = document.createElement("div");
		thinkingEl.className = "chatz-message chatz-message-assistant chatz-thinking-indicator";
		thinkingEl.innerHTML = `
			<div class="chatz-message-wrapper">
				<div class="chatz-message-content">
					<div class="chatz-typing-indicator">
						<span>Typing</span>
						<div class="chatz-typing-dots">
							<div class="chatz-typing-dot"></div>
							<div class="chatz-typing-dot"></div>
							<div class="chatz-typing-dot"></div>
						</div>
					</div>
				</div>
			</div>
		`;
		messagesDiv.appendChild(thinkingEl);
		this.scrollToBottom();
	},

	/**
	 * Remove typing indicator
	 */
	removeThinkingBubble: function() {
		const messagesDiv = document.getElementById("chatz-messages");
		const thinkingEl = messagesDiv.querySelector(".chatz-thinking-indicator");
		if (thinkingEl) {
			thinkingEl.remove();
		}
	},

	/**
	 * Add message to display
	 * @param {String} type - "user", "assistant", or "error"
	 * @param {String} content - Message content
	 * @param {String} timestamp - Optional timestamp (ISO format or Date object)
	 */
	addMessageToDisplay: function(type, content, timestamp) {
		const messagesDiv = document.getElementById("chatz-messages");
		const messageEl = document.createElement("div");
		messageEl.className = `chatz-message chatz-message-${type}`;

		// Create message wrapper
		const wrapper = document.createElement("div");
		wrapper.className = "chatz-message-wrapper";

		// Create content element
		const contentEl = document.createElement("div");
		contentEl.className = "chatz-message-content";

		if (type === "assistant") {
			// Render markdown for assistant messages
			contentEl.innerHTML = this.renderMarkdown(content);
		} else if (type === "error") {
			contentEl.textContent = content;
		} else {
			contentEl.textContent = content;
		}

		wrapper.appendChild(contentEl);

		// Add timestamp if provided
		if (timestamp) {
			const timeEl = document.createElement("div");
			timeEl.className = "chatz-message-time";
			timeEl.textContent = this.formatTime(timestamp);
			wrapper.appendChild(timeEl);
		}

		messageEl.appendChild(wrapper);
		messagesDiv.appendChild(messageEl);

		// Scroll to bottom with multiple attempts
		this.scrollToBottom();
	},

	/**
	 * Format timestamp for display
	 * @param {String|Date} timestamp - Timestamp to format
	 * @returns {String} Formatted time string
	 */
	formatTime: function(timestamp) {
		try {
			const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
			const now = new Date();
			const diffMs = now - date;
			const diffMins = Math.floor(diffMs / 60000);
			const diffHours = Math.floor(diffMs / 3600000);
			const diffDays = Math.floor(diffMs / 86400000);

			if (diffMins < 1) {
				return "just now";
			} else if (diffMins < 60) {
				return `${diffMins}m ago`;
			} else if (diffHours < 24) {
				return `${diffHours}h ago`;
			} else if (diffDays < 7) {
				return `${diffDays}d ago`;
			} else {
				return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
			}
		} catch (e) {
			return "";
		}
	},

	/**
	 * Update the last message (for streaming)
	 * @param {String} content - Updated content
	 * @param {Boolean} isStreaming - Whether still streaming (default: true)
	 */
	updateLastMessage: function(content, isStreaming = true) {
		const messagesDiv = document.getElementById("chatz-messages");
		let lastMessage = messagesDiv.querySelector(".chatz-message-assistant:last-of-type");

		if (!lastMessage) {
			this.addMessageToDisplay("assistant", content);
			return;
		}

		// Update the content inside the wrapper
		const contentEl = lastMessage.querySelector(".chatz-message-content");
		if (contentEl) {
			// Add streaming cursor if still streaming
			const cursor = isStreaming ? '<span class="chatz-streaming-cursor"></span>' : '';
			contentEl.innerHTML = this.renderMarkdown(content) + cursor;
		} else {
			// Fallback if wrapper structure is missing
			const cursor = isStreaming ? '<span class="chatz-streaming-cursor"></span>' : '';
			lastMessage.innerHTML = this.renderMarkdown(content) + cursor;
		}

		// Scroll to bottom with multiple attempts
		this.scrollToBottom();
	},

	/**
	 * Render markdown content with URL detection
	 * @param {String} content - Markdown content
	 * @returns {String} HTML content
	 */
	renderMarkdown: function(content) {
		// Trim leading/trailing whitespace to avoid extra line breaks
		content = content.trim();

		// Store URLs temporarily to avoid escaping them
		const urlPlaceholders = [];
		let placeholderIndex = 0;

		// Store thoughts container temporarily
		const thoughtsPlaceholders = [];
		let thoughtsIndex = 0;

		// Group consecutive *Thinking: lines together (ignoring empty lines between them)
		const lines = content.split('\n');
		const processedLines = [];
		let currentThoughtGroup = [];
		let pendingEmptyLines = [];

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const thinkingMatch = line.match(/^\*Thinking:(.*)$/);

			if (thinkingMatch) {
				// This is a thinking line - add to current group
				const thought = thinkingMatch[1].trim();
				if (thought) {
					currentThoughtGroup.push(thought);
				}
				// Clear pending empty lines since we're still in a thought group
				pendingEmptyLines = [];
			} else if (line.trim() === '') {
				// Empty line - might be between thoughts or after thoughts
				// Store it temporarily
				pendingEmptyLines.push(line);
			} else {
				// Non-empty, non-thinking line - this is actual content
				// Close current thought group if exists
				if (currentThoughtGroup.length > 0) {
					// Create placeholder for this thought group
					const containerId = `thought-${Date.now()}-${thoughtsIndex}`;
					const placeholder = `___THOUGHTS_PLACEHOLDER_${thoughtsIndex}___`;

					const thoughtsList = currentThoughtGroup.map(thought =>
						`<div class="chatz-thought-item">${this.renderMarkdownSimple(thought)}</div>`
					).join('');

					const label = currentThoughtGroup.length === 1 ? 'Thought' : `Thoughts (${currentThoughtGroup.length})`;

					thoughtsPlaceholders.push({
						placeholder: placeholder,
						html: `<div class="chatz-thought-container"><div class="chatz-thought-header" onclick="ChatzWidget.toggleThought('${containerId}')"><svg class="chatz-thought-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"></path></svg><span>${label}</span></div><div class="chatz-thought-list" id="${containerId}" style="display: block;">${thoughtsList}</div></div>`
					});
					thoughtsIndex++;

					processedLines.push(placeholder);
					currentThoughtGroup = [];

					// Clear pending empty lines - thought group provides visual separation
					pendingEmptyLines = [];
				} else {
					// No thought group - add any pending empty lines before the content
					processedLines.push(...pendingEmptyLines);
					pendingEmptyLines = [];
				}

				// Add the content line
				processedLines.push(line);
			}
		}

		// Handle any remaining thoughts at the end
		if (currentThoughtGroup.length > 0) {
			const containerId = `thought-${Date.now()}-${thoughtsIndex}`;
			const placeholder = `___THOUGHTS_PLACEHOLDER_${thoughtsIndex}___`;

			const thoughtsList = currentThoughtGroup.map(thought =>
				`<div class="chatz-thought-item">${this.renderMarkdownSimple(thought)}</div>`
			).join('');

			const label = currentThoughtGroup.length === 1 ? 'Thought' : `Thoughts (${currentThoughtGroup.length})`;

			thoughtsPlaceholders.push({
				placeholder: placeholder,
				html: `<div class="chatz-thought-container"><div class="chatz-thought-header" onclick="ChatzWidget.toggleThought('${containerId}')"><svg class="chatz-thought-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"></path></svg><span>${label}</span></div><div class="chatz-thought-list" id="${containerId}" style="display: block;">${thoughtsList}</div></div>`
			});
			thoughtsIndex++;

			processedLines.push(placeholder);
		}

		// Rejoin the processed lines
		content = processedLines.join('\n');

		// Clean up excessive empty lines (more than 2 consecutive newlines)
		content = content.replace(/\n{3,}/g, '\n\n');

		// Extract and replace markdown links BEFORE escaping: [text](url)
		content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
			const placeholder = `___URL_PLACEHOLDER_${placeholderIndex}___`;
			urlPlaceholders.push({
				placeholder: placeholder,
				html: this.renderLink(url, text, true)
			});
			placeholderIndex++;
			return placeholder;
		});

		// Extract and replace plain URLs BEFORE escaping
		content = content.replace(/(https?:\/\/[^\s<)\]]+)/g, (match, url) => {
			const placeholder = `___URL_PLACEHOLDER_${placeholderIndex}___`;
			urlPlaceholders.push({
				placeholder: placeholder,
				html: this.renderLink(url, url, true)
			});
			placeholderIndex++;
			return placeholder;
		});

		// Now escape HTML
		let html = frappe.utils.escape_html(content);

		// Code blocks
		html = html.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");

		// Inline code
		html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

		// Bold
		html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

		// Italic
		html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");

		// Restore URL placeholders
		urlPlaceholders.forEach(item => {
			html = html.replace(item.placeholder, item.html);
		});

		// Restore thoughts placeholders
		thoughtsPlaceholders.forEach(item => {
			html = html.replace(item.placeholder, item.html);
		});

		// Line breaks
		html = html.replace(/\n/g, "<br>");

		return html;
	},

	/**
	 * Render markdown content without thoughts blocks (for recursive processing)
	 * @param {String} content - Markdown content
	 * @returns {String} HTML content
	 */
	renderMarkdownSimple: function(content) {
		// Escape HTML
		let html = frappe.utils.escape_html(content);

		// Code blocks
		html = html.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");

		// Inline code
		html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

		// Bold
		html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

		// Italic
		html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");

		// Line breaks
		html = html.replace(/\n/g, "<br>");

		return html;
	},

	/**
	 * Toggle individual thought visibility
	 * @param {String} thoughtId - The ID of the thought content to toggle
	 */
	toggleThought: function(thoughtId) {
		const thoughtContent = document.getElementById(thoughtId);

		if (!thoughtContent) {
			console.error("Chatz: Could not find thought element", thoughtId);
			return;
		}

		const isExpanded = thoughtContent.style.display === 'block';

		if (isExpanded) {
			// Collapse
			thoughtContent.style.display = 'none';
		} else {
			// Expand
			thoughtContent.style.display = 'block';
		}
	},

	/**
	 * Check if URL is internal (same site)
	 * @param {String} url - URL to check
	 * @returns {Boolean} True if internal
	 */
	isInternalUrl: function(url) {
		try {
			// Relative URLs are always internal
			if (url.startsWith('/')) {
				return true;
			}

			// Parse the URL
			const urlObj = new URL(url, window.location.origin);

			// Check if same hostname
			return urlObj.hostname === window.location.hostname;
		} catch (e) {
			return false;
		}
	},

	/**
	 * Render a link as button (internal) or regular link (external)
	 * @param {String} url - URL
	 * @param {String} text - Link text
	 * @param {Boolean} escapeText - Whether to escape the text (default: false, already escaped)
	 * @returns {String} HTML for link
	 */
	renderLink: function(url, text, escapeText = false) {
		// Escape text if needed
		const displayText = escapeText ? frappe.utils.escape_html(text) : text;

		if (this.isInternalUrl(url)) {
			// Internal link - render as button
			const linkId = 'chatz-link-' + Math.random().toString(36).substr(2, 9);

			// Determine icon based on URL
			let icon = '';
			if (url.includes('/list') || url.toLowerCase().includes('list')) {
				// List icon
				icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>`;
			} else {
				// Document/file icon
				icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`;
			}

			// Store the URL for later navigation
			setTimeout(() => {
				const btn = document.getElementById(linkId);
				if (btn) {
					btn.addEventListener('click', () => this.navigateToUrl(url));
				}
			}, 100);

			return `<button id="${linkId}" class="chatz-internal-link-btn" title="${frappe.utils.escape_html(url)}">
				${icon}
				<span>${displayText}</span>
			</button>`;
		} else {
			// External link - render as regular link
			return `<a href="${frappe.utils.escape_html(url)}" target="_blank" rel="noopener noreferrer" class="chatz-external-link">${displayText}</a>`;
		}
	},

	/**
	 * Navigate to internal URL
	 * @param {String} url - URL to navigate to
	 */
	navigateToUrl: function(url) {
		try {
			// Parse the URL to get the path
			let path = url;

			if (url.startsWith('http')) {
				const urlObj = new URL(url);
				path = urlObj.pathname + urlObj.search + urlObj.hash;
			}

			// Remove leading /app/ if present (Frappe routes don't include it)
			if (path.startsWith('/app/')) {
				path = path.substring(5);
			} else if (path.startsWith('/')) {
				path = path.substring(1);
			}

			// Use Frappe's router to navigate
			if (frappe && frappe.set_route) {
				frappe.set_route(path);
			} else {
				// Fallback to direct navigation
				window.location.href = url;
			}
		} catch (e) {
			window.location.href = url;
		}
	},

	/**
	 * Toggle history panel
	 */
	toggleHistoryPanel: function() {
		const panel = document.getElementById("chatz-history-panel");
		const messagesDiv = document.getElementById("chatz-messages");

		if (panel.style.display === "none") {
			panel.style.display = "block";
			messagesDiv.style.display = "none";
			this.loadConversationHistory();
		} else {
			panel.style.display = "none";
			messagesDiv.style.display = "block";
		}
	},

	/**
	 * Load conversation history list (show all conversations)
	 */
	loadConversationHistory: function() {
		// Guest users don't have database history
		if (this.isGuest) {
			const historyList = document.getElementById("chatz-history-list");
			if (historyList) {
				historyList.innerHTML = "<p class='chatz-no-history'>History not available for guest users</p>";
			}
			return;
		}

		// Don't filter - show all conversations
		ChatzHistoryManager.listConversations(20, null, (result) => {
			const historyList = document.getElementById("chatz-history-list");
			historyList.innerHTML = "";

			if (result && result.status === "success" && result.conversations) {
				result.conversations.forEach(conv => {
					const item = document.createElement("div");
					item.className = "chatz-history-item";

					// Get first message as preview
					const preview = conv.first_message ? conv.first_message.substring(0, 50) + "..." : "Empty conversation";
					const date = new Date(conv.created_at).toLocaleDateString();
					const apiName = conv.api_used || "Unknown";

					item.innerHTML = `
						<div class="chatz-history-item-content">
							<div class="chatz-history-item-preview">${frappe.utils.escape_html(preview)}</div>
							<div class="chatz-history-item-meta">
								<span class="chatz-history-item-agent">${frappe.utils.escape_html(apiName)}</span>
								<span class="chatz-history-item-date">${date}</span>
							</div>
						</div>
					`;

					item.addEventListener("click", () => this.loadConversation(conv.conversation_id, conv.api_used));
					historyList.appendChild(item);
				});
			} else {
				historyList.innerHTML = "<p class='chatz-no-history'>No conversations yet</p>";
			}
		});
	},

	/**
	 * Load a specific conversation
	 */
	loadConversation: function(conversationId, apiUsed) {
		this.conversationId = conversationId;

		// Switch to the API that was used for this conversation
		if (apiUsed && apiUsed !== this.config.api_config_name) {
			this.switchToAPI(apiUsed, () => {
				// After switching API, load the conversation
				this.loadConversationMessages(conversationId);
			});
		} else {
			// Same API, just load the conversation
			this.loadConversationMessages(conversationId);
		}

		// Switch to chat tab
		this.switchTab("chat");
	},

	/**
	 * Load conversation messages
	 */
	loadConversationMessages: function(conversationId) {
		const messagesDiv = document.getElementById("chatz-messages");

		// Clear messages
		messagesDiv.innerHTML = "";

		// Load conversation history
		ChatzHistoryManager.getConversationHistory(conversationId, 50, (result) => {
			if (result && result.status === "success" && result.messages) {
				result.messages.forEach(msg => {
					this.addMessageToDisplay(msg.message_type, msg.message_content, msg.created_at);
				});
				// Scroll to bottom after loading
				this.scrollToBottom();
			}
		});
	},

	/**
	 * Load last conversation on page load (filtered by current API)
	 */
	loadLastConversation: function() {
		// Clear messages immediately and ensure messages panel is visible
		const messagesDiv = document.getElementById("chatz-messages");
		const historyPanel = document.getElementById("chatz-history-panel");
		const modelsPanel = document.getElementById("chatz-models-panel");

		if (!messagesDiv) {
			console.error("Chatz: Messages div not found, widget may not be initialized yet");
			return;
		}

		messagesDiv.innerHTML = "";
		if (historyPanel) historyPanel.style.display = "none";
		if (modelsPanel) modelsPanel.style.display = "none";
		messagesDiv.style.display = "block";

		// Filter by current API config
		const apiFilter = this.config.api_config_name;

		ChatzHistoryManager.listConversations(1, apiFilter, (result) => {
			if (result && result.status === "success" && result.conversations && result.conversations.length > 0) {
				const lastConv = result.conversations[0];
				this.conversationId = lastConv.conversation_id;

				// Load conversation history
				ChatzHistoryManager.getConversationHistory(lastConv.conversation_id, 50, (histResult) => {
					if (histResult && histResult.status === "success" && histResult.messages) {
						histResult.messages.forEach(msg => {
							this.addMessageToDisplay(msg.message_type, msg.message_content, msg.created_at);
						});
						// Scroll to bottom after loading
						this.scrollToBottom();
					}
				});
			} else {
				// Start a new conversation
				this.conversationId = ChatzHistoryManager.generateConversationId();
				// Show greeting message for first-time users or when no history for this API
				if (this.config.greeting_message) {
					this.addMessageToDisplay("assistant", this.config.greeting_message, new Date().toISOString());
				}
			}
		});
	},

	/**
	 * Start a new chat
	 */
	startNewChat: function() {
		this.conversationId = ChatzHistoryManager.generateConversationId();
		const messagesDiv = document.getElementById("chatz-messages");

		// Clear messages
		messagesDiv.innerHTML = "";

		// Clear guest history from localStorage if guest
		if (this.isGuest) {
			this.clearGuestHistory();
		}

		// Switch to chat tab
		this.switchTab("chat");

		// Show greeting message if configured
		if (this.config.greeting_message) {
			this.addMessageToDisplay("assistant", this.config.greeting_message, new Date().toISOString());
		}
	},

	/**
	 * Toggle models panel
	 */
	toggleModelsPanel: function() {
		const panel = document.getElementById("chatz-models-panel");
		const historyPanel = document.getElementById("chatz-history-panel");
		const messagesDiv = document.getElementById("chatz-messages");

		if (panel.style.display === "none") {
			// Show models panel, hide history and messages
			panel.style.display = "block";
			historyPanel.style.display = "none";
			messagesDiv.style.display = "none";
		} else {
			// Hide models panel, show messages
			panel.style.display = "none";
			messagesDiv.style.display = "block";
		}
	},

	/**
	 * Load available API configurations
	 */
	loadAvailableAPIs: function() {
		frappe.call({
			method: "chatz.api.config.get_available_apis",
			callback: (r) => {
				if (r.message && r.message.status === "success") {
					this.availableAPIs = r.message.apis;
					this.renderModelsList();

					// Check if there's a saved API preference in localStorage
					this.restoreSavedAPI();
				}
			}
		});
	},

	/**
	 * Save current API to localStorage
	 */
	saveCurrentAPI: function() {
		if (!this.config || !this.config.api_config_name) {
			return;
		}

		const storageKey = `chatz_selected_api_${frappe.session.user}`;
		try {
			localStorage.setItem(storageKey, this.config.api_config_name);
		} catch (e) {
			// Silently fail if localStorage is not available
		}
	},

	/**
	 * Save guest message to localStorage
	 */
	saveGuestMessage: function(role, content) {
		if (!this.isGuest) return;

		try {
			const storageKey = 'chatz_guest_conversation';
			let messages = [];

			// Load existing messages
			const existing = localStorage.getItem(storageKey);
			if (existing) {
				messages = JSON.parse(existing);
			}

			// Add new message
			messages.push({
				role: role,
				content: content,
				timestamp: new Date().toISOString()
			});

			// Save back to localStorage
			localStorage.setItem(storageKey, JSON.stringify(messages));
		} catch (e) {
			// Silently fail if localStorage is not available
		}
	},

	/**
	 * Load guest conversation history from localStorage
	 */
	loadGuestHistory: function() {
		if (!this.isGuest) return [];

		try {
			const storageKey = 'chatz_guest_conversation';
			const existing = localStorage.getItem(storageKey);
			if (existing) {
				const messages = JSON.parse(existing);
				return messages;
			}
		} catch (e) {
			// Silently fail if localStorage is not available
		}
		return [];
	},

	/**
	 * Clear guest conversation history from localStorage
	 */
	clearGuestHistory: function() {
		if (!this.isGuest) return;

		try {
			const storageKey = 'chatz_guest_conversation';
			localStorage.removeItem(storageKey);
		} catch (e) {
			// Silently fail if localStorage is not available
		}
	},

	/**
	 * Get saved API from localStorage
	 */
	getSavedAPI: function() {
		const storageKey = `chatz_selected_api_${frappe.session.user}`;
		try {
			return localStorage.getItem(storageKey);
		} catch (e) {
			return null;
		}
	},

	/**
	 * Restore saved API preference from localStorage
	 */
	restoreSavedAPI: function() {
		const savedAPI = this.getSavedAPI();

		if (!savedAPI) {
			return;
		}

		// Check if saved API is still available
		const apiExists = this.availableAPIs && this.availableAPIs.some(api => api.name === savedAPI);

		if (!apiExists) {
			// Clear invalid saved preference
			try {
				localStorage.removeItem(`chatz_selected_api_${frappe.session.user}`);
			} catch (e) {}
			return;
		}

		// If saved API is different from current, switch to it
		if (savedAPI !== this.config.api_config_name) {
			this.switchAPI(savedAPI);
		}
	},

	/**
	 * Render the models list in the panel
	 */
	renderModelsList: function() {
		const listDiv = document.getElementById("chatz-models-list");
		listDiv.innerHTML = "";

		if (!this.availableAPIs || this.availableAPIs.length === 0) {
			listDiv.innerHTML = '<div class="chatz-no-models">No models available</div>';
			return;
		}

		this.availableAPIs.forEach(api => {
			const isActive = api.name === this.config.api_config_name;
			const modelItem = document.createElement("div");
			modelItem.className = "chatz-model-item" + (isActive ? " active" : "");

			// Get icon if available
			let iconHTML = '';
			if (api.widget_icon && frappe && frappe.utils && frappe.utils.icon) {
				iconHTML = frappe.utils.icon(api.widget_icon, 'sm');
			}

			modelItem.innerHTML = `
				<div class="chatz-model-icon">${iconHTML}</div>
				<div class="chatz-model-info">
					<div class="chatz-model-title">${api.widget_title || api.name}</div>
					${isActive ? '<div class="chatz-model-active-badge">Active</div>' : ''}
				</div>
			`;

			if (!isActive) {
				modelItem.style.cursor = "pointer";
				modelItem.addEventListener("click", () => {
					// Switch to chat tab first
					this.switchTab("chat");
					// Then switch API
					this.switchAPI(api.name);
					// Then start a new thread
					this.startNewChat();
				});
			}

			listDiv.appendChild(modelItem);
		});
	},

	/**
	 * Switch to a different API configuration with callback
	 * @param {String} apiName - Name of the API to switch to
	 * @param {Function} callback - Optional callback after switching
	 */
	switchToAPI: function(apiName, callback) {
		if (!apiName || apiName === this.config.api_config_name) {
			if (callback) callback();
			return;
		}

		// Load the new API configuration
		frappe.call({
			method: "chatz.api.config.get_api_config",
			args: {
				api_name: apiName
			},
			callback: (r) => {
				if (r.message && r.message.status === "success") {
					// Update config
					this.config = r.message;

					// Save API preference to localStorage
					this.saveCurrentAPI();

					// Apply new customization
					this.applyCustomization();

					// Update all icons to match new API
					this.updateChatTabIcon();
					this.updateToggleIcon();
					this.updateInputIcon();

					// Update models list to show new active model
					this.renderModelsList();

					// Call callback if provided
					if (callback) callback();
				}
			}
		});
	},

	/**
	 * Switch to a different API configuration
	 * @param {String} apiName - Name of the API to switch to
	 */
	switchAPI: function(apiName) {
		this.switchToAPI(apiName, () => {
			// Load last conversation for this API (or show greeting if none)
			this.loadLastConversation();
		});
	}
};

