frappe.ui.form.on('Chatz API', {
	refresh: function(frm) {
		// Show fetch models button only if both endpoint and key are filled
		if (frm.doc.api_endpoint && frm.doc.api_key) {
			frm.add_custom_button(__('Fetch Models'), function() {
				fetch_models(frm);
			}, __('Actions'));
		}
		
		// Update model_name field to be a dropdown if models are available
		if (frm.doc.available_models) {
			try {
				const models = JSON.parse(frm.doc.available_models);
				if (Array.isArray(models) && models.length > 0) {
					// Set the field to have options from available models
					frm.set_df_property('model_name', 'options', models.join('\n'));
					frm.set_df_property('model_name', 'fieldtype', 'Select');
				}
			} catch (e) {
				console.error('Error parsing available models:', e);
			}
		}
	},
	
	api_endpoint: function(frm) {
		// Refresh to show/hide fetch button
		frm.refresh();
	},
	
	api_key: function(frm) {
		// Refresh to show/hide fetch button
		frm.refresh();
	}
});

function fetch_models(frm) {
	frappe.call({
		method: 'chatz.chatz.doctype.chatz_api.chatz_api.fetch_available_models',
		args: {
			api_name: frm.doc.name
		},
		callback: function(r) {
			if (r.message) {
				if (r.message.status === 'success') {
					frappe.msgprint({
						title: __('Success'),
						indicator: 'green',
						message: r.message.message
					});
					
					// Refresh the form to show updated models
					frm.reload_doc();
				} else {
					frappe.msgprint({
						title: __('Error'),
						indicator: 'red',
						message: r.message.message
					});
				}
			}
		},
		error: function(r) {
			frappe.msgprint({
				title: __('Error'),
				indicator: 'red',
				message: __('Failed to fetch models. Please check your API configuration.')
			});
		}
	});
}

