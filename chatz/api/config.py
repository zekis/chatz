import frappe
import json
import requests


@frappe.whitelist(allow_guest=True)
def get_user_config():
	"""
	Get the current user's Chatz API configuration

	Returns:
		dict: User's API configuration or default guest config
	"""
	try:
		user = frappe.session.user

		# Check if user is guest
		if user == "Guest":
			return get_guest_config()

		# Get user's Chatz settings from User Chatz Settings doctype
		# Query by user field since document name is auto-generated
		user_settings_list = frappe.get_all(
			"User Chatz Settings",
			filters={"user": user},
			fields=["name", "chatz_enabled", "chatz_api_config", "chatz_model_name"],
			limit=1
		)

		if not user_settings_list:
			# No settings configured for this user - don't show widget
			return {
				"status": "error",
				"message": "No Chatz settings configured for this user"
			}

		# Get the first settings document
		user_settings_data = user_settings_list[0]

		# Check if chat is enabled for this user
		if not user_settings_data.chatz_enabled:
			return {
				"status": "error",
				"message": "Chatz is disabled for this user"
			}

		# Check if user has custom API config
		if not user_settings_data.chatz_api_config:
			return {
				"status": "error",
				"message": "No API configuration set for this user"
			}

		api_config_name = user_settings_data.chatz_api_config
		
		# Get the API configuration
		api_config = frappe.get_doc("Chatz API", api_config_name)

		if not api_config.enabled:
			frappe.log_error(
				"Disabled API Config",
				f"User {user} has disabled API config {api_config_name}"
			)
			return get_guest_config()

		# Get available models
		available_models = []
		if api_config.available_models:
			try:
				available_models = json.loads(api_config.available_models)
			except json.JSONDecodeError:
				pass

		# Determine which model to use
		model_name = api_config.model_name
		if user_settings_data.chatz_model_name:
			model_name = user_settings_data.chatz_model_name

		return {
			"status": "success",
			"api_endpoint": api_config.api_endpoint,
			"api_key": api_config.api_key,
			"model_name": model_name,
			"available_models": available_models,
			"system_prompt": api_config.system_prompt or "",
			"api_config_name": api_config_name,
			"include_csrf_token": api_config.include_csrf_token,
			"user": user,
			"widget_title": api_config.widget_title or "Chatz",
			"widget_icon": api_config.widget_icon or "comment",
			"primary_color": api_config.primary_color or "#667eea",
			"secondary_color": api_config.secondary_color or "#764ba2",
			"greeting_message": api_config.greeting_message or "Hello! How can I help you today?"
		}
		
	except Exception as e:
		frappe.log_error(
			"Error Getting User Config",
			f"Failed to get user config: {str(e)}"
		)
		return get_guest_config()


@frappe.whitelist()
def get_guest_config():
	"""
	Get the default guest configuration
	
	Returns:
		dict: Guest API configuration
	"""
	try:
		# Find the API config marked for guest users
		guest_config = frappe.db.get_value(
			"Chatz API",
			{"is_guest_default": 1, "enabled": 1},
			["name", "api_endpoint", "api_key", "model_name", "available_models", "system_prompt", "include_csrf_token", "widget_title", "widget_icon", "primary_color", "secondary_color", "greeting_message"],
			as_dict=True
		)

		if not guest_config:
			return {
				"status": "error",
				"message": "No guest configuration available"
			}

		# Parse available models
		available_models = []
		if guest_config.available_models:
			try:
				available_models = json.loads(guest_config.available_models)
			except json.JSONDecodeError:
				pass

		return {
			"status": "success",
			"api_endpoint": guest_config.api_endpoint,
			"api_key": guest_config.api_key,
			"model_name": guest_config.model_name,
			"available_models": available_models,
			"system_prompt": guest_config.system_prompt or "",
			"api_config_name": guest_config.name,
			"include_csrf_token": guest_config.include_csrf_token,
			"user": "Guest",
			"widget_title": guest_config.widget_title or "Chatz",
			"widget_icon": guest_config.widget_icon or "comment",
			"primary_color": guest_config.primary_color or "#667eea",
			"secondary_color": guest_config.secondary_color or "#764ba2",
			"greeting_message": guest_config.greeting_message or "Hello! How can I help you today?"
		}
		
	except Exception as e:
		frappe.log_error(
			"Error Getting Guest Config",
			f"Failed to get guest config: {str(e)}"
		)
		return {
			"status": "error",
			"message": f"Failed to get configuration: {str(e)}"
		}


@frappe.whitelist(allow_guest=True)
def get_available_apis():
	"""
	Get available Chatz API configurations for the current user
	Only returns APIs that are configured in the user's settings

	Returns:
		dict: List of available API configurations
	"""
	try:
		user = frappe.session.user

		if user == "Guest":
			# For guests, return the guest default API
			guest_default = frappe.db.get_value(
				"Chatz API",
				{"is_guest_default": 1, "enabled": 1},
				["name", "widget_title", "widget_icon"],
				as_dict=True
			)
			if guest_default:
				return {
					"status": "success",
					"apis": [guest_default],
					"default_api": guest_default.name
				}
			else:
				return {
					"status": "success",
					"apis": [],
					"default_api": None
				}

		# Get all user's Chatz Settings
		user_settings_list = frappe.get_all(
			"User Chatz Settings",
			filters={"user": user, "chatz_enabled": 1},
			fields=["chatz_api_config"],
			order_by="creation asc"
		)

		if not user_settings_list:
			return {
				"status": "success",
				"apis": [],
				"default_api": None
			}

		# Get unique API configs from user settings
		api_names = list(set([s.chatz_api_config for s in user_settings_list if s.chatz_api_config]))

		if not api_names:
			return {
				"status": "success",
				"apis": [],
				"default_api": None
			}

		# Get API details for configured APIs
		apis = frappe.get_all(
			"Chatz API",
			filters={"name": ["in", api_names], "enabled": 1},
			fields=["name", "widget_title", "widget_icon", "primary_color"],
			order_by="widget_title asc"
		)

		# First API in user's settings is the default
		default_api = user_settings_list[0].chatz_api_config if user_settings_list else None

		return {
			"status": "success",
			"apis": apis,
			"default_api": default_api
		}

	except Exception as e:
		frappe.log_error(
			"Error Getting Available APIs",
			f"Failed to get available APIs: {str(e)}"
		)
		return {
			"status": "error",
			"message": f"Failed to get APIs: {str(e)}"
		}


