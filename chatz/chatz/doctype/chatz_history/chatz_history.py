import frappe
from frappe.model.document import Document
from datetime import datetime


class ChatzHistory(Document):
	"""DocType for storing chat conversation history"""

	def before_insert(self):
		"""Set created_at timestamp before inserting"""
		if not self.created_at:
			self.created_at = datetime.now()

	def validate(self):
		"""Validate chat history entry"""
		if not self.user:
			frappe.throw("User is required")
		if not self.conversation_id:
			frappe.throw("Conversation ID is required")
		if self.message_type not in ["user", "assistant"]:
			frappe.throw("Message Type must be 'user' or 'assistant'")
		if not self.message_content:
			frappe.throw("Message Content is required")

	def before_save(self):
		"""Ensure user can only save their own messages"""
		if self.user != frappe.session.user and not frappe.session.user == "Administrator":
			frappe.throw("You can only save messages for your own user")


@frappe.whitelist(allow_guest=True)
def save_message(user, conversation_id, message_type, message_content,
				 document_context=None, api_used=None):
	"""
	Save a chat message to history
	
	Args:
		user (str): Username
		conversation_id (str): Unique conversation identifier
		message_type (str): "user" or "assistant"
		message_content (str): The message text
		document_context (str): JSON string with document context
		api_used (str): Name of the Chatz API configuration used
		
	Returns:
		dict: Response with status and message ID
	"""
	try:
		# Ensure user is saving their own messages
		if user != frappe.session.user and frappe.session.user != "Administrator":
			return {
				"status": "error",
				"message": "You can only save messages for your own user"
			}
		
		# Create new Chatz History document
		doc = frappe.new_doc("Chatz History")
		doc.user = user
		doc.conversation_id = conversation_id
		doc.message_type = message_type
		doc.message_content = message_content
		
		if document_context:
			doc.document_context = document_context
		
		if api_used:
			doc.api_used = api_used
		
		doc.insert(ignore_permissions=True)
		
		return {
			"status": "success",
			"message_id": doc.name,
			"message": "Message saved successfully"
		}
		
	except Exception as e:
		frappe.log_error(
			"Error Saving Message",
			f"Failed to save message for user {user}: {str(e)}"
		)
		return {
			"status": "error",
			"message": f"Failed to save message: {str(e)}"
		}


@frappe.whitelist(allow_guest=True)
def get_conversation_history(conversation_id, limit=50):
	"""
	Retrieve messages for a specific conversation
	
	Args:
		conversation_id (str): Unique conversation identifier
		limit (int): Maximum number of messages to retrieve
		
	Returns:
		list: List of message documents
	"""
	try:
		# Get messages for the conversation, ordered by creation time
		messages = frappe.get_list(
			"Chatz History",
			filters={
				"conversation_id": conversation_id,
				"user": frappe.session.user
			},
			fields=["name", "message_type", "message_content", "document_context", "created_at"],
			order_by="created_at asc",
			limit_page_length=limit
		)
		
		return {
			"status": "success",
			"messages": messages
		}
		
	except Exception as e:
		frappe.log_error(
			"Error Retrieving History",
			f"Failed to retrieve conversation history: {str(e)}"
		)
		return {
			"status": "error",
			"message": f"Failed to retrieve history: {str(e)}"
		}


@frappe.whitelist(allow_guest=True)
def list_conversations(limit=20, api_filter=None):
	"""
	Get list of conversations for current user

	Args:
		limit (int): Maximum number of conversations to retrieve
		api_filter (str): Optional API name to filter conversations

	Returns:
		list: List of unique conversations with latest message
	"""
	try:
		# Ensure limit is an integer
		limit = int(limit) if limit else 20

		# Build SQL query with optional API filter
		if api_filter:
			conversations = frappe.db.sql("""
				SELECT DISTINCT conversation_id, api_used, MAX(created_at) as last_message_at
				FROM `tabChatz History`
				WHERE user = %s AND api_used = %s
				GROUP BY conversation_id, api_used
				ORDER BY last_message_at DESC
				LIMIT {0}
			""".format(limit), (frappe.session.user, api_filter), as_dict=True)
		else:
			conversations = frappe.db.sql("""
				SELECT DISTINCT conversation_id, api_used, MAX(created_at) as last_message_at
				FROM `tabChatz History`
				WHERE user = %s
				GROUP BY conversation_id, api_used
				ORDER BY last_message_at DESC
				LIMIT {0}
			""".format(limit), (frappe.session.user,), as_dict=True)

		# Enrich with first message content for preview
		for conv in conversations:
			first_msg = frappe.db.get_value(
				"Chatz History",
				{
					"conversation_id": conv["conversation_id"],
					"user": frappe.session.user,
					"message_type": "user"
				},
				"message_content",
				order_by="created_at asc"
			)
			conv["first_message"] = first_msg if first_msg else "No preview"
			conv["created_at"] = conv["last_message_at"]

		return {
			"status": "success",
			"conversations": conversations
		}

	except Exception as e:
		frappe.log_error(
			"Error Listing Conversations",
			f"Failed to list conversations: {str(e)}"
		)
		return {
			"status": "error",
			"message": f"Failed to list conversations: {str(e)}"
		}

