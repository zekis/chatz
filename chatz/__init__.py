__version__ = "0.0.1"

import frappe
from frappe.utils import is_website_user
#check app permission()

def check_app_permission():
    if frappe.session.user == "Administrator":
        return True

    return False
