# Chatz - OpenAI-Compatible Chat Widget for Frappe

A complete Frappe app that adds an intelligent floating chat widget to the Frappe Desk interface, powered by OpenAI-compatible APIs.

## 🎯 Features

✅ **OpenAI-Compatible API Support** - Works with any OpenAI-compatible endpoint
✅ **Dynamic Model Fetching** - Automatically discover available models from your API
✅ **Markdown Rendering** - Beautiful formatted responses with code blocks
✅ **User Isolation** - Each user has their own isolated chat history
✅ **Guest Support** - Optional default configuration for guest users
✅ **Document Context** - Automatically captures current view context
✅ **Streaming Responses** - Real-time message display as they arrive
✅ **Conversation Management** - Group and resume conversations
✅ **Responsive Design** - Works on desktop and mobile devices
✅ **System Prompts** - Configurable AI behavior guidance

## 📦 What's Included

### Doctypes (3)
1. **Chatz API** - Store and manage API configurations
2. **Chatz History** - Store conversation messages and history
3. **User Chatz Settings** - Per-user configuration overrides

### Backend Components
- **Config API** - User configuration retrieval
- **History API** - Message storage and retrieval
- **Model Fetching** - Dynamic model discovery
- **Context Utilities** - Document context formatting

### Frontend Components
- **Widget** - Main floating chat interface
- **Context Capture** - Automatic view detection
- **API Client** - OpenAI-compatible API calls with streaming
- **History Manager** - Conversation management
- **Initialization** - Auto-load on page load

### Styling
- **Responsive CSS** - Mobile-friendly design
- **Gradient UI** - Modern purple gradient theme
- **Markdown Styles** - Proper code block and text formatting

## 🚀 Quick Start

### 1. Install
```bash
bench get-app chatz /path/to/chatz
bench install-app chatz
bench migrate
bench build
```

### 2. Configure
1. Go to **Chatz API** in Frappe Desk
2. Create new configuration with:
   - API Endpoint (e.g., `https://api.openai.com/v1`)
   - API Key
   - Default Model
3. Click **Fetch Models** to discover available models
4. Check **Use for Guest Users** if needed
5. Save

### 3. Use
- Log in to Frappe Desk
- Look for purple chat button in bottom-right
- Click to open widget and start chatting!

## 📁 File Structure

```
chatz/
├── chatz/doctype/
│   ├── chatz_api/              # API configuration doctype
│   ├── chatz_history/          # Message history doctype
│   └── user_chatz_settings/    # User settings doctype
├── api/
│   └── config.py               # Configuration API methods
├── utils/
│   └── context_formatter.py    # Context utilities
├── public/
│   ├── js/
│   │   ├── chatz_init.js       # Initialization
│   │   ├── chatz_context.js    # Context detection
│   │   ├── chatz_api_client.js # API calls
│   │   ├── chatz_history_manager.js  # History management
│   │   └── chatz_widget.js     # Main widget
│   └── css/
│       └── chatz_widget.css    # Widget styling
├── hooks.py                    # App configuration
└── Documentation files
```

## 🔧 Configuration

### Chatz API Fields
- **API Name** - Unique identifier
- **API Endpoint** - Base URL of your API
- **API Key** - Authentication key
- **Default Model** - Model to use by default
- **Available Models** - Auto-populated after fetching
- **System Prompt** - Instructions for AI behavior
- **Use for Guest Users** - Default config for guests
- **Enabled** - Enable/disable this configuration

### User Settings (Optional)
- **API Configuration** - Override default API config
- **Model Name** - Override default model
- **Enable Chatz** - Enable/disable chat for user

## 📚 Documentation

- **IMPLEMENTATION.md** - Detailed architecture and design
- **IMPLEMENTATION_COMPLETE.md** - Complete feature list
- **SETUP_AND_TESTING.md** - Installation and testing guide
- **QUICK_REFERENCE.md** - API reference and common tasks

## 🔐 Security

- API keys stored securely in password fields
- User isolation enforced at database level
- HTML sanitization in markdown rendering
- No API keys exposed to frontend
- CORS handled by API provider

## 🎨 Customization

### Styling
Edit `chatz/public/css/chatz_widget.css` to customize:
- Colors and gradients
- Widget size and position
- Message styling
- Animations

### Markdown Rendering
Modify `ChatzWidget.renderMarkdown()` in `chatz/public/js/chatz_widget.js` to:
- Add more markdown features
- Use external markdown library (marked.js, etc.)
- Add syntax highlighting

### Context Capture
Extend `ChatzContext.getCurrentContext()` in `chatz/public/js/chatz_context.js` to:
- Capture additional context
- Include custom fields
- Add metadata

## 🐛 Troubleshooting

**Widget not appearing?**
- Check browser console for errors
- Verify Chatz API configuration exists
- Run `bench build` to rebuild assets

**API calls failing?**
- Verify API endpoint URL
- Check API key is valid
- Ensure endpoint is accessible
- Check browser console for CORS errors

**Messages not saving?**
- Verify user has permissions
- Check database connection
- Look for JavaScript errors

## 📊 Database

### Key Tables
- `tabChatz API` - API configurations
- `tabChatz History` - Message history
- `tabUser Chatz Settings` - User settings

### Useful Queries
```sql
-- View all messages for a user
SELECT * FROM `tabChatz History` 
WHERE user = 'user@example.com' 
ORDER BY created_at DESC;

-- Count conversations
SELECT conversation_id, COUNT(*) as messages
FROM `tabChatz History`
GROUP BY conversation_id;
```

## 🤝 Contributing

To extend or modify:
1. Review the architecture in IMPLEMENTATION.md
2. Check QUICK_REFERENCE.md for API details
3. Follow existing code patterns
4. Test thoroughly before deploying

## 📝 License

MIT License - See LICENSE file

## 🆘 Support

For issues or questions:
1. Check SETUP_AND_TESTING.md for common issues
2. Review browser console for errors
3. Check Frappe logs: `bench logs -f`
4. Verify configuration in Chatz API doctype

## 🎓 Learning Resources

- **Frappe Documentation**: https://frappeframework.com/docs
- **OpenAI API**: https://platform.openai.com/docs
- **JavaScript Modules**: See individual JS files for documentation

---

**Version**: 0.0.1  
**Last Updated**: 2025-10-16  
**Status**: ✅ Complete and Ready for Testing

