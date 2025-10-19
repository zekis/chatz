frappe.ui.form.on('Chatz History', {
	refresh: function(frm) {
		// Make form read-only since history is immutable
		frm.set_read_only();
		
		// Add button to view full conversation
		if (frm.doc.conversation_id) {
			frm.add_custom_button(__('View Conversation'), function() {
				view_full_conversation(frm.doc.conversation_id);
			}, __('Actions'));
		}
	}
});

function view_full_conversation(conversation_id) {
	// Open a dialog showing all messages in the conversation
	frappe.call({
		method: 'chatz.chatz.doctype.chatz_history.chatz_history.get_conversation_history',
		args: {
			conversation_id: conversation_id,
			limit: 100
		},
		callback: function(r) {
			if (r.message && r.message.status === 'success') {
				show_conversation_dialog(r.message.messages);
			}
		}
	});
}

function show_conversation_dialog(messages) {
	let html = '<div class="chatz-conversation-view">';
	
	messages.forEach(function(msg) {
		const message_class = msg.message_type === 'user' ? 'user-message' : 'assistant-message';
		const timestamp = frappe.datetime.str_to_user(msg.created_at);
		
		html += `
			<div class="message ${message_class}">
				<div class="message-header">
					<strong>${msg.message_type === 'user' ? 'You' : 'Assistant'}</strong>
					<span class="message-time">${timestamp}</span>
				</div>
				<div class="message-content">${frappe.utils.html_escape(msg.message_content)}</div>
			</div>
		`;
	});
	
	html += '</div>';
	
	frappe.msgprint({
		title: __('Conversation'),
		message: html,
		wide: true
	});
}

