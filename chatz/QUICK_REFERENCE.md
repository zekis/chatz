# Chatz App - Quick Reference

## File Locations

### Doctypes
- `chatz/chatz/doctype/chatz_api/` - API configuration storage
- `chatz/chatz/doctype/chatz_history/` - Message history storage
- `chatz/chatz/doctype/user_chatz_settings/` - User-specific settings

### Backend
- `chatz/api/config.py` - User configuration retrieval
- `chatz/utils/context_formatter.py` - Context formatting utilities

### Frontend
- `chatz/public/js/chatz_init.js` - Widget initialization (loads first)
- `chatz/public/js/chatz_context.js` - Context detection
- `chatz/public/js/chatz_api_client.js` - OpenAI API calls
- `chatz/public/js/chatz_history_manager.js` - History management
- `chatz/public/js/chatz_widget.js` - Main widget UI
- `chatz/public/css/chatz_widget.css` - Widget styling

## Key Methods

### Backend (Python)

**Config API** (`chatz/api/config.py`):
```python
get_user_config()              # Get user's API config
get_guest_config()             # Get guest default config
validate_user_chatz_enabled()  # Check if chat enabled
```

**History API** (`chatz/chatz/doctype/chatz_history/chatz_history.py`):
```python
save_message(user, conversation_id, message_type, message_content, 
             document_context, api_used)
get_conversation_history(conversation_id, limit)
list_conversations(limit)
```

**Model Fetching** (`chatz/chatz/doctype/chatz_api/chatz_api.py`):
```python
fetch_available_models(api_name)  # Fetch models from API
```

### Frontend (JavaScript)

**ChatzContext**:
```javascript
ChatzContext.getCurrentContext()        // Get current view context
ChatzContext.formatContextForDisplay()  // Format for display
ChatzContext.getContextJSON()           // Get as JSON string
```

**ChatzAPIClient**:
```javascript
ChatzAPIClient.callStreamingAPI(config, messages, onChunk, onComplete, onError)
ChatzAPIClient.buildMessagesArray(config, history, userMessage)
ChatzAPIClient.validateConfig(config)
```

**ChatzHistoryManager**:
```javascript
ChatzHistoryManager.saveMessage(conversationId, messageType, content, context, apiUsed, callback)
ChatzHistoryManager.getConversationHistory(conversationId, limit, callback)
ChatzHistoryManager.listConversations(limit, callback)
ChatzHistoryManager.generateConversationId()
```

**ChatzWidget**:
```javascript
ChatzWidget.init(apiConfig)           // Initialize widget
ChatzWidget.toggleWidget()            // Show/hide widget
ChatzWidget.sendMessage()             // Send message
ChatzWidget.addMessageToDisplay()     // Add message to UI
ChatzWidget.renderMarkdown(content)   // Render markdown
```

## Data Flow

```
User Types Message
    ↓
ChatzWidget.sendMessage()
    ↓
ChatzContext.getCurrentContext() - Capture context
    ↓
ChatzHistoryManager.saveMessage() - Save user message
    ↓
ChatzHistoryManager.getConversationHistory() - Get history
    ↓
ChatzAPIClient.buildMessagesArray() - Build API request
    ↓
ChatzAPIClient.callStreamingAPI() - Call OpenAI API
    ↓
ChatzWidget.updateLastMessage() - Display streaming response
    ↓
ChatzHistoryManager.saveMessage() - Save assistant response
```

## Configuration Fields

### Chatz API
- `api_name` - Unique identifier
- `api_endpoint` - Base URL (e.g., https://api.openai.com/v1)
- `api_key` - API authentication key
- `model_name` - Default model to use
- `available_models` - JSON list of available models
- `system_prompt` - AI behavior instructions
- `is_guest_default` - Use for guest users
- `enabled` - Enable/disable this config

### User Chatz Settings
- `user` - User reference
- `chatz_enabled` - Enable/disable chat for user
- `chatz_api_config` - User's API configuration
- `chatz_model_name` - User's model override

### Chatz History
- `user` - Message owner
- `conversation_id` - Groups messages
- `message_type` - "user" or "assistant"
- `message_content` - Message text
- `document_context` - JSON with context info
- `api_used` - Which API config was used
- `created_at` - Timestamp

## Markdown Support

The widget supports:
- **Code blocks**: ` ```code``` `
- **Inline code**: `` `code` ``
- **Bold**: `**text**`
- **Italic**: `*text*`
- **Line breaks**: `\n`

## API Response Format

### get_user_config()
```json
{
  "status": "success",
  "api_endpoint": "https://api.openai.com/v1",
  "model_name": "gpt-3.5-turbo",
  "available_models": ["gpt-3.5-turbo", "gpt-4"],
  "system_prompt": "You are helpful",
  "api_config_name": "OpenAI",
  "user": "user@example.com"
}
```

### save_message()
```json
{
  "status": "success",
  "message_id": "abc123",
  "message": "Message saved successfully"
}
```

### fetch_available_models()
```json
{
  "status": "success",
  "models": ["gpt-3.5-turbo", "gpt-4"],
  "message": "Successfully fetched 2 models"
}
```

## Permissions

- **Chatz API**: System Manager only
- **Chatz History**: Users can read/write their own, System Manager full access
- **User Chatz Settings**: System Manager only

## Hooks Configuration

```python
app_include_css = "/assets/chatz/css/chatz_widget.css"
app_include_js = [
    "/assets/chatz/js/chatz_context.js",
    "/assets/chatz/js/chatz_api_client.js",
    "/assets/chatz/js/chatz_history_manager.js",
    "/assets/chatz/js/chatz_widget.js",
    "/assets/chatz/js/chatz_init.js"
]
```

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Widget not showing | Check hooks.py, rebuild assets |
| API calls fail | Verify endpoint URL and API key |
| Messages not saving | Check permissions, verify database |
| Markdown not rendering | Check CSS is loaded, verify content |
| Guest access denied | Create guest config, set is_guest_default |
| Model dropdown empty | Click "Fetch Models" button |

## Testing Commands

```bash
# Check if app is installed
bench list-apps | grep chatz

# Rebuild assets
bench build

# Clear cache
bench clear-cache

# Check logs
bench logs -f
```

