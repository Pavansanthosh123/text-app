// Initialize Firebase with the configuration
const firebaseConfig = {
    apiKey: "AIzaSyAB_9d59jW_d8wMIOoO9x7OblF1HfYicHM",
    authDomain: "textchat-72254.firebaseapp.com",
    projectId: "textchat-72254",
    storageBucket: "textchat-72254.firebasestorage.app",
    messagingSenderId: "419154452897",
    appId: "1:419154452897:web:4367b60ddfe3920e98abe0",
    measurementId: "G-8YCC1GY7F6"
};

firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const signupScreen = document.getElementById('signup-screen');
const chatScreen = document.getElementById('chat-screen');
const showSignupBtn = document.getElementById('show-signup');
const showLoginBtn = document.getElementById('show-login');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const logoutBtn = document.getElementById('logout-btn');
const currentUserElement = document.getElementById('current-user');
const contactsList = document.getElementById('contacts-list');
const chatRecipient = document.getElementById('chat-recipient');
const recipientStatus = document.getElementById('recipient-status');
const messagesContainer = document.getElementById('messages-container');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const attachBtn = document.getElementById('attach-btn');
const sendBtn = document.getElementById('send-btn');
const batteryLevelElement = document.getElementById('battery-level');
const currentTimeElement = document.getElementById('current-time');
const loadingOverlay = document.getElementById('loading-overlay');
const searchContactsInput = document.getElementById('search-contacts');

// Global variables
let currentUser = null;
let selectedContact = null;
let unsubscribeMessages = null;
let allContacts = [];

// Sample contacts data (would normally come from Firebase)
const sampleContacts = [
    { id: '1', name: 'John Doe', avatar: 'J', lastMessage: 'Hey, how are you?', lastMessageTime: '10:30 AM', status: 'online' },
    { id: '2', name: 'Jane Smith', avatar: 'J', lastMessage: 'Can we meet tomorrow?', lastMessageTime: '9:15 AM', status: 'offline' },
    { id: '3', name: 'Mike Johnson', avatar: 'M', lastMessage: 'I sent you the files', lastMessageTime: 'Yesterday', status: 'online' },
    { id: '4', name: 'Sarah Williams', avatar: 'S', lastMessage: 'Thanks for your help!', lastMessageTime: 'Yesterday', status: 'offline' },
    { id: '5', name: 'David Brown', avatar: 'D', lastMessage: 'Let me know when you\'re free', lastMessageTime: 'Monday', status: 'online' }
];

// Show loading overlay
function showLoading() {
    loadingOverlay.classList.add('active');
}

// Hide loading overlay
function hideLoading() {
    loadingOverlay.classList.remove('active');
}

// Switch between screens
function showScreen(screen) {
    [loginScreen, signupScreen, chatScreen].forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
}

// UI event listeners
showSignupBtn.addEventListener('click', () => showScreen(signupScreen));
showLoginBtn.addEventListener('click', () => showScreen(loginScreen));

// Login form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        showLoading();
        // For demo purposes, we'll just set the current user without actual Firebase auth
        currentUser = { username };
        await simulateApiCall(1000); // Simulate network delay
        setupChatScreen();
        hideLoading();
    } catch (error) {
        hideLoading();
        alert('Login failed: ' + error.message);
    }
});

// Signup form submission
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('new-username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    
    try {
        showLoading();
        // For demo purposes, we'll just set the current user without actual Firebase auth
        currentUser = { username };
        await simulateApiCall(1500); // Simulate network delay
        setupChatScreen();
        hideLoading();
    } catch (error) {
        hideLoading();
        alert('Signup failed: ' + error.message);
    }
});

// Logout functionality
logoutBtn.addEventListener('click', () => {
    currentUser = null;
    selectedContact = null;
    if (unsubscribeMessages) {
        unsubscribeMessages();
    }
    showScreen(loginScreen);
    loginForm.reset();
});

// Setup chat screen
function setupChatScreen() {
    currentUserElement.textContent = currentUser.username;
    showScreen(chatScreen);
    allContacts = [...sampleContacts]; // Store all contacts
    loadContacts(allContacts);
    setupContactSearch();
    trackBatteryAndTime();
    trackUserActivity();
}