@frappe.whitelist(allow_guest=True)
def get_api_config(api_name):
	"""
	Get a specific API configuration by name

	Args:
		api_name (str): Name of the Chatz API configuration

	Returns:
		dict: API configuration
	"""
	try:
		user = frappe.session.user

		# Get the API configuration
		api_config = frappe.get_doc("Chatz API", api_name)

		if not api_config.enabled:
			return {
				"status": "error",
				"message": "API configuration is disabled"
			}

		# Get available models
		available_models = []
		if api_config.available_models:
			try:
				available_models = json.loads(api_config.available_models)
			except json.JSONDecodeError:
				pass

		# Get user's model override if they have one
		model_name = api_config.model_name
		if user != "Guest":
			user_settings_list = frappe.get_all(
				"User Chatz Settings",
				filters={"user": user},
				fields=["chatz_model_name"],
				limit=1
			)
			if user_settings_list and user_settings_list[0].chatz_model_name:
				model_name = user_settings_list[0].chatz_model_name

		return {
			"status": "success",
			"api_endpoint": api_config.api_endpoint,
			"api_key": api_config.api_key,
			"model_name": model_name,
			"available_models": available_models,
			"system_prompt": api_config.system_prompt or "",
			"api_config_name": api_name,
			"include_csrf_token": api_config.include_csrf_token,
			"user": user,
			"widget_title": api_config.widget_title or "Chatz",
			"widget_icon": api_config.widget_icon or "comment",
			"primary_color": api_config.primary_color or "#667eea",
			"secondary_color": api_config.secondary_color or "#764ba2",
			"greeting_message": api_config.greeting_message or "Hello! How can I help you today?"
		}

	except Exception as e:
		frappe.log_error(
			"Error Getting API Config",
			f"Failed to get API config {api_name}: {str(e)}"
		)
		return {
			"status": "error",
			"message": f"Failed to get configuration: {str(e)}"
		}


@frappe.whitelist()
def validate_user_chatz_enabled():
	"""
	Check if chat is enabled for the current user

	Returns:
		dict: Status of chat enablement
	"""
	try:
		user = frappe.session.user

		if user == "Guest":
			# Check if guest config exists
			guest_config = frappe.db.get_value(
				"Chatz API",
				{"is_guest_default": 1, "enabled": 1},
				"name"
			)
			return {
				"status": "success",
				"enabled": guest_config is not None
			}

		# Get user document
		user_doc = frappe.get_doc("User", user)

		# Check if chatz is enabled for this user
		if hasattr(user_doc, 'chatz_enabled'):
			enabled = user_doc.chatz_enabled
		else:
			# Default to enabled if field doesn't exist
			enabled = True

		return {
			"status": "success",
			"enabled": enabled
		}

	except Exception as e:
		frappe.log_error(
			"Error Validating User Chatz",
			f"Failed to validate user chatz status: {str(e)}"
		)
		return {
			"status": "error",
			"message": f"Failed to validate: {str(e)}"
		}


@frappe.whitelist()
def call_streaming_api(api_config_name, messages):
	"""
	Proxy API call through Frappe backend to include CSRF token

	Args:
		api_config_name (str): Name of the Chatz API configuration
		messages (str): JSON string of messages array

	Returns:
		dict: API response
	"""
	try:
		# Get the API configuration
		api_config = frappe.get_doc("Chatz API", api_config_name)

		if not api_config.enabled:
			return {
				"status": "error",
				"message": "API configuration is disabled"
			}

		# Parse messages
		if isinstance(messages, str):
			messages = json.loads(messages)

		# Build the payload
		payload = {
			"model": api_config.model_name,
			"messages": messages,
			"stream": True
		}

		# Build headers
		headers = {
			"Content-Type": "application/json",
			"Authorization": f"Bearer {api_config.api_key}"
		}

		# Add CSRF token if enabled
		if api_config.include_csrf_token:
			headers["X-Frappe-CSRF-Token"] = frappe.csrf_token

		# Make the API call
		endpoint = api_config.api_endpoint.rstrip("/")
		url = f"{endpoint}/chat/completions"

		frappe.logger().info(f"Chatz: Calling API {url} with CSRF token: {api_config.include_csrf_token}")

		response = requests.post(url, json=payload, headers=headers, stream=True, timeout=300)

		if response.status_code != 200:
			error_text = response.text
			frappe.logger().error(f"Chatz API Error: {response.status_code} - {error_text}")
			return {
				"status": "error",
				"message": f"API Error: {response.status_code}",
				"error": error_text
			}

		# Return the streaming response
		return {
			"status": "success",
			"stream": response.iter_lines()
		}

	except Exception as e:
		frappe.log_error(
			"Error Calling Streaming API",
			f"Failed to call streaming API: {str(e)}"
		)
		return {
			"status": "error",
			"message": f"Failed to call API: {str(e)}"
		}

