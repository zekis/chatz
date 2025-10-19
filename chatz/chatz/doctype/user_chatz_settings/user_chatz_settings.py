import frappe
from frappe.model.document import Document


class UserChatzSettings(Document):
	"""DocType for storing user-specific Chatz settings"""

	def validate(self):
		"""Validate user settings"""
		if not self.user:
			frappe.throw("User is required")
		
		# Verify user exists
		if not frappe.db.exists("User", self.user):
			frappe.throw(f"User {self.user} does not exist")
		
		# Verify API config exists if specified
		if self.chatz_api_config:
			if not frappe.db.exists("Chatz API", self.chatz_api_config):
				frappe.throw(f"Chatz API {self.chatz_api_config} does not exist")

