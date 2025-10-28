/**
 * Chatz History Manager Module
 * Handles conversation history storage and retrieval
 */

const ChatzHistoryManager = {
	/**
	 * Save a message to history
	 * @param {String} conversationId - Unique conversation ID
	 * @param {String} messageType - "user" or "assistant"
	 * @param {String} messageContent - Message text
	 * @param {Object} context - Document context
	 * @param {String} apiUsed - API configuration name
	 * @param {Function} callback - Callback function
	 */
	saveMessage: function(conversationId, messageType, messageContent, context, apiUsed, callback) {
		// Validate that we have a valid user session
		if (!frappe.session || !frappe.session.user || frappe.session.user === "None") {
			console.error("Chatz: Cannot save message - no valid user session");
			if (callback) {
				callback({ status: "error", message: "No valid user session" });
			}
			return;
		}

		frappe.call({
			method: "chatz.chatz.doctype.chatz_history.chatz_history.save_message",
			args: {
				user: frappe.session.user,
				conversation_id: conversationId,
				message_type: messageType,
				message_content: messageContent,
				document_context: JSON.stringify(context),
				api_used: apiUsed
			},
			callback: function(r) {
				if (callback) {
					callback(r.message);
				}
			},
			error: function(r) {
				console.error("Chatz: Error saving message:", r);
				if (callback) {
					callback({ status: "error", message: "Failed to save message" });
				}
			}
		});
	},

	/**
	 * Get conversation history
	 * @param {String} conversationId - Unique conversation ID
	 * @param {Number} limit - Maximum messages to retrieve
	 * @param {Function} callback - Callback function
	 */
	getConversationHistory: function(conversationId, limit, callback) {
		frappe.call({
			method: "chatz.chatz.doctype.chatz_history.chatz_history.get_conversation_history",
			args: {
				conversation_id: conversationId,
				limit: limit || 50
			},
			callback: function(r) {
				if (callback) {
					callback(r.message);
				}
			},
			error: function(r) {
				if (callback) {
					callback({ status: "error", messages: [] });
				}
			}
		});
	},

	/**
	 * List all conversations for current user
	 * @param {Number} limit - Maximum conversations to retrieve
	 * @param {String} apiFilter - Optional API name to filter conversations
	 * @param {Function} callback - Callback function
	 */
	listConversations: function(limit, apiFilter, callback) {
		// Handle overloaded parameters (backward compatibility)
		if (typeof apiFilter === 'function') {
			callback = apiFilter;
			apiFilter = null;
		}

		frappe.call({
			method: "chatz.chatz.doctype.chatz_history.chatz_history.list_conversations",
			args: {
				limit: limit || 20,
				api_filter: apiFilter
			},
			callback: function(r) {
				if (callback) {
					callback(r.message);
				}
			},
			error: function(r) {
				if (callback) {
					callback({ status: "error", conversations: [] });
				}
			}
		});
	},

	/**
	 * Generate a unique conversation ID
	 * @returns {String} Unique conversation ID
	 */
	generateConversationId: function() {
		return "conv_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
	}
};

