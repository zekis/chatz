/**
 * Chatz Initialization Module
 * Initializes the chat widget on page load
 */

(function() {
	// Wait for Frappe to be ready
	if (typeof frappe === "undefined") {
		return;
	}

	// Initialize widget when document is ready
	document.addEventListener("DOMContentLoaded", function() {
		// Give Frappe a moment to fully initialize
		setTimeout(initializeChatzWidget, 500);
	});

	// Also try to initialize immediately if Frappe is already loaded
	if (document.readyState === "loading") {
		// Document is still loading, wait for DOMContentLoaded
	} else {
		// Document is already loaded, initialize after a short delay
		setTimeout(initializeChatzWidget, 500);
	}

	/**
	 * Initialize the Chatz widget
	 */
	function initializeChatzWidget() {
		// Get user configuration
		frappe.call({
			method: "chatz.api.config.get_user_config",
			callback: function(r) {
				if (r.message && r.message.status === "success") {
					const config = r.message;

					// Validate configuration
					const validation = ChatzAPIClient.validateConfig(config);
					if (!validation.valid) {
						return;
					}

					// Initialize widget
					ChatzWidget.init(config);
				}
			}
		});
	}
})();

