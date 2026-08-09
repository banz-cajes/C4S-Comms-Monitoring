// ============================================
// C4 SYSTEMS - Chat Functions (Simplified)
// ============================================

let chatMessages = [];
let chatListener = null;
let isChatOpen = false;
let unreadCount = 0;

// ============================================
// INITIALIZE CHAT
// ============================================

function initChat() {
    console.log('💬 Initializing chat...');
    if (!currentUser) {
        console.log('⏳ Waiting for user...');
        setTimeout(initChat, 1000);
        return;
    }
    setupChatListener();
}

// ============================================
// TOGGLE CHAT
// ============================================

function toggleChat() {
    const chatBox = document.getElementById('chatBox');
    isChatOpen = chatBox.style.display !== 'none';
    chatBox.style.display = isChatOpen ? 'none' : 'flex';
    if (!isChatOpen) {
        setTimeout(() => document.getElementById('chatInput')?.focus(), 300);
        scrollChatToBottom();
        // Mark all current messages as read
        markAllMessagesAsRead();
        unreadCount = 0;
        updateChatBadge();
    }
}

// ============================================
// SETUP CHAT LISTENER
// ============================================

function setupChatListener() {
    if (chatListener) {
        chatListener();
        chatListener = null;
    }
    
    if (!db || !currentUser) return;
    
    console.log('💬 Setting up chat listener...');
    
    chatListener = db.collection('chat_messages')
        .orderBy('timestamp', 'desc')
        .limit(50)
        .onSnapshot(snapshot => {
            const messages = [];
            snapshot.forEach(doc => {
                messages.push({ id: doc.id, ...doc.data() });
            });
            messages.sort((a, b) => {
                const ta = a.timestamp?.toDate?.() || new Date(a.timestamp);
                const tb = b.timestamp?.toDate?.() || new Date(b.timestamp);
                return ta - tb;
            });
            chatMessages = messages;
            renderChatMessages();
            // Update unread count (count messages not from current user and not in readBy)
            updateUnreadCount();
        }, error => {
            console.warn('Chat listener error:', error.message);
            // If permission denied, disable chat UI and show guidance
            if (error.code === 'permission-denied') {
                const chatBox = document.getElementById('chatBox');
                const chatInput = document.getElementById('chatInput');
                const chatSendBtn = document.getElementById('chatSendBtn');
                const chatToggle = document.getElementById('chatToggleBtn');
                if (chatInput) chatInput.disabled = true;
                if (chatSendBtn) chatSendBtn.disabled = true;
                if (chatToggle) chatToggle.title = 'Chat unavailable: insufficient Firestore permissions';
                showToast('Chat unavailable: missing Firestore permissions. Check project rules.', 'error');
                return;
            }

            // For other errors, try to reconnect after 5 seconds
            setTimeout(setupChatListener, 5000);
        });
}

// ============================================
// RENDER CHAT MESSAGES
// ============================================

function renderChatMessages() {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    
    if (chatMessages.length === 0) {
        container.innerHTML = `
            <div class="chat-welcome">
                <i class="fas fa-comments" style="font-size: 2rem; color: var(--gray-400);"></i>
                <p style="color: var(--gray-500); margin-top: 0.5rem;">No messages yet</p>
                <p style="font-size: 0.7rem; color: var(--gray-400);">Be the first to send a message!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = chatMessages.map(msg => {
        const isSelf = msg.userId === currentUser?.uid;
        const userName = msg.userName || 'Unknown';
        const isUnread = msg.readBy && !msg.readBy.includes(currentUser?.uid);
        const time = msg.timestamp?.toDate?.() || new Date(msg.timestamp);
        const timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        
        return `
            <div class="chat-message ${isSelf ? 'chat-message-self' : 'chat-message-other'} ${isUnread ? 'unread' : ''}">
                <div class="msg-user">
                    ${isSelf ? 'You' : escapeHtml(userName)}
                    <span class="msg-time">${timeStr}</span>
                </div>
                <div>${escapeHtml(msg.text)}</div>
            </div>
        `;
    }).join('');
    
    scrollChatToBottom();
}

// ============================================
// SCROLL CHAT TO BOTTOM
// ============================================

function scrollChatToBottom() {
    const container = document.getElementById('chatMessages');
    if (container) {
        setTimeout(() => container.scrollTop = container.scrollHeight, 100);
    }
}

// ============================================
// SEND CHAT MESSAGE
// ============================================

async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    if (!input) return;
    
    const text = input.value.trim();
    if (!text) return;
    if (!currentUser) {
        showToast('Please login to send messages', 'error');
        return;
    }
    
    const sendBtn = document.getElementById('chatSendBtn');
    input.disabled = true;
    if (sendBtn) sendBtn.disabled = true;
    
    try {
        await db.collection('chat_messages').add({
            text: text,
            userId: currentUser.uid,
            userName: currentUser.email?.split('@')[0] || 'User',
            userEmail: currentUser.email,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        input.value = '';
    } catch (error) {
        console.error('Send error:', error);
        if (error.code === 'permission-denied') {
            showToast('Send failed: insufficient Firestore permissions. Contact admin.', 'error');
            const chatInput = document.getElementById('chatInput');
            const chatSendBtn = document.getElementById('chatSendBtn');
            if (chatInput) chatInput.disabled = true;
            if (chatSendBtn) chatSendBtn.disabled = true;
            return;
        }
        showToast('Failed to send: ' + error.message, 'error');
    } finally {
        input.disabled = false;
        if (sendBtn) sendBtn.disabled = false;
        input.focus();
    }
}

// ============================================
// UNREAD MESSAGE TRACKING
// ============================================

function updateUnreadCount() {
    if (!currentUser) return;
    unreadCount = chatMessages.filter(msg => {
        // Unread if: not from current user AND (no readBy array OR current user not in readBy)
        return msg.userId !== currentUser.uid && (!msg.readBy || !msg.readBy.includes(currentUser.uid));
    }).length;
    updateChatBadge();
}

function updateChatBadge() {
    const badge = document.getElementById('chatBadge');
    if (!badge) return;
    if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

async function markAllMessagesAsRead() {
    if (!db || !currentUser || !chatMessages.length) return;
    const messagesForThisUser = chatMessages.filter(msg => msg.userId !== currentUser.uid);
    
    // Batch update messages to add current user to readBy array
    const batch = db.batch();
    messagesForThisUser.forEach(msg => {
        const docRef = db.collection('chat_messages').doc(msg.id);
        const readBy = msg.readBy || [];
        if (!readBy.includes(currentUser.uid)) {
            readBy.push(currentUser.uid);
            batch.update(docRef, { readBy: readBy });
        }
    });
    
    try {
        await batch.commit();
        unreadCount = 0;
        updateChatBadge();
    } catch (error) {
        console.warn('Error marking messages as read:', error);
    }
}

// ============================================
// HANDLE CHAT KEYDOWN
// ============================================

function handleChatKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendChatMessage();
    }
}

console.log('✅ Chat.js loaded (simplified)');