import frappe
import requests
import json
from frappe.model.document import Document


class ChatzAPI(Document):
	"""DocType for storing OpenAI-compatible API configurations"""

	def validate(self):
		"""Validate API configuration"""
		if not self.api_endpoint:
			frappe.throw("API Endpoint is required")
		if not self.api_key:
			frappe.throw("API Key is required")
		if not self.model_name:
			frappe.throw("Default Model is required")

	def before_save(self):
		"""Ensure only one guest default configuration"""
		if self.is_guest_default:
			# Check if another config is already set as guest default
			existing = frappe.db.get_value(
				"Chatz API",
				{"is_guest_default": 1, "name": ["!=", self.name]},
				"name"
			)
			if existing:
				frappe.throw(
					f"Guest default is already set for '{existing}'. "
					"Please disable it first."
				)


@frappe.whitelist()
def fetch_available_models(api_name):
	"""
	Fetch available models from OpenAI-compatible API endpoint
	
	Args:
		api_name (str): Name of the Chatz API configuration
		
	Returns:
		dict: Response with status and models list or error message
	"""
	try:
		# Get the API configuration
		api_config = frappe.get_doc("Chatz API", api_name)
		
		if not api_config.enabled:
			return {
				"status": "error",
				"message": "This API configuration is disabled"
			}
		
		# Prepare headers with API key
		headers = {
			"Authorization": f"Bearer {api_config.api_key}",
			"Content-Type": "application/json"
		}
		
		# Construct the models endpoint URL
		endpoint = api_config.api_endpoint.rstrip("/")
		models_url = f"{endpoint}/models"
		
		# Make request to fetch models
		response = requests.get(
			models_url,
			headers=headers,
			timeout=10
		)
		
		if response.status_code != 200:
			frappe.log_error(
				f"API Error: {response.status_code}",
				f"Failed to fetch models from {models_url}: {response.text}"
			)
			return {
				"status": "error",
				"message": f"API returned status {response.status_code}"
			}
		
		# Parse response
		data = response.json()
		
		# Extract model IDs from response
		# OpenAI-compatible APIs return models in format: {"data": [{"id": "model-name"}, ...]}
		models = []
		if "data" in data:
			models = [model.get("id") for model in data["data"] if "id" in model]
		
		if not models:
			return {
				"status": "error",
				"message": "No models found in API response"
			}
		
		# Update the Chatz API document with available models
		api_config.available_models = json.dumps(models)
		api_config.save(ignore_permissions=True)
		
		return {
			"status": "success",
			"models": models,
			"message": f"Successfully fetched {len(models)} models"
		}
		
	except requests.exceptions.Timeout:
		frappe.log_error(
			"API Timeout",
			f"Request to fetch models timed out for {api_name}"
		)
		return {
			"status": "error",
			"message": "Request timed out. Please check your API endpoint."
		}
	except requests.exceptions.ConnectionError as e:
		frappe.log_error(
			"Connection Error",
			f"Failed to connect to API for {api_name}: {str(e)}"
		)
		return {
			"status": "error",
			"message": "Failed to connect to API endpoint"
		}
	except json.JSONDecodeError:
		frappe.log_error(
			"JSON Parse Error",
			f"Invalid JSON response from API for {api_name}"
		)
		return {
			"status": "error",
			"message": "Invalid response format from API"
		}
	except Exception as e:
		frappe.log_error(
			"Unexpected Error",
			f"Error fetching models for {api_name}: {str(e)}"
		)
		return {
			"status": "error",
			"message": f"An error occurred: {str(e)}"
		}