// Load contacts
function loadContacts(contacts) {
    contactsList.innerHTML = '';
    
    contacts.forEach(contact => {
        const contactElement = document.createElement('div');
        contactElement.className = 'contact-item';
        contactElement.dataset.contactId = contact.id;
        
        contactElement.innerHTML = `
            <div class="contact-avatar">${contact.avatar}</div>
            <div class="contact-info">
                <div class="contact-name">${contact.name}</div>
                <div class="last-message">${contact.lastMessage}</div>
            </div>
            <div class="message-time">${contact.lastMessageTime}</div>
        `;
        
        contactElement.addEventListener('click', () => selectContact(contact));
        
        contactsList.appendChild(contactElement);
    });
}

// Setup contact search functionality
function setupContactSearch() {
    searchContactsInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        
        if (!searchTerm) {
            loadContacts(allContacts);
            return;
        }
        
        const filteredContacts = allContacts.filter(contact => 
            contact.name.toLowerCase().includes(searchTerm) || 
            contact.lastMessage.toLowerCase().includes(searchTerm)
        );
        
        loadContacts(filteredContacts);
    });
}

// Select a contact to chat with
function selectContact(contact) {
    selectedContact = contact;
    
    // Update UI
    document.querySelectorAll('.contact-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.contactId === contact.id) {
            item.classList.add('active');
        }
    });
    
    chatRecipient.textContent = contact.name;
    recipientStatus.textContent = contact.status;
    
    // Enable message input
    messageInput.disabled = false;
    attachBtn.disabled = false;
    sendBtn.disabled = false;
    
    // Load messages
    loadMessages();
}

