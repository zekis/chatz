/**
 * Chatz Context Capture Module
 * Detects and captures context from current Frappe view
 */

const ChatzContext = {
	/**
	 * Get current view context
	 * @returns {Object} Context object with doctype, docname, etc.
	 */
	getCurrentContext: function() {
		const context = {
			doctype: "",
			docname: "",
			list_filter: "",
			page_url: window.location.href,
			page_title: document.title
		};

		// Check if we're in a form view (Desk only)
		if (typeof cur_frm !== "undefined" && cur_frm) {
			context.doctype = cur_frm.doctype;
			context.docname = cur_frm.docname;
			return context;
		}

		// Check if we're in a list view (Desk only)
		if (typeof cur_list !== "undefined" && cur_list) {
			context.doctype = cur_list.doctype;

			// Get filter information
			if (cur_list.filter_area && cur_list.filter_area.get()) {
				const filters = cur_list.filter_area.get();
				context.list_filter = JSON.stringify(filters);
			}

			return context;
		}

		// Check if we're on a page (Desk only)
		if (typeof frappe !== "undefined" && frappe.get_route && frappe.get_route()[0] === 'page') {
			context.page_title = frappe.get_route()[1];
		}

		return context;
	},

	/**
	 * Format context for display in chat
	 * @param {Object} context - Context object
	 * @returns {String} Formatted context string
	 */
	formatContextForDisplay: function(context) {
		let formatted = "";

		if (context.doctype && context.docname) {
			formatted += `📄 Document: ${context.doctype} - ${context.docname}\n`;
		} else if (context.doctype) {
			formatted += `📋 List: ${context.doctype}`;
			if (context.list_filter) {
				formatted += ` (with filters)`;
			}
			formatted += "\n";
		}

		if (context.page_title && !context.doctype) {
			formatted += `📖 Page: ${context.page_title}\n`;
		}

		return formatted;
	},

	/**
	 * Get context as JSON string
	 * @returns {String} JSON string of context
	 */
	getContextJSON: function() {
		return JSON.stringify(this.getCurrentContext());
	}
};

