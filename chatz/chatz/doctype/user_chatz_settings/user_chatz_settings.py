import frappe
from frappe.model.document import Document


class UserChatzSettings(Document):
	"""DocType for storing user or role-specific Chatz settings"""

	def validate(self):
		"""Validate user/role settings"""
		# Ensure assignment_type is set
		if not self.assignment_type:
			frappe.throw("Assignment Type is required")

		# Validate based on assignment type
		if self.assignment_type == "User":
			if not self.user:
				frappe.throw("User is required when Assignment Type is 'User'")

			# Verify user exists
			if not frappe.db.exists("User", self.user):
				frappe.throw(f"User {self.user} does not exist")

			# Clear role field if user is selected
			self.role = None

		elif self.assignment_type == "Role":
			if not self.role:
				frappe.throw("Role is required when Assignment Type is 'Role'")

			# Verify role exists
			if not frappe.db.exists("Role", self.role):
				frappe.throw(f"Role {self.role} does not exist")

			# Clear user field if role is selected
			self.user = None

		# Verify API config exists if specified
		if self.chatz_api_config:
			if not frappe.db.exists("Chatz API", self.chatz_api_config):
				frappe.throw(f"Chatz API {self.chatz_api_config} does not exist")

