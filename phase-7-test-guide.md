# 🧪 Phase 7 Testing Guide - Real-time Chat & WhatsApp Integration

## 📋 E2E Testing Checklist

### 🔐 1. Authentication & Setup
```
🌐 URL: http://localhost:3004/login
📧 Credentials:
   - Admin: admin@test.com / 123456
   - Lawyer: lawyer@test.com / 123456
   - Client: client@test.com / 123456
```

### 💬 2. Chat Interface Testing

#### A. Admin/Lawyer View
1. **Login as Admin** (admin@test.com)
2. **Navigate to Messages** 
   - URL: http://localhost:3004/messages
   - Verify split-screen layout (conversation list + chat area)
   - Check notification bell icon in header

3. **Conversation List Features**
   - ✅ Search conversations by typing in search box
   - ✅ Filter by status: "Todas", "Não lidas", "Urgentes"
   - ✅ Click funnel icon to show topic filters
   - ✅ Select different topics (Geral, Consulta Jurídica, etc.)
   - ✅ Verify topic color indicators

4. **Create New Conversation**
   - Click "+" button in conversation list header
   - **Step 1: Select Client**
     - Search for "João" or "Maria"
     - Click on a client to select
   - **Step 2: Configure Details**
     - Select topic (test each: Geral, Urgente, Documentos)
     - Modify title or keep default
     - Set priority (Normal/Alta/Urgente)
     - Choose conversation type
   - Click "Criar Conversa"

5. **Real-time Messaging**
   - Select a conversation from list
   - Type a message and press Enter or click send
   - Verify:
     - ✅ Message appears instantly
     - ✅ Timestamp shows correctly
     - ✅ Message status indicator (sent/delivered/read)
     - ✅ Your messages appear on right (blue)
     - ✅ Other messages on left (gray)

6. **Typing Indicators**
   - Start typing in message box
   - Look for "digitando..." indicator
   - Stop typing and verify it disappears after 3 seconds

7. **File Attachments** (UI Testing)
   - Click paperclip icon
   - Verify attachment options appear
   - Test emoji picker (smiley face icon)

#### B. Client Portal View
1. **Login as Client** (client@test.com)
2. **Navigate to Client Messages**
   - URL: http://localhost:3004/portal/client/messages
   - Verify client-friendly interface
   - Check quick action buttons:
     - "Iniciar Chat Urgente" (red)
     - "Nova Consulta" (blue)
     - "Enviar Documento" (green)

3. **Client Messaging**
   - Select or create a conversation
   - Send a test message
   - Verify simpler interface without admin controls

### 🏷️ 3. Topic Management Testing

1. **Access Topic Admin** (as Admin)
   - URL: http://localhost:3004/admin/chat-topics
   - Verify 5 default topics displayed

2. **Create New Topic**
   - Click "Novo Tópico"
   - Fill in:
     - Nome: "Teste Financeiro"
     - Descrição: "Discussões sobre pagamentos"
     - Select color (click predefined or use color picker)
     - Choose icon from dropdown
     - Keep "Tópico ativo" checked
   - Click "Criar"

3. **Edit Existing Topic**
   - Click pencil icon on any topic
   - Change name/color/description
   - Click "Atualizar"

4. **Topic Statistics**
   - Check statistics panel showing:
     - Total de Tópicos
     - Tópicos Ativos
     - Total de Conversas
     - Média por Tópico

5. **Toggle Topic Status**
   - Click status button (Ativo/Inativo)
   - Verify visual change (opacity)

### 🔔 4. Notification System Testing

1. **Notification Panel**
   - Look for bell icon in header (top right)
   - Click to open notification dropdown
   - Check for:
     - Unread count badge
     - Notification list
     - "Marcar todas como lidas" button

2. **Notification Types**
   - Send messages between users to trigger notifications
   - Verify different icons:
     - 💬 New message
     - 🔴 Urgent
     - 📱 WhatsApp
     - 👤 Mention

3. **Mark as Read**
   - Click checkmark on individual notification
   - Or use "Marcar todas como lidas"
   - Verify unread count updates

### 📱 5. WhatsApp Integration Testing

1. **WhatsApp Configuration** (Admin only)
   - Check for WhatsApp indicators:
     - 📱 icon on WhatsApp-enabled conversations
     - WhatsApp status in message details

2. **WhatsApp Auto-Reply** (Simulated)
   - Note: In mock mode, check console logs for:
     - "WhatsApp webhook received"
     - "Processing incoming WhatsApp message"
     - Auto-reply triggers for off-hours

