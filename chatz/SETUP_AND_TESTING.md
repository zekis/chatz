# Chatz App - Setup and Testing Guide

## Installation

1. **Install the app** in your Frappe instance:
   ```bash
   bench get-app chatz /path/to/chatz
   bench install-app chatz
   ```

2. **Migrate database**:
   ```bash
   bench migrate
   ```

3. **Build assets**:
   ```bash
   bench build
   ```

## Initial Setup

### Step 1: Create a Chatz API Configuration

1. Go to **Chatz API** list in Frappe Desk
2. Click **New**
3. Fill in the following:
   - **API Name**: e.g., "OpenAI Production"
   - **API Endpoint**: e.g., `https://api.openai.com/v1`
   - **API Key**: Your OpenAI API key
   - **Default Model**: e.g., `gpt-3.5-turbo`
   - **System Prompt**: (Optional) e.g., "You are a helpful assistant"
   - **Use for Guest Users**: Check if this should be the default for guests
   - **Enabled**: Check to enable

4. Click **Fetch Models** button
   - This will fetch available models from your API endpoint
   - Models will be populated in the "Available Models" field
   - The "Default Model" field becomes a dropdown

5. Save the configuration

### Step 2: Configure User Settings (Optional)

For users who need custom API configurations:

1. Go to **User Chatz Settings** list
2. Click **New**
3. Select the **User**
4. Choose their preferred **API Configuration**
5. Optionally override the **Model Name**
6. Check **Enable Chatz** to enable for this user
7. Save

### Step 3: Test the Widget

1. Log in as a user with Chatz enabled
2. Navigate to any Frappe Desk page
3. Look for the purple chat button in the bottom-right corner
4. Click to open the chat widget
5. Type a test message and send

## Testing Scenarios

### Test 1: Basic Chat Functionality
- **Steps**:
  1. Open the chat widget
  2. Send a simple message like "Hello"
  3. Wait for response
  
- **Expected Result**:
  - Message appears in widget
  - Response streams in real-time
  - Message is saved to Chatz History

### Test 2: Markdown Rendering
- **Steps**:
  1. Send a message asking for code: "Show me a Python hello world"
  2. Verify the response renders properly
  
- **Expected Result**:
  - Code blocks display with proper formatting
  - Bold and italic text render correctly
  - Line breaks are preserved

### Test 3: Document Context
- **Steps**:
  1. Open a specific document (e.g., a Customer)
  2. Open the chat widget
  3. Send a message: "What information do you see?"
  
- **Expected Result**:
  - Widget shows document context
  - Message is saved with document context
  - Check Chatz History to verify context was stored

### Test 4: Conversation History
- **Steps**:
  1. Send multiple messages in sequence
  2. Close and reopen the widget
  3. Send another message
  
- **Expected Result**:
  - New conversation ID is generated
  - Each message is saved separately
  - API receives full conversation history

### Test 5: Guest User Access
- **Steps**:
  1. Log out or use guest session
  2. Try to access the chat widget
  
- **Expected Result**:
  - Widget loads with guest configuration
  - Chat works with default API settings
  - Messages are saved with "Guest" user

### Test 6: User-Specific Configuration
- **Steps**:
  1. Create two Chatz API configurations
  2. Set different users to use different configs
  3. Log in as each user and verify
  
- **Expected Result**:
  - Each user uses their configured API
  - Model selection respects user settings

## Troubleshooting

### Widget doesn't appear
- Check browser console for errors
- Verify `app_include_js` and `app_include_css` in hooks.py
- Clear browser cache and rebuild assets: `bench build`
- Check that Chatz API configuration exists and is enabled

### API calls fail
- Verify API endpoint URL is correct
- Check API key is valid
- Ensure API endpoint is accessible from your server
- Check browser console for CORS errors
- Verify model name is valid for the API

### Messages not saving
- Check Chatz History permissions
- Verify user has permission to create Chatz History documents
- Check browser console for JavaScript errors
- Verify database connection

### Markdown not rendering
- Check that message content is being saved correctly
- Verify CSS is loaded: check Network tab in browser DevTools
- Check for JavaScript errors in console

## Database Queries for Testing

### Check saved messages:
```sql
SELECT * FROM `tabChatz History` 
WHERE user = 'user@example.com' 
ORDER BY created_at DESC;
```

### Check conversations:
```sql
SELECT DISTINCT conversation_id, COUNT(*) as message_count
FROM `tabChatz History`
WHERE user = 'user@example.com'
GROUP BY conversation_id;
```

### Check API configurations:
```sql
SELECT name, api_endpoint, enabled, is_guest_default 
FROM `tabChatz API`;
```

## Performance Considerations

- **Message Limit**: Default retrieves last 50 messages per conversation
- **Conversation Limit**: Default lists last 20 conversations
- **Streaming**: Responses stream in real-time for better UX
- **Context Storage**: Document context stored as JSON for flexibility

## Security Checklist

- [ ] API keys are stored in password fields
- [ ] User isolation is enforced
- [ ] HTML is sanitized in markdown rendering
- [ ] Only authenticated users can access chat
- [ ] Guest configuration is optional
- [ ] API keys never exposed in frontend code

