frappe.ui.form.on('User Chatz Settings', {
	refresh: function(frm) {
		// Update model name field options based on selected API config
		if (frm.doc.chatz_api_config) {
			frappe.call({
				method: 'frappe.client.get',
				args: {
					doctype: 'Chatz API',
					name: frm.doc.chatz_api_config
				},
				callback: function(r) {
					if (r.message) {
						const api_config = r.message;
						if (api_config.available_models) {
							try {
								const models = JSON.parse(api_config.available_models);
								if (Array.isArray(models) && models.length > 0) {
									frm.set_df_property('chatz_model_name', 'options', models.join('\n'));
									frm.set_df_property('chatz_model_name', 'fieldtype', 'Select');
									frm.refresh_field('chatz_model_name');
								}
							} catch (e) {
								console.error('Error parsing models:', e);
							}
						}
					}
				}
			});
		}
	},
	
	chatz_api_config: function(frm) {
		// Clear model name when API config changes
		frm.set_value('chatz_model_name', '');
		frm.refresh();
	}
});

