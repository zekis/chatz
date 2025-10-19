/**
 * Chatz API Client Module
 * Handles OpenAI-compatible API calls with streaming support
 */

const ChatzAPIClient = {
	/**
	 * Call OpenAI-compatible API with streaming
	 * @param {Object} config - API configuration
	 * @param {Array} messages - Message history
	 * @param {Function} onChunk - Callback for each streamed chunk
	 * @param {Function} onComplete - Callback when complete
	 * @param {Function} onError - Callback on error
	 */
	callStreamingAPI: async function(config, messages, onChunk, onComplete, onError) {
		try {
			const endpoint = config.api_endpoint.replace(/\/$/, "");
			const url = `${endpoint}/chat/completions`;

			const payload = {
				model: config.model_name,
				messages: messages,
				stream: true,
				temperature: 1.0
			};

			// Build headers
			const headers = {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${config.api_key}`
			};

			// Add CSRF token if enabled - use frappe.csrf_token directly
			if (config.include_csrf_token && frappe.csrf_token) {
				headers["X-Frappe-CSRF-Token"] = frappe.csrf_token;
			}

			const response = await fetch(url, {
				method: "POST",
				headers: headers,
				body: JSON.stringify(payload)
			});

			if (!response.ok) {
				const error = await response.text();
				console.error("Chatz API Client: API returned error", {
					status: response.status,
					error: error
				});
				onError(`API Error: ${response.status} - ${error}`);
				return;
			}

			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let buffer = "";
			let chunkCount = 0;

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split("\n");

				// Process all complete lines
				for (let i = 0; i < lines.length - 1; i++) {
					const line = lines[i].trim();
					if (line.startsWith("data: ")) {
						const data = line.slice(6);
						if (data === "[DONE]") {
							onComplete();
							return;
						}
						try {
							const json = JSON.parse(data);
							const chunk = json.choices?.[0]?.delta?.content;
							if (chunk) {
								chunkCount++;
								onChunk(chunk);
							}
						} catch (e) {
							// Skip invalid JSON lines
						}
					}
				}

				// Keep the last incomplete line in buffer
				buffer = lines[lines.length - 1];
			}

			onComplete();
		} catch (error) {
			onError(`Network error: ${error.message}`);
		}
	},

	/**
	 * Build messages array for API call
	 * @param {Object} config - API configuration
	 * @param {Array} history - Previous messages
	 * @param {String} userMessage - Current user message
	 * @param {Object} context - Current context (optional)
	 * @returns {Array} Messages array for API
	 */
	buildMessagesArray: function(config, history, userMessage, context) {
		const messages = [];

		// Build system prompt with context
		let systemPrompt = config.system_prompt || "You are a helpful assistant.";

		// Add user and time information
		let contextInfo = "\n\nCurrent Information:\n";

		// Add current date and time
		const now = new Date();
		const dateTimeStr = now.toLocaleString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			timeZoneName: 'short'
		});
		contextInfo += `- Current Date & Time: ${dateTimeStr}\n`;

		// Add user name if available
		if (config.user) {
			contextInfo += `- User: ${config.user}\n`;
		}

		// Add context information to system prompt
		if (context) {
			if (context.doctype && context.docname) {
				contextInfo += `- Document: ${context.doctype} (${context.docname})\n`;

				// Include document data if available
				if (context.document_data) {
					contextInfo += "\nDocument Data:\n";
					contextInfo += "```json\n";
					contextInfo += JSON.stringify(context.document_data, null, 2);
					contextInfo += "\n```\n";
				}
			} else if (context.doctype) {
				contextInfo += `- List View: ${context.doctype}\n`;
				if (context.list_filter) {
					contextInfo += `- Filters: ${context.list_filter}\n`;
				}
			}
			if (context.page_title && !context.doctype) {
				contextInfo += `- Page: ${context.page_title}\n`;
			}
		}

		systemPrompt += contextInfo;

		messages.push({
			role: "system",
			content: systemPrompt
		});

		// Add conversation history
		if (history && Array.isArray(history)) {
			history.forEach(msg => {
				messages.push({
					role: msg.message_type === "user" ? "user" : "assistant",
					content: msg.message_content
				});
			});
		}

		// Add current user message
		messages.push({
			role: "user",
			content: userMessage
		});

		return messages;
	},

	/**
	 * Validate API configuration
	 * @param {Object} config - API configuration
	 * @returns {Object} Validation result
	 */
	validateConfig: function(config) {
		if (!config.api_endpoint) {
			return { valid: false, error: "API endpoint not configured" };
		}
		if (!config.model_name) {
			return { valid: false, error: "Model name not configured" };
		}
		return { valid: true };
	}
};