3. **Message Status (WhatsApp)**
   - Look for WhatsApp-specific status:
     - Single gray check (sent)
     - Double gray check (delivered)
     - Double blue check (read)

### 📊 6. Performance & Real-time Testing

1. **Multiple Browser Tabs**
   - Open app in 2+ browser tabs
   - Login as different users
   - Send messages and verify real-time sync

2. **Conversation Updates**
   - Create conversation in one tab
   - Verify it appears in other tabs
   - Check real-time message delivery

3. **Status Synchronization**
   - Mark messages as read in one tab
   - Verify status updates in other tabs

### 🐛 7. Edge Cases & Error Handling

1. **Empty States**
   - New user with no conversations
   - Search with no results
   - Empty notification panel

2. **Long Content**
   - Send very long message (500+ chars)
   - Long conversation title
   - Many topics (create 10+)

3. **Rapid Actions**
   - Send multiple messages quickly
   - Rapid topic switching
   - Quick conversation creation

4. **Network Issues** (Simulate)
   - Send message and quickly go offline
   - Check retry mechanisms
   - Verify status indicators

### ✅ 8. Feature Verification Checklist

#### Core Chat Features
- [ ] Real-time message delivery
- [ ] Typing indicators
- [ ] Message status (sent/delivered/read)
- [ ] Conversation list with filters
- [ ] Search functionality
- [ ] Unread message counts
- [ ] Auto-scroll to latest message
- [ ] Timestamp formatting (PT-BR)

#### Topic System
- [ ] Create/Edit/Delete topics
- [ ] Topic color customization
- [ ] Topic filtering in conversations
- [ ] Topic assignment on creation
- [ ] Topic statistics display

#### Notifications
- [ ] Real-time notification updates
- [ ] Notification panel UI
- [ ] Mark as read functionality
- [ ] Notification count badges
- [ ] Different notification types

#### WhatsApp Integration
- [ ] WhatsApp indicators
- [ ] Message status specific to WhatsApp
- [ ] Auto-reply simulation
- [ ] Phone number formatting

#### UI/UX
- [ ] Responsive design (mobile/desktop)
- [ ] Brazilian Portuguese throughout
- [ ] Professional styling
- [ ] Smooth animations
- [ ] Loading states
- [ ] Error messages

### 🎯 9. Test Scenarios

#### Scenario 1: Urgent Client Communication
1. Login as Client
2. Click "Iniciar Chat Urgente"
3. Send urgent message
4. Switch to Lawyer account
5. Verify urgent notification
6. Respond to client
7. Check status updates

#### Scenario 2: Document Discussion
1. Create conversation with "Documentos" topic
2. Simulate document discussion
3. Use file attachment UI
4. Verify topic filtering works

#### Scenario 3: Multi-participant Chat
1. Create conversation as Admin
2. Add multiple participants (future feature)
3. Test message flow between users
4. Verify notifications for all parties

### 📝 10. Known Limitations (Mock Mode)

1. **No Real WhatsApp**: API calls are simulated
2. **Mock Data**: Conversations use sample data
3. **No File Upload**: Attachment UI only
4. **Limited Participants**: Simplified participant model
5. **No Email/Push**: Notifications are UI-only

### 🚀 Success Criteria

✅ **Phase 7 is successful if:**
1. All users can send/receive messages in real-time
2. Topic system allows organization of conversations
3. Notifications appear for new messages
4. WhatsApp integration points are visible
5. UI is responsive and professional
6. All text is in Brazilian Portuguese
7. No console errors during normal use
8. Performance is smooth with multiple conversations

---

## 🔧 Troubleshooting

### Common Issues:

1. **Messages not appearing**
   - Check browser console for errors
   - Verify Supabase connection
   - Ensure proper user authentication

2. **Notifications not updating**
   - Refresh page
   - Check notification permissions
   - Verify real-time subscriptions

3. **Topic filter not working**
   - Clear filters and reapply
   - Check topic assignment on conversations
   - Verify topic is active

4. **Status indicators wrong**
   - Check message_status table
   - Verify user IDs match
   - Look for console errors

---

## 📊 Test Results Summary

| Feature | Status | Notes |
|---------|--------|-------|
| Real-time Chat | ⏳ | Test in progress |
| Topic System | ⏳ | Test in progress |
| Notifications | ⏳ | Test in progress |
| WhatsApp UI | ⏳ | Test in progress |
| Client Portal | ⏳ | Test in progress |
| Performance | ⏳ | Test in progress |

**Last Updated**: [Current Date/Time]
**Tester**: [Your Name]
**Environment**: Development (Mock Auth)