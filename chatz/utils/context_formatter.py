import frappe
import json


def format_document_context(context_data):
	"""
	Format and validate document context data
	
	Args:
		context_data (dict or str): Raw context data from frontend
		
	Returns:
		dict: Formatted context data
	"""
	try:
		# Parse if string
		if isinstance(context_data, str):
			context_data = json.loads(context_data)
		
		# Validate and format context
		formatted_context = {
			"doctype": context_data.get("doctype", ""),
			"docname": context_data.get("docname", ""),
			"list_filter": context_data.get("list_filter", ""),
			"page_url": context_data.get("page_url", ""),
			"page_title": context_data.get("page_title", "")
		}
		
		return formatted_context
		
	except Exception as e:
		frappe.log_error(
			"Error Formatting Context",
			f"Failed to format document context: {str(e)}"
		)
		return {}


def get_document_summary(doctype, docname):
	"""
	Get a summary of a document for context
	
	Args:
		doctype (str): Type of document
		docname (str): Name of document
		
	Returns:
		str: Summary of the document
	"""
	try:
		# Check if document exists and user has permission
		if not frappe.db.exists(doctype, docname):
			return f"Document {doctype} {docname} not found"
		
		# Get document
		doc = frappe.get_doc(doctype, docname)
		
		# Build summary
		summary = f"Document: {doctype} - {docname}\n"
		
		# Add key fields (title, subject, etc.)
		for field in ["title", "subject", "name", "status"]:
			if hasattr(doc, field):
				value = getattr(doc, field)
				if value:
					summary += f"{field}: {value}\n"
		
		return summary
		
	except Exception as e:
		frappe.log_error(
			"Error Getting Document Summary",
			f"Failed to get summary for {doctype} {docname}: {str(e)}"
		)
		return f"Unable to retrieve document information"


def get_list_context_summary(doctype, filters=None):
	"""
	Get a summary of a list view for context
	
	Args:
		doctype (str): Type of document
		filters (dict): Filters applied to the list
		
	Returns:
		str: Summary of the list view
	"""
	try:
		summary = f"List View: {doctype}\n"
		
		# Get count of documents
		count = frappe.db.count(doctype, filters=filters or {})
		summary += f"Total records: {count}\n"
		
		if filters:
			summary += f"Filters applied: {json.dumps(filters)}\n"
		
		return summary
		
	except Exception as e:
		frappe.log_error(
			"Error Getting List Context",
			f"Failed to get list context for {doctype}: {str(e)}"
		)
		return f"Unable to retrieve list information"