// Load messages for the selected contact
function loadMessages() {
    // Clear current messages
    messagesContainer.innerHTML = '';
    
    // Sample messages with read receipts (would normally come from Firebase)
    const sampleMessages = [
        { 
            sender: selectedContact.id, 
            content: 'Hey there!', 
            timestamp: new Date(Date.now() - 3600000),
            status: 'seen'
        },
        { 
            sender: 'me', 
            content: 'Hi! How are you?', 
            timestamp: new Date(Date.now() - 3500000),
            status: 'seen'
        },
        { 
            sender: selectedContact.id, 
            content: 'I\'m good, thanks! What about you?', 
            timestamp: new Date(Date.now() - 3400000),
            status: 'seen'
        },
        { 
            sender: 'me', 
            content: 'Doing well, just working on this chat app.', 
            timestamp: new Date(Date.now() - 3000000),
            status: 'delivered'
        }
    ];
    
    // Display messages
    sampleMessages.forEach(message => {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.sender === 'me' ? 'message-sent' : 'message-received'}`;
        
        // For sent messages, include read receipt
        const readReceiptHtml = message.sender === 'me' ? 
            `<div class="read-receipt">${getReadReceiptIcon(message.status)}</div>` : '';
        
        messageElement.innerHTML = `
            <div class="message-content">${message.content}</div>
            <div class="message-footer">
                <div class="message-timestamp">${formatTimestamp(message.timestamp)}</div>
                ${readReceiptHtml}
            </div>
        `;
        
        messagesContainer.appendChild(messageElement);
    });
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Get appropriate icon for read receipt status
function getReadReceiptIcon(status) {
    switch (status) {
        case 'sent':
            return '<i class="fas fa-check" title="Sent"></i>';
        case 'delivered':
            return '<i class="fas fa-check-double" title="Delivered"></i>';
        case 'seen':
            return '<i class="fas fa-check-double seen" title="Seen"></i>';
        default:
            return '<i class="fas fa-clock" title="Sending..."></i>';
    }
}

// Send message
messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const content = messageInput.value.trim();
    if (!content || !selectedContact) return;
    
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = 'message message-sent';
    
    // Initialize with 'sending' status
    messageElement.innerHTML = `
        <div class="message-content">${content}</div>
        <div class="message-footer">
            <div class="message-timestamp">${formatTimestamp(new Date())}</div>
            <div class="read-receipt">${getReadReceiptIcon('sending')}</div>
        </div>
    `;
    
    messagesContainer.appendChild(messageElement);
    
    // Clear input and scroll to bottom
    messageInput.value = '';
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Simulate message sending process with status updates
    setTimeout(() => {
        const readReceipt = messageElement.querySelector('.read-receipt');
        readReceipt.innerHTML = getReadReceiptIcon('sent');
        
        setTimeout(() => {
            readReceipt.innerHTML = getReadReceiptIcon('delivered');
            
            setTimeout(() => {
                readReceipt.innerHTML = getReadReceiptIcon('seen');
            }, 3000); // Simulate seen after 3 seconds
        }, 2000); // Simulate delivered after 2 seconds
    }, 1000); // Simulate sent after 1 second
    
    // In a real app, we would save to Firebase here
});

// Format timestamp for messages
function formatTimestamp(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Track battery and time
function trackBatteryAndTime() {
    // Update battery (mock for demo)
    const updateBattery = () => {
        const level = Math.floor(Math.random() * 100);
        batteryLevelElement.textContent = `${level}%`;
        setTimeout(updateBattery, 60000); // Update every minute
    };
    
    // Update time
    const updateTime = () => {
        const now = new Date();
        currentTimeElement.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setTimeout(updateTime, 60000); // Update every minute
    };
    
    updateBattery();
    updateTime();
}

// Track user activity
function trackUserActivity() {
    const logActivity = (action) => {
        console.log(`User activity: ${action} at ${new Date().toISOString()}`);
        // In a real app, we would send this to Firebase
    };
    
    // Log app launch
    logActivity('app_launched');
    
    // Track when user switches contacts
    contactsList.addEventListener('click', () => {
        if (selectedContact) {
            logActivity(`opened_chat_with_${selectedContact.name}`);
        }
    });
    
    // Track message sent
    messageForm.addEventListener('submit', () => {
        if (messageInput.value.trim()) {
            logActivity('sent_message');
        }
    });
    
    // Track search usage
    searchContactsInput.addEventListener('input', () => {
        logActivity('searched_contacts');
    });
    
    // Track app focus/blur
    window.addEventListener('focus', () => logActivity('app_focused'));
    window.addEventListener('blur', () => logActivity('app_blurred'));
}

// Helper function to simulate API calls
function simulateApiCall(delay) {
    return new Promise(resolve => setTimeout(resolve, delay));
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    showScreen(loginScreen);
});


// Function to search users in Firestore
document.getElementById('search-contacts').addEventListener('input', async (e) => {
    const searchTerm = e.target.value.toLowerCase();
    if (!searchTerm) {
        loadContacts(allContacts);
        return;
    }
    
    try {
        const usersRef = db.collection('users');
        const querySnapshot = await usersRef.where('username', '>=', searchTerm).where('username', '<=', searchTerm + '\uf8ff').get();
        
        let searchResults = [];
        querySnapshot.forEach(doc => {
            const userData = doc.data();
            searchResults.push({
                id: doc.id,
                name: userData.username,
                avatar: userData.username.charAt(0).toUpperCase(),
                lastMessage: '',
                lastMessageTime: '',
                status: 'unknown'
            });
        });
        
        loadContacts(searchResults);
    } catch (error) {
        console.error('Error searching users:', error);
    }
});

// Function to send messages to selected user
messageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!selectedContact || !messageInput.value.trim()) return;
    
    const messageData = {
        senderId: currentUser.uid,
        receiverId: selectedContact.id,
        content: messageInput.value.trim(),
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'sent'
    };
    
    try {
        await db.collection('messages').add(messageData);
        messageInput.value = '';
    } catch (error) {
        console.error('Error sending message:', error);
    }
});

// Function to load messages from Firestore for selected contact
async function loadMessages() {
    if (!selectedContact) return;
    messagesContainer.innerHTML = '';
    
    try {
        const messagesRef = db.collection('messages');
        const querySnapshot = await messagesRef
            .where('senderId', 'in', [currentUser.uid, selectedContact.id])
            .where('receiverId', 'in', [currentUser.uid, selectedContact.id])
            .orderBy('timestamp', 'asc')
            .get();
        
        querySnapshot.forEach(doc => {
            const message = doc.data();
            displayMessage(message);
        });
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

// Function to display message
function displayMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.senderId === currentUser.uid ? 'message-sent' : 'message-received'}`;
    messageElement.innerHTML = `
        <div class="message-content">${message.content}</div>
        <div class="message-footer">
            <div class="message-timestamp">${formatTimestamp(message.timestamp)}</div>
        </div>
    `;
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}


document.addEventListener("DOMContentLoaded", function () {
    const sidebar = document.querySelector(".sidebar");
    const chatRecipient = document.getElementById("chat-recipient");

    if (window.innerWidth <= 768) {
        chatRecipient.addEventListener("click", function () {
            sidebar.classList.add("active");
        });

        document.body.addEventListener("click", function (event) {
            if (!sidebar.contains(event.target) && !chatRecipient.contains(event.target)) {
                sidebar.classList.remove("active");
            }
        });
    }
});
