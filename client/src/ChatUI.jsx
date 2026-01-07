import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';

// Emoji picker data
const EMOJI_CATEGORIES = {
  'Frequently Used': ['😀', '😂', '🥰', '😎', '😍', '🤔', '👍', '❤️', '🔥', '💯'],
  'Smileys & People': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡'],
  'Animals & Nature': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜'],
  'Food & Drink': ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶', '🌽', '🥕', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🥞', '🥓', '🥩', '🍗', '🍖'],
  'Activities': ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🥅', '🏒', '🏑', '🏏', '🥍', '🏹', '🎣', '🥊', '🥋', '🎽', '🛹', '🛷', '⛷', '🏂', '🏋️', '🤼', '🤸', '🤺'],
  'Objects': ['⌚', '📱', '📲', '💻', '⌨️', '🖥', '🖨', '🖱', '🖲', '🕹', '🗜', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽', '🎞', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙', '🎚', '🎛'],
  'Symbols': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐']
};

// Quick reaction emojis (most commonly used)
const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export default function ChatUI() {
  const [socket, setSocket] = useState(null);
  const [username, setUsername] = useState(() => {
    // Restore from localStorage on mount
    return localStorage.getItem('savedUsername') || '';
  });
  const [userId, setUserId] = useState(() => {
    // Restore from localStorage on mount
    return localStorage.getItem('savedUserId') || '';
  });
  // Use refs to access current username/userId in event handlers without adding to dependencies
  const usernameRef = useRef(username);
  const userIdRef = useRef(userId);
  
  // Keep refs in sync with state
  useEffect(() => {
    usernameRef.current = username;
    userIdRef.current = userId;
  }, [username, userId]);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loginError, setLoginError] = useState('');
  const [profilePhotos, setProfilePhotos] = useState({});
  const [showConnectionTest, setShowConnectionTest] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState(null);
  const [customBackendUrl, setCustomBackendUrl] = useState(() => {
    return localStorage.getItem('customBackendUrl') || '';
  });
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [messageFontSize, setMessageFontSize] = useState(() => {
    const saved = localStorage.getItem('messageFontSize');
    return saved ? parseInt(saved) : 14;
  });
  const [ownMessageColor, setOwnMessageColor] = useState(() => {
    return localStorage.getItem('ownMessageColor') || '#005c4b';
  });
  const [otherMessageColor, setOtherMessageColor] = useState(() => {
    return localStorage.getItem('otherMessageColor') || '#202c33';
  });
  const [showSettings, setShowSettings] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [draggingMessage, setDraggingMessage] = useState(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [modalPhoto, setModalPhoto] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('isDarkMode');
    return saved !== null ? saved === 'true' : true;
  });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioRecorder, setAudioRecorder] = useState(null);
  const [messageReadStatus, setMessageReadStatus] = useState({}); // { messageId: { readBy: [usernames], readAt: timestamp } }
  const [messageReactions, setMessageReactions] = useState({}); // { messageId: { '👍': [usernames], '❤️': [usernames] } }
  const [editingMessage, setEditingMessage] = useState(null); // { id, message }
  const [starredMessages, setStarredMessages] = useState(() => {
    const saved = localStorage.getItem('starredMessages');
    return saved ? JSON.parse(saved) : [];
  });
  const [hoveredMessage, setHoveredMessage] = useState(null);
  const [showReactionPicker, setShowReactionPicker] = useState(null); // messageId
  const hoverTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const messageInputRef = useRef(null);
  const profilePhotoInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const searchInputRef = useRef(null);
  const reactionPickerRef = useRef(null);
  const editInputRef = useRef(null);
  const touchStartRef = useRef(null); // { x, y, message, timestamp }
  const inputAreaRef = useRef(null);

  // Allowed users - only these 2 can login
  const allowedUsers = [
    { username: 'veerendra', userId: 'veeru@123' },
    { username: 'madhu', userId: 'madhu@123' }
  ];

  // Shared function to get backend URL - wrapped in useCallback for stable reference
  const getBackendUrl = useCallback(() => {
    // First, check for custom backend URL (user-entered)
    if (customBackendUrl && customBackendUrl.trim()) {
      const url = customBackendUrl.trim();
      // Ensure URL has protocol
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return `https://${url}`;
      }
      return url;
    }
    
    // Second, check for environment variable (set at build time)
    if (process.env.REACT_APP_SOCKET_URL) {
      return process.env.REACT_APP_SOCKET_URL;
    }
    
    // For local development
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    
    // For Railway/production: use same origin (frontend and backend on same server)
    // This works because Express serves the React build from the same server
    // No need for separate backend URL when deployed together
    return window.location.origin;
  }, [customBackendUrl]);

  // Test connection to backend
  const testConnection = async () => {
    setIsTestingConnection(true);
    setConnectionTestResult(null);
    
    const backendUrl = getBackendUrl();
    const results = {
      backendUrl,
      timestamp: new Date().toLocaleString(),
      tests: []
    };

    // Test 1: Check if URL is valid
    try {
      const url = new URL(backendUrl);
      results.tests.push({ name: 'URL Format', status: 'success', message: `Valid URL: ${url.protocol}//${url.hostname}` });
    } catch (e) {
      results.tests.push({ name: 'URL Format', status: 'error', message: `Invalid URL: ${e.message}` });
      setConnectionTestResult(results);
      setIsTestingConnection(false);
      return;
    }

    // Test 2: Try to fetch from backend (health check)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${backendUrl}/api/health`, {
        method: 'GET',
        signal: controller.signal,
        mode: 'cors'
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        results.tests.push({ name: 'Backend Reachable', status: 'success', message: 'Backend server is reachable' });
      } else {
        results.tests.push({ name: 'Backend Reachable', status: 'warning', message: `Server responded with status: ${response.status}` });
      }
    } catch (e) {
      if (e.name === 'AbortError') {
        results.tests.push({ name: 'Backend Reachable', status: 'error', message: 'Connection timeout (10s). Server may be unreachable or very slow.' });
      } else if (e.message.includes('CORS')) {
        results.tests.push({ name: 'Backend Reachable', status: 'error', message: 'CORS error. Server may not allow requests from this origin.' });
      } else if (e.message.includes('Failed to fetch')) {
        results.tests.push({ name: 'Backend Reachable', status: 'error', message: 'Network error. Check your internet connection or firewall settings.' });
      } else {
        results.tests.push({ name: 'Backend Reachable', status: 'error', message: `Error: ${e.message}` });
      }
    }

    // Test 3: Try Socket.io connection
    try {
      const testSocket = io(backendUrl, {
        transports: ['polling', 'websocket'],
        timeout: 5000,
        reconnection: false
      });

      const connectPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          testSocket.close();
          reject(new Error('Socket connection timeout (5s)'));
        }, 5000);

        testSocket.on('connect', () => {
          clearTimeout(timeout);
          testSocket.close();
          resolve('Connected');
        });

        testSocket.on('connect_error', (error) => {
          clearTimeout(timeout);
          testSocket.close();
          reject(error);
        });
      });

      await connectPromise;
      results.tests.push({ name: 'Socket.io Connection', status: 'success', message: 'Socket.io connection successful' });
    } catch (e) {
      results.tests.push({ name: 'Socket.io Connection', status: 'error', message: `Socket.io error: ${e.message}` });
    }

    // Test 4: DNS Resolution
    try {
      const url = new URL(backendUrl);
      const hostname = url.hostname;
      // Try to resolve DNS by creating an image request
      const img = new Image();
      const dnsPromise = new Promise((resolve, reject) => {
        img.onload = () => resolve('DNS resolved');
        img.onerror = () => reject(new Error('DNS resolution failed'));
        setTimeout(() => reject(new Error('DNS resolution timeout')), 5000);
        img.src = `${backendUrl}/favicon.ico?t=${Date.now()}`;
      });
      await dnsPromise;
      results.tests.push({ name: 'DNS Resolution', status: 'success', message: `DNS resolved for ${hostname}` });
    } catch (e) {
      const url = new URL(backendUrl);
      results.tests.push({ name: 'DNS Resolution', status: 'error', message: `DNS error for ${url.hostname}: ${e.message}` });
    }

    setConnectionTestResult(results);
    setIsTestingConnection(false);
  };

  useEffect(() => {
    // Initialize socket connection with better options for poor connectivity
    const socketUrl = getBackendUrl();
    console.log('Connecting to socket:', socketUrl);
    
    const newSocket = io(socketUrl, {
      // Enable both websocket and polling transports
      transports: ['websocket', 'polling'],
      // Allow fallback to polling if websocket fails (better for slow connections)
      upgrade: true,
      // Increase timeout for slow connections
      timeout: 20000,
      // Retry connection automatically
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });
    
    setSocket(newSocket);

    // Socket event listeners
    newSocket.on('connect', () => {
      console.log('✅ Connected to server, socket ID:', newSocket.id);
      console.log('Transport:', newSocket.io.engine.transport.name);
      setIsConnected(true);
      setLoginError(''); // Clear any previous connection errors
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      setIsConnected(false);
      
      // Provide helpful error messages
      if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
        setLoginError('Unable to connect to server. Please check your internet connection. If you are in an area with slow internet, please wait...');
      } else if (error.message.includes('xhr poll error')) {
        setLoginError('Connection issue detected. Trying alternative connection method...');
      } else {
        setLoginError(`Connection error: ${error.message}. Please check your internet connection.`);
      }
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}...`);
      setLoginError(`Reconnecting... (Attempt ${attemptNumber}/5)`);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('❌ Failed to reconnect after all attempts');
      setLoginError('Failed to connect to server. Please check your internet connection and refresh the page.');
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`✅ Reconnected after ${attemptNumber} attempts`);
      setLoginError('');
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from server. Reason:', reason);
      setIsConnected(false);
      
      // Show message for unexpected disconnections
      if (reason === 'io server disconnect') {
        setLoginError('Server disconnected. Please refresh the page.');
      } else if (reason === 'transport close') {
        setLoginError('Connection lost. Attempting to reconnect...');
      }
    });

    newSocket.on('joined', (data) => {
      console.log('Joined:', data);
      setHasJoined(true);
      // Save credentials to localStorage on successful join
      // Use refs to access current values without adding to dependency array
      if (usernameRef.current && userIdRef.current) {
        localStorage.setItem('savedUsername', usernameRef.current);
        localStorage.setItem('savedUserId', userIdRef.current);
      }
    });

    newSocket.on('messageHistory', (history) => {
      console.log('Loading message history:', history.length, 'messages');
      // Filter out any null or invalid messages
      const validHistory = Array.isArray(history) ? history.filter(msg => msg && msg.id && msg.timestamp) : [];
      setMessages(validHistory);
    });

    newSocket.on('receiveMessage', (data) => {
      console.log('Received message:', data);
      console.log('Message validation:', {
        hasData: !!data,
        hasId: !!data?.id,
        hasTimestamp: !!data?.timestamp,
        id: data?.id,
        timestamp: data?.timestamp
      });
      if (data && data.id && data.timestamp) {
        setMessages((prev) => {
          // Check if message already exists to avoid duplicates
          const exists = prev.some(msg => msg.id === data.id);
          if (exists) {
            console.log('Message already exists, skipping:', data.id);
            return prev;
          }
          
          // Replace temporary message with real one if timestamp matches (within 5 seconds)
          // This handles optimistic updates
          const tempMessageIndex = prev.findIndex(msg => 
            msg.id && msg.id.startsWith('temp_') && 
            msg.username === data.username &&
            msg.userId === data.userId &&
            Math.abs(new Date(msg.timestamp).getTime() - new Date(data.timestamp).getTime()) < 5000 &&
            ((msg.message && data.message && msg.message.trim() === data.message.trim()) ||
             (msg.imageUrl && data.imageUrl && msg.imageUrl === data.imageUrl))
          );
          
          if (tempMessageIndex !== -1) {
            console.log('Replacing temporary message with real one');
            const updated = [...prev];
            updated[tempMessageIndex] = data;
            return updated;
          }
          
          console.log('Adding new message to state. Total messages before:', prev.length);
          const updated = [...prev, data];
          console.log('Total messages after:', updated.length);
          return updated;
        });
      } else {
        console.error('Invalid message received - missing required fields:', {
          data,
          hasId: !!data?.id,
          hasTimestamp: !!data?.timestamp
        });
      }
    });

    newSocket.on('messageReaction', (data) => {
      const { messageId, emoji, username: reactedUser, action } = data;
      setMessageReactions(prev => {
        const current = prev[messageId] || {};
        const users = current[emoji] || [];
        
        if (action === 'add') {
          return {
            ...prev,
            [messageId]: {
              ...current,
              [emoji]: users.includes(reactedUser) ? users : [...users, reactedUser]
            }
          };
        } else {
          const updatedUsers = users.filter(u => u !== reactedUser);
          if (updatedUsers.length === 0) {
            const { [emoji]: removed, ...rest } = current;
            return { ...prev, [messageId]: rest };
          }
          return {
            ...prev,
            [messageId]: { ...current, [emoji]: updatedUsers }
          };
        }
      });
    });

    newSocket.on('messageEdited', (data) => {
      const { messageId, newMessage } = data;
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, message: newMessage, edited: true } : msg
      ));
    });

    newSocket.on('messageDeleted', (data) => {
      console.log('Message deleted:', data.messageId);
      setMessages((prev) => prev.filter(msg => msg.id !== data.messageId));
    });

    newSocket.on('deleteMessageError', (data) => {
      console.error('Error deleting message:', data.error);
      alert(`Failed to delete message: ${data.error}`);
    });

    newSocket.on('userTyping', (data) => {
      setTypingUser(data.isTyping ? data.username : '');
      setIsTyping(data.isTyping);
    });

    return () => {
      newSocket.close();
    };
  }, [customBackendUrl, getBackendUrl]); // Reconnect when custom backend URL changes

  // Auto-login when socket connects and credentials are available
  // Only auto-login once when socket connects, not while user is typing
  useEffect(() => {
    if (socket && isConnected && !hasJoined) {
      const savedUsername = localStorage.getItem('savedUsername');
      const savedUserId = localStorage.getItem('savedUserId');
      
      // Only auto-login if we have saved credentials
      // Check if current values match saved (meaning they're from localStorage, not user input)
      if (savedUsername && savedUserId) {
        // Only proceed if current state matches saved (user hasn't modified them yet)
        if (username === savedUsername && userId === savedUserId) {
          console.log('Auto-login with saved credentials:', savedUsername);
          // Validate credentials before auto-login
          const allowedUsers = [
            { username: 'veerendra', userId: 'veeru@123' },
            { username: 'madhu', userId: 'madhu@123' }
          ];
          
          const isValid = allowedUsers.some(
            user => user.username === savedUsername.trim().toLowerCase() && user.userId === savedUserId.trim()
          );
          
          if (isValid) {
            socket.emit('join', { username: savedUsername.trim().toLowerCase(), userId: savedUserId.trim() });
            setHasJoined(true);
          } else {
            // Clear invalid saved credentials (but don't clear state - let user type)
            localStorage.removeItem('savedUsername');
            localStorage.removeItem('savedUserId');
          }
        }
        // If current values don't match saved, user is typing - don't interfere
      }
    }
  }, [socket, isConnected, hasJoined]); // Removed username and userId from dependencies to prevent clearing while typing

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Fetch profile photos
  useEffect(() => {
    const fetchProfilePhotos = async () => {
      // Get unique usernames from messages and current user
      const uniqueUsers = new Set();
      if (username) uniqueUsers.add(username.toLowerCase());
      messages.forEach(msg => {
        if (msg.username) uniqueUsers.add(msg.username.toLowerCase());
      });
      
      // Also add common users as fallback
      uniqueUsers.add('veerendra');
      uniqueUsers.add('madhu');
      
      const users = Array.from(uniqueUsers);
      const photos = {};
      
      const apiUrl = getBackendUrl();
      console.log('Fetching profile photos from:', apiUrl);
      
      // Check if we're in production without env variable
      if (!process.env.REACT_APP_SOCKET_URL && (window.location.hostname.includes('pages.dev') || window.location.hostname.includes('cloudflare'))) {
        console.error('❌ REACT_APP_SOCKET_URL environment variable is not set in Cloudflare Pages!');
        console.error('❌ Profile photos cannot be fetched. Please set REACT_APP_SOCKET_URL in Cloudflare Pages settings.');
        console.error('❌ Expected format: https://your-railway-app.railway.app');
      }
      console.log('Fetching photos for users:', users);
      
      for (const user of users) {
        try {
          const photoUrl = `${apiUrl}/api/user-photo/${user}`;
          console.log(`Fetching photo for ${user} from:`, photoUrl);
          const response = await fetch(photoUrl);
          console.log(`Response for ${user}:`, response.status, response.statusText);
          if (response.ok) {
            const data = await response.json();
            if (data.photo) {
              photos[user] = data.photo;
              console.log(`✅ Profile photo loaded for ${user}`);
            } else {
              console.log(`⚠️ No photo data for ${user}`);
            }
          } else {
            console.log(`❌ Failed to fetch photo for ${user}: ${response.status} ${response.statusText}`);
          }
        } catch (err) {
          console.error(`❌ Error fetching profile photo for ${user}:`, err);
        }
      }
      
      console.log('Profile photos loaded:', Object.keys(photos));
      setProfilePhotos(photos);
    };

    if (hasJoined) {
      fetchProfilePhotos();
    }
  }, [hasJoined, messages, username, getBackendUrl]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const validateCredentials = (username, userId) => {
    return allowedUsers.some(
      user => user.username.toLowerCase() === username.trim().toLowerCase() && 
              user.userId.toLowerCase() === userId.trim().toLowerCase()
    );
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const getProfilePhoto = (username) => {
    if (!username) return null;
    const key = username.toLowerCase();
    return profilePhotos[key] || null;
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    }
  };

  const handleJoin = (e) => {
    e.preventDefault();
    setLoginError('');
    
    const trimmedUsername = username.trim();
    const trimmedUserId = userId.trim();
    
    if (!trimmedUsername || !trimmedUserId) {
      setLoginError('Please enter both name and ID');
      return;
    }
    
    if (!socket) {
      setLoginError('Not connected to server. Please wait...');
      return;
    }
    
    if (!validateCredentials(trimmedUsername, trimmedUserId)) {
      setLoginError('Invalid credentials. Only authorized users can access this chat.');
      return;
    }
    
    setUsername(trimmedUsername);
    setUserId(trimmedUserId);
    socket.emit('join', { username: trimmedUsername, userId: trimmedUserId });
    setHasJoined(true);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfilePhotoSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!username) {
      alert('Please login first before uploading a profile photo');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = async () => {
      const photoBase64 = reader.result; // This is already in data:image/... format
      
      try {
        const apiUrl = getBackendUrl();
        const uploadUrl = `${apiUrl}/api/user-photo/${username.toLowerCase()}`;
        console.log('Uploading profile photo to:', uploadUrl);
        console.log('Username:', username);
        console.log('Photo data length:', photoBase64 ? photoBase64.length : 0);
        
        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ photoBase64 }),
        });

        console.log('Upload response status:', response.status, response.statusText);

        if (response.ok) {
          const result = await response.json();
          console.log('Upload success:', result);
          
          // Update local state immediately with the uploaded photo
          setProfilePhotos((prev) => {
            const updated = {
              ...prev,
              [username.toLowerCase()]: photoBase64,
            };
            console.log('✅ Updated profile photos state immediately:', Object.keys(updated));
            console.log('✅ Photo updated for user:', username.toLowerCase());
            return updated;
          });
          
          // Force component re-render by triggering a state update
          // This ensures all image elements refresh with the new photo
          setTimeout(() => {
            setProfilePhotos((prev) => {
              // Return a new object reference to force re-render
              return { ...prev };
            });
          }, 50);
          
          // Force a small delay to ensure state update, then refresh from server
          setTimeout(async () => {
            try {
              // Re-fetch all photos from server to ensure consistency
              const uniqueUsers = new Set();
              if (username) uniqueUsers.add(username.toLowerCase());
              messages.forEach(msg => {
                if (msg.username) uniqueUsers.add(msg.username.toLowerCase());
              });
              uniqueUsers.add('veerendra');
              uniqueUsers.add('madhu');
              
              const photos = {};
              for (const user of Array.from(uniqueUsers)) {
                try {
                  const photoResponse = await fetch(`${apiUrl}/api/user-photo/${user}`);
                  if (photoResponse.ok) {
                    const data = await photoResponse.json();
                    if (data.photo) {
                      photos[user] = data.photo;
                    }
                  }
                } catch (err) {
                  console.error(`Error fetching photo for ${user}:`, err);
                }
              }
              
              // Merge with current state to keep the uploaded photo if server doesn't return it yet
              setProfilePhotos((prev) => {
                const merged = { ...prev, ...photos };
                // Ensure the uploaded photo is included
                if (photoBase64) {
                  merged[username.toLowerCase()] = photoBase64;
                }
                console.log('Refreshed profile photos:', Object.keys(merged));
                return merged;
              });
            } catch (err) {
              console.error('Error refreshing photos:', err);
            }
          }, 100);
          
          alert('Profile photo updated successfully!');
        } else {
          let errorMessage = `Server error: ${response.status} ${response.statusText}`;
          try {
            // Read response as text first, then try to parse as JSON
            const responseText = await response.text();
            try {
              const errorData = JSON.parse(responseText);
              errorMessage = errorData.error || errorMessage;
              console.error('Upload error response:', errorData);
            } catch (parseErr) {
              // Not JSON, use the text directly
              console.error('Upload error response (text):', responseText);
              if (responseText) {
                errorMessage = responseText;
              }
            }
          } catch (readErr) {
            console.error('Could not read error response:', readErr);
          }
          alert(`Failed to upload profile photo: ${errorMessage}`);
        }
      } catch (err) {
        console.error('Error uploading profile photo:', err);
        console.error('Error details:', {
          message: err.message,
          stack: err.stack,
          name: err.name
        });
        alert(`Failed to upload profile photo: ${err.message || 'Network error. Please check console for details.'}`);
      }
    };

    reader.readAsDataURL(file);
    
    // Reset file input
    if (profilePhotoInputRef.current) {
      profilePhotoInputRef.current.value = '';
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!socket || !username || !userId) {
      alert('Please join the chat first.');
      return;
    }
    
    if (!message.trim() && !selectedImage) {
      return;
    }
    
    const messageData = {
      message: message.trim() || null,
      username,
      userId,
      timestamp: new Date().toISOString(),
    };
    
    // Add reply data if replying to a message
    if (replyingTo) {
      messageData.replyTo = {
        id: replyingTo.id,
        message: replyingTo.message,
        username: replyingTo.username,
        imageUrl: replyingTo.imageUrl
      };
    }
    
    if (selectedImage && imagePreview) {
      messageData.imageUrl = imagePreview;
      messageData.messageType = 'image';
      if (!messageData.message) {
        messageData.message = '📷 Image';
      }
    }
    
    // Add temporary message immediately for optimistic UI update
    const tempMessage = {
      ...messageData,
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    setMessages((prev) => [...prev, tempMessage]);
    
    socket.emit('sendMessage', messageData);
    setMessage('');
    setReplyingTo(null);
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    handleStopTyping();
  };

  const handleTyping = () => {
    if (socket && username) {
      socket.emit('typing', { username, isTyping: true });
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        handleStopTyping();
      }, 3000);
    }
  };

  const handleStopTyping = () => {
    if (socket && username) {
      socket.emit('typing', { username, isTyping: false });
    }
  };

  const handleDeleteMessage = (messageId) => {
    if (!messageId || !socket) return;
    if (window.confirm('Are you sure you want to delete this message?')) {
      socket.emit('deleteMessage', { messageId });
    }
  };

  // Handle drag to reply (desktop)
  const handleDragStart = (e, msg) => {
    const msgUserId = msg.userId ? msg.userId.trim() : '';
    const currentUserId = userId ? userId.trim() : '';
    const isOwnMessage = msgUserId && currentUserId && msgUserId === currentUserId;
    
    // Only allow dragging other person's messages to reply
    if (!isOwnMessage) {
      setDraggingMessage(msg);
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
      }
    } else {
      e.preventDefault();
    }
  };

  const handleDragEnd = () => {
    setDraggingMessage(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (draggingMessage) {
      setReplyingTo(draggingMessage);
      setDraggingMessage(null);
      messageInputRef.current?.focus();
    }
  };

  // Handle touch to reply (mobile)
  const handleTouchStart = (e, msg) => {
    const msgUserId = msg.userId ? msg.userId.trim() : '';
    const currentUserId = userId ? userId.trim() : '';
    const isOwnMessage = msgUserId && currentUserId && msgUserId === currentUserId;
    
    // Only allow touching other person's messages to reply
    if (!isOwnMessage) {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        message: msg,
        timestamp: Date.now()
      };
      setDraggingMessage(msg);
    }
  };

  const handleTouchMove = (e) => {
    if (!touchStartRef.current) return;
    // Prevent scrolling while dragging
    if (Math.abs(e.touches[0].clientY - touchStartRef.current.y) > 10) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e) => {
    if (!touchStartRef.current) {
      setDraggingMessage(null);
      return;
    }

    const touchEnd = e.changedTouches[0];
    const start = touchStartRef.current;
    
    // Calculate drag distance
    const dragDistance = Math.abs(touchEnd.clientY - start.y);
    const draggedDown = touchEnd.clientY > start.y + 50; // Swipe down at least 50px
    
    // Check if touch ended near the input area
    const inputArea = inputAreaRef.current;
    let isOverInput = false;
    
    if (inputArea) {
      const inputRect = inputArea.getBoundingClientRect();
      const touchY = touchEnd.clientY;
      const touchX = touchEnd.clientX;
      
      // Check if touch ended within input area bounds (with generous padding for mobile)
      isOverInput = touchX >= inputRect.left - 100 && 
                    touchX <= inputRect.right + 100 &&
                    touchY >= inputRect.top - 100 && 
                    touchY <= inputRect.bottom + 100;
    }
    
    // Set reply if: dragged down significantly OR ended over input area
    // Require minimum 60px drag distance to avoid accidental triggers
    if (dragDistance > 60 && (isOverInput || draggedDown)) {
      setReplyingTo(start.message);
      setTimeout(() => {
        messageInputRef.current?.focus();
      }, 150);
    }
    
    // Reset after a short delay to show visual feedback
    setTimeout(() => {
      setDraggingMessage(null);
      touchStartRef.current = null;
    }, 150);
  };

  // Save font size to localStorage
  useEffect(() => {
    localStorage.setItem('messageFontSize', messageFontSize.toString());
  }, [messageFontSize]);

  // Save colors to localStorage
  useEffect(() => {
    localStorage.setItem('ownMessageColor', ownMessageColor);
  }, [ownMessageColor]);

  useEffect(() => {
    localStorage.setItem('otherMessageColor', otherMessageColor);
  }, [otherMessageColor]);

  // Save theme preference
  useEffect(() => {
    localStorage.setItem('isDarkMode', isDarkMode.toString());
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
      if (reactionPickerRef.current && !reactionPickerRef.current.contains(event.target)) {
        setShowReactionPicker(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize theme on mount
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Listen for message read receipts
  useEffect(() => {
    if (!socket) return;

    socket.on('messageRead', (data) => {
      const { messageId, readBy, readAt } = data;
      setMessageReadStatus(prev => ({
        ...prev,
        [messageId]: { readBy, readAt }
      }));
    });

    return () => {
      socket.off('messageRead');
    };
  }, [socket]);

  // Group messages by date
  const groupMessagesByDate = (messagesToGroup = messages) => {
    const grouped = {};
    messagesToGroup.filter(msg => msg && msg.id && msg.timestamp).forEach((msg) => {
      const dateKey = formatDate(msg.timestamp);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(msg);
    });
    return grouped;
  };

  // Insert emoji into message
  const insertEmoji = (emoji) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    messageInputRef.current?.focus();
  };

  // Search messages
  const filteredMessages = (searchQuery.trim() 
    ? messages.filter(msg => 
        msg && msg.id && (
          (msg.message && msg.message.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (msg.username && msg.username.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      )
    : messages.filter(msg => msg && msg.id));

  // Voice recording handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      // Try to use a compatible mime type
      let options = {};
      const types = ['audio/webm', 'audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg', 'audio/wav'];
      for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
          options.mimeType = type;
          console.log('Using audio format:', type);
          break;
        }
      }
      
      const recorder = new MediaRecorder(stream, options);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
          console.log('Audio chunk received:', e.data.size, 'bytes');
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: options.mimeType || 'audio/webm' });
        console.log('Audio blob created:', blob.size, 'bytes, type:', blob.type);
        
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result;
          console.log('Audio converted to base64:', base64Audio.substring(0, 50) + '...', 'Total length:', base64Audio.length);
          
          // Check if audio is too large (MongoDB 16MB limit, base64 increases size by ~33%)
          // Warn if larger than 10MB to be safe
          const maxSize = 10 * 1024 * 1024; // 10MB
          if (base64Audio.length > maxSize) {
            alert(`Warning: Voice message is very large (${(base64Audio.length / 1024 / 1024).toFixed(2)}MB). Please record a shorter message.`);
          }
          
          // Send voice message
          if (socket && username && userId) {
            socket.emit('sendMessage', {
              message: '🎤 Voice message',
              username,
              userId,
              timestamp: new Date().toISOString(),
              audioUrl: base64Audio,
              messageType: 'audio'
            });
            console.log('Voice message sent via socket');
            // Auto-scroll after sending
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }
        };
        reader.onerror = (error) => {
          console.error('Error reading audio blob:', error);
          alert('Error processing audio. Please try again.');
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setAudioRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (audioRecorder && isRecording) {
      audioRecorder.stop();
      setIsRecording(false);
      setAudioRecorder(null);
    }
  };

  // Mark messages as read
  const markMessagesAsRead = useCallback(() => {
    if (!socket || !username) return;
    
    const unreadMessages = messages.filter(msg => {
      const msgUserId = msg.userId ? msg.userId.trim() : '';
      const currentUserId = userId ? userId.trim() : '';
      const isOwnMessage = msgUserId && currentUserId && msgUserId === currentUserId;
      if (isOwnMessage) return false;
      
      const readStatus = messageReadStatus[msg.id];
      return !readStatus || !readStatus.readBy?.includes(username.toLowerCase());
    });

    unreadMessages.forEach(msg => {
      socket.emit('markMessageRead', {
        messageId: msg.id,
        readBy: username.toLowerCase()
      });
    });
  }, [socket, username, messages, userId, messageReadStatus]);

  // Add reaction to message
  const addReaction = (messageId, emoji) => {
    if (!socket || !username) return;
    
    const currentReactions = messageReactions[messageId] || {};
    const reactionUsers = currentReactions[emoji] || [];
    const userLower = username.toLowerCase();
    
    // Toggle reaction (remove if already reacted, add if not)
    if (reactionUsers.includes(userLower)) {
      const updatedUsers = reactionUsers.filter(u => u !== userLower);
      if (updatedUsers.length === 0) {
        // Remove emoji if no users left
        const { [emoji]: removed, ...rest } = currentReactions;
        setMessageReactions(prev => ({ ...prev, [messageId]: rest }));
      } else {
        setMessageReactions(prev => ({
          ...prev,
          [messageId]: { ...currentReactions, [emoji]: updatedUsers }
        }));
      }
    } else {
      // Add reaction
      setMessageReactions(prev => ({
        ...prev,
        [messageId]: { ...currentReactions, [emoji]: [...reactionUsers, userLower] }
      }));
    }
    
    // Emit to server
    socket.emit('addReaction', { messageId, emoji, username: userLower });
    setShowReactionPicker(null);
  };

  // Edit message
  const startEditing = (msg) => {
    setEditingMessage({ id: msg.id, message: msg.message });
    setTimeout(() => editInputRef.current?.focus(), 100);
  };

  const saveEdit = () => {
    if (!socket || !editingMessage || !editingMessage.message.trim()) return;
    
    socket.emit('editMessage', {
      messageId: editingMessage.id,
      newMessage: editingMessage.message.trim()
    });
    
    setMessages(prev => prev.map(msg => 
      msg.id === editingMessage.id 
        ? { ...msg, message: editingMessage.message.trim(), edited: true }
        : msg
    ));
    
    setEditingMessage(null);
  };

  const cancelEdit = () => {
    setEditingMessage(null);
  };

  // Copy message text
  const copyMessage = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // Show temporary feedback
      const feedback = document.createElement('div');
      feedback.textContent = 'Copied!';
      feedback.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.8); color: white; padding: 10px 20px; border-radius: 5px; z-index: 10000;';
      document.body.appendChild(feedback);
      setTimeout(() => document.body.removeChild(feedback), 1000);
    }).catch(err => {
      console.error('Failed to copy:', err);
      alert('Failed to copy message');
    });
  };

  // Star/unstar message
  const toggleStar = (messageId) => {
    const isStarred = starredMessages.includes(messageId);
    const updated = isStarred
      ? starredMessages.filter(id => id !== messageId)
      : [...starredMessages, messageId];
    
    setStarredMessages(updated);
    localStorage.setItem('starredMessages', JSON.stringify(updated));
  };

  // Mark messages as read when viewing
  useEffect(() => {
    if (hasJoined && messages.length > 0) {
      const timer = setTimeout(() => {
        markMessagesAsRead();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [messages, hasJoined, markMessagesAsRead]);

  // Get other user's name (for header)
  const getOtherUserName = () => {
    // First, try to find other user from messages
    if (messages.length > 0) {
      const otherUser = messages.find(msg => msg.userId !== userId);
      if (otherUser) {
        return otherUser.username.charAt(0).toUpperCase() + otherUser.username.slice(1).toLowerCase();
      }
    }
    
    // If no messages, determine other user based on current logged-in user
    if (username) {
      const currentUserLower = username.toLowerCase();
      // Find the other user from allowedUsers
      const otherUser = allowedUsers.find(user => user.username.toLowerCase() !== currentUserLower);
      if (otherUser) {
        return otherUser.username.charAt(0).toUpperCase() + otherUser.username.slice(1).toLowerCase();
      }
    }
    
    return 'Chat';
  };

  // Login screen
  if (!hasJoined) {
    return (
      <div className="h-[100dvh] bg-[#0b141a] flex items-center justify-center text-white">
        <div className="w-full max-w-md px-6">
          <div className="bg-[#202c33] rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">💬</div>
              <h1 className="text-2xl font-bold mb-2">Private Chat</h1>
              <p className="text-gray-400 text-sm">Connect and chat securely</p>
              {/* Connection Status Indicator */}
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                <span className={`text-xs ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                  {isConnected ? 'Connected' : 'Connecting...'}
                </span>
              </div>
              {!isConnected && (
                <p className="text-yellow-400 text-xs mt-2">
                  If you're in an area with slow internet, please wait. The app will try to connect automatically.
                </p>
              )}
            </div>
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Your Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setLoginError('');
                  }}
                  className="w-full bg-[#2a3942] rounded-lg px-4 py-3 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#00a884]"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Your ID</label>
                <input
                  type="password"
                  placeholder="Enter your ID"
                  value={userId}
                  onChange={(e) => {
                    setUserId(e.target.value);
                    setLoginError('');
                  }}
                  className="w-full bg-[#2a3942] rounded-lg px-4 py-3 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#00a884]"
                  required
                />
              </div>
              {loginError && (
                <div className="text-red-400 text-sm text-center py-2">
                  {loginError}
                </div>
              )}
              <button
                type="submit"
                disabled={!username.trim() || !userId.trim()}
                className="w-full bg-[#00a884] hover:bg-[#00b894] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Join Chat
              </button>
              
              {/* Connection Troubleshooting */}
              <div className="mt-4 pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowConnectionTest(!showConnectionTest)}
                  className="w-full text-sm text-gray-400 hover:text-gray-300 underline"
                >
                  {showConnectionTest ? 'Hide' : 'Show'} Connection Troubleshooting
                </button>
                
                {showConnectionTest && (
                  <div className="mt-4 space-y-4">
                    {/* Custom Backend URL */}
                    <div>
                      <label className="block text-xs font-medium mb-2 text-gray-400">
                        Custom Backend URL (if default doesn't work)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., https://your-app.railway.app"
                        value={customBackendUrl}
                        onChange={(e) => {
                          const url = e.target.value;
                          setCustomBackendUrl(url);
                          localStorage.setItem('customBackendUrl', url);
                        }}
                        className="w-full bg-[#2a3942] rounded-lg px-3 py-2 text-white text-xs placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#00a884]"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Leave empty to use default. Get this URL from your friend in Bangalore.
                      </p>
                    </div>
                    
                    {/* Test Connection Button */}
                    <button
                      type="button"
                      onClick={testConnection}
                      disabled={isTestingConnection}
                      className="w-full bg-[#2a3942] hover:bg-[#3a4a52] disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                    >
                      {isTestingConnection ? 'Testing...' : 'Test Connection'}
                    </button>
                    
                    {/* Connection Test Results */}
                    {connectionTestResult && (
                      <div className="bg-[#1a2529] rounded-lg p-3 text-xs">
                        <div className="text-gray-400 mb-2">
                          <strong>Backend URL:</strong> {connectionTestResult.backendUrl}
                        </div>
                        <div className="text-gray-500 mb-2">
                          Tested at: {connectionTestResult.timestamp}
                        </div>
                        <div className="space-y-1">
                          {connectionTestResult.tests.map((test, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <span className={test.status === 'success' ? 'text-green-400' : test.status === 'warning' ? 'text-yellow-400' : 'text-red-400'}>
                                {test.status === 'success' ? '✅' : test.status === 'warning' ? '⚠️' : '❌'}
                              </span>
                              <div>
                                <div className="text-gray-300 font-medium">{test.name}</div>
                                <div className="text-gray-500">{test.message}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {connectionTestResult.tests.some(t => t.status === 'error') && (
                          <div className="mt-3 p-2 bg-yellow-900/30 rounded text-yellow-300 text-xs">
                            <strong>Tip:</strong> If connection fails, try:
                            <ul className="list-disc list-inside mt-1 space-y-1">
                              <li>Ask your friend in Bangalore for the exact backend URL</li>
                              <li>Try using mobile data instead of WiFi (or vice versa)</li>
                              <li>Check if your network/firewall is blocking the connection</li>
                              <li>Try using a VPN if available</li>
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Chat UI
  const groupedMessages = groupMessagesByDate(filteredMessages);
  const otherUserName = getOtherUserName();
  const otherUserInitials = getInitials(otherUserName);

  // Theme classes
  const bgPrimary = isDarkMode ? 'bg-[#0b141a]' : 'bg-gray-50';
  const bgSecondary = isDarkMode ? 'bg-[#202c33]' : 'bg-white';
  const bgTertiary = isDarkMode ? 'bg-[#2a3942]' : 'bg-gray-100';
  const textPrimary = isDarkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = isDarkMode ? 'text-gray-400' : 'text-gray-600';
  const borderColor = isDarkMode ? 'border-gray-700' : 'border-gray-200';

  return (
    <div className={`h-[100dvh] ${bgPrimary} flex flex-col ${textPrimary} overflow-hidden w-full`}>
      {/* Header - Fixed */}
      <div className={`flex items-center justify-between px-3 py-2.5 ${bgSecondary} flex-shrink-0 fixed top-0 left-0 right-0 z-10 ${borderColor} border-b`}>
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {getProfilePhoto(otherUserName.toLowerCase()) ? (
            <img 
              key={`header-photo-${otherUserName}-${profilePhotos[otherUserName.toLowerCase()]?.substring(0, 50) || 'none'}`}
              src={getProfilePhoto(otherUserName.toLowerCase())} 
              alt={otherUserName}
              className="w-9 h-9 rounded-full object-cover flex-shrink-0 ml-2 cursor-pointer"
              onClick={() => {
                setModalPhoto(getProfilePhoto(otherUserName.toLowerCase()));
                setShowPhotoModal(true);
              }}
              onLoad={() => console.log(`Header profile photo loaded for ${otherUserName}`)}
              onError={(e) => console.error(`Header profile photo error for ${otherUserName}:`, e)}
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center font-bold text-sm flex-shrink-0 ml-2">
              {otherUserInitials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className={`font-semibold text-sm truncate ${textPrimary}`}>{otherUserName}</div>
            <div className={`text-[10px] ${textSecondary}`}>
              {isConnected ? 'online' : 'offline'}
            </div>
          </div>
        </div>
        <div className="flex gap-2 items-center flex-shrink-0">
          {/* Video Call Icon */}
          <button 
            onClick={() => {
              // Video call functionality - can be implemented later
              alert('Video call feature coming soon!');
            }}
            className="p-2 touch-manipulation active:opacity-70"
            title="Video Call"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={textSecondary}>
              <path d="M17 10.5V7C17 6.45 16.55 6 16 6H4C3.45 6 3 6.45 3 7V17C3 17.55 3.45 18 4 18H16C16.55 18 17 17.55 17 17V13.5L21 17.5V6.5L17 10.5Z" fill="currentColor"/>
            </svg>
          </button>
          {/* Voice Call Icon */}
          <button 
            onClick={() => {
              // Voice call functionality - can be implemented later
              alert('Voice call feature coming soon!');
            }}
            className="p-2 touch-manipulation active:opacity-70"
            title="Voice Call"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={textSecondary}>
              <path d="M6.62 10.79C8.06 13.62 10.38 15.94 13.21 17.38L15.41 15.18C15.69 14.9 16.08 14.82 16.43 14.93C17.55 15.3 18.75 15.5 20 15.5C20.55 15.5 21 15.95 21 16.5V20C21 20.55 20.55 21 20 21C10.61 21 3 13.39 3 4C3 3.45 3.45 3 4 3H7.5C8.05 3 8.5 3.45 8.5 4C8.5 5.25 8.7 6.45 9.07 7.57C9.18 7.92 9.1 8.31 8.82 8.59L6.62 10.79Z" fill="currentColor"/>
            </svg>
          </button>
          {/* Search Icon */}
          <button 
            onClick={() => {
              setShowSearch(!showSearch);
              if (!showSearch) {
                setTimeout(() => searchInputRef.current?.focus(), 100);
              } else {
                setSearchQuery('');
              }
            }}
            className="p-2 touch-manipulation active:opacity-70"
            title="Search Messages"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={textSecondary}>
              <path d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5C5 7.01 7.01 5 9.5 5C11.99 5 14 7.01 14 9.5C14 11.99 11.99 14 9.5 14Z" fill="currentColor"/>
            </svg>
          </button>
          {/* Theme Toggle */}
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 touch-manipulation active:opacity-70"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={textSecondary}>
                <path d="M12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="currentColor"/>
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={textSecondary}>
                <path d="M12 18C15.31 18 18 15.31 18 12C18 8.69 15.31 6 12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18ZM12 4C13.1 4 14 3.1 14 2H10C10 3.1 10.9 4 12 4ZM12 20C10.9 20 10 20.9 10 22H14C14 20.9 13.1 20 12 20ZM20 12C20 13.1 20.9 14 22 14V10C20.9 10 20 10.9 20 12ZM4 12C4 10.9 3.1 10 2 10V14C3.1 14 4 13.1 4 12ZM17.66 17.66C18.44 16.88 19 15.99 19 15H17C17 15.49 16.62 15.96 16.24 16.34L17.66 17.66ZM6.34 6.34C5.56 7.12 5 8.01 5 9H7C7 8.51 7.38 8.04 7.76 7.66L6.34 6.34ZM17.66 6.34L16.24 7.66C16.62 8.04 17 8.51 17 9H19C19 8.01 18.44 7.12 17.66 6.34ZM6.34 17.66L7.76 16.34C7.38 15.96 7 15.49 7 15H5C5 15.99 5.56 16.88 6.34 17.66Z" fill="currentColor"/>
              </svg>
            )}
          </button>
          {/* Menu/Settings Icon */}
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 touch-manipulation active:opacity-70"
            title="Settings"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={textSecondary}>
              <circle cx="12" cy="8" r="1.5" fill="currentColor"/>
              <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
              <circle cx="12" cy="16" r="1.5" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className={`${bgSecondary} px-3 py-2 flex items-center gap-2 fixed top-14 left-0 right-0 z-10 ${borderColor} border-b`}>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`flex-1 ${bgTertiary} rounded-lg px-3 py-2 text-sm outline-none ${textPrimary} placeholder-gray-500`}
          />
          <button
            onClick={() => {
              setShowSearch(false);
              setSearchQuery('');
            }}
            className="p-2 touch-manipulation active:opacity-70"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={textSecondary}>
              <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      )}

      {/* Photo Modal */}
      {showPhotoModal && modalPhoto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
          onClick={() => setShowPhotoModal(false)}
        >
          <div 
            className="relative"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={modalPhoto} 
              alt="Profile"
              className="w-64 h-64 rounded-full object-cover border-4 border-white shadow-2xl"
            />
            <button
              onClick={() => setShowPhotoModal(false)}
              className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-14 right-3 bg-[#202c33] rounded-lg shadow-2xl p-4 z-50 min-w-[280px] border border-gray-700">
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-3 text-gray-300">Message Settings</h3>
            
            {/* Font Size Slider */}
            <div className="mb-4">
              <label className="text-xs text-gray-400 mb-2 block">
                Font Size: {messageFontSize}px
              </label>
              <input
                type="range"
                min="10"
                max="24"
                value={messageFontSize}
                onChange={(e) => setMessageFontSize(parseInt(e.target.value))}
                className="w-full h-2 bg-[#2a3942] rounded-lg appearance-none cursor-pointer accent-[#00a884]"
              />
              <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                <span>Small</span>
                <span>Large</span>
              </div>
            </div>

            {/* Own Message Color */}
            <div className="mb-4">
              <label className="text-xs text-gray-400 mb-2 block">
                Your Message Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={ownMessageColor}
                  onChange={(e) => setOwnMessageColor(e.target.value)}
                  className="w-12 h-8 rounded cursor-pointer border border-gray-600"
                />
                <input
                  type="text"
                  value={ownMessageColor}
                  onChange={(e) => setOwnMessageColor(e.target.value)}
                  className="flex-1 bg-[#2a3942] text-white text-xs px-2 py-1 rounded outline-none"
                  placeholder="#005c4b"
                />
              </div>
            </div>

            {/* Other Message Color */}
            <div className="mb-4">
              <label className="text-xs text-gray-400 mb-2 block">
                Other Message Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={otherMessageColor}
                  onChange={(e) => setOtherMessageColor(e.target.value)}
                  className="w-12 h-8 rounded cursor-pointer border border-gray-600"
                />
                <input
                  type="text"
                  value={otherMessageColor}
                  onChange={(e) => setOtherMessageColor(e.target.value)}
                  className="flex-1 bg-[#2a3942] text-white text-xs px-2 py-1 rounded outline-none"
                  placeholder="#202c33"
                />
              </div>
            </div>

            {/* Profile Photo Upload */}
            <div className="mb-4 border-t border-gray-700 pt-4">
              <label className="text-xs text-gray-400 mb-2 block">
                Your Profile Photo
              </label>
              <div className="flex items-center gap-3">
                {/* Current Profile Photo Preview */}
                <div className="flex-shrink-0" key={`profile-photo-${username}-${profilePhotos[username?.toLowerCase()] ? 'has-photo' : 'no-photo'}`}>
                  {getProfilePhoto(username?.toLowerCase()) ? (
                    <img
                      src={getProfilePhoto(username?.toLowerCase())}
                      alt={username}
                      key={`img-${username}-${profilePhotos[username?.toLowerCase()]?.substring(0, 50)}`}
                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-600"
                      onLoad={() => console.log('Profile photo image loaded')}
                      onError={(e) => console.error('Profile photo image error:', e)}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center font-bold text-sm border-2 border-gray-600">
                      {getInitials(username || 'U')}
                    </div>
                  )}
                </div>
                {/* Upload Button */}
                <button
                  onClick={() => profilePhotoInputRef.current?.click()}
                  className="flex-1 bg-[#2a3942] hover:bg-[#34434a] text-white text-xs py-2 px-3 rounded transition-colors"
                >
                  Change Photo
                </button>
                <input
                  type="file"
                  ref={profilePhotoInputRef}
                  onChange={handleProfilePhotoSelect}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="w-full bg-[#00a884] text-white text-xs py-2 rounded mt-2 hover:bg-[#00b894] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Chat area - with padding for fixed header */}
      <div 
        className={`flex-1 ${isDarkMode ? 'whatsapp-bg' : 'bg-gray-50'} px-3 py-2 overflow-y-auto overflow-x-hidden ${showSearch ? 'pt-28' : 'pt-14'}`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onTouchMove={handleTouchMove}
      >
        {Object.keys(groupedMessages).map((dateKey) => (
          <div key={dateKey}>
            <div className="text-center text-[10px] text-gray-400 mb-3 py-1">{dateKey}</div>
            {groupedMessages[dateKey].map((msg, index) => {
              // Skip null or invalid messages
              if (!msg || !msg.id) {
                return null;
              }
              
              const msgUserId = msg.userId ? msg.userId.trim() : '';
              const currentUserId = userId ? userId.trim() : '';
              const isOwnMessage = msgUserId && currentUserId && msgUserId === currentUserId;
              
              return (
                <div
                  key={msg.id || index}
                  className={`w-full flex mb-1.5 items-end gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Profile photo for other user's messages (left side) */}
                  {!isOwnMessage && (
                    <div className="flex-shrink-0" key={`photo-${msg.username}-${msg.id || index}`}>
                      {getProfilePhoto(msg.username?.toLowerCase()) ? (
                        <img
                          key={`img-${msg.username}-${profilePhotos[msg.username?.toLowerCase()]?.substring(0, 50) || 'none'}`}
                          src={getProfilePhoto(msg.username?.toLowerCase())}
                          alt={msg.username}
                          className="w-8 h-8 rounded-full object-cover cursor-pointer"
                          onClick={() => {
                            setModalPhoto(getProfilePhoto(msg.username?.toLowerCase()));
                            setShowPhotoModal(true);
                          }}
                          onLoad={() => console.log(`Profile photo loaded for ${msg.username}`)}
                          onError={(e) => console.error(`Profile photo error for ${msg.username}:`, e)}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center font-bold text-xs text-white">
                          {getInitials(msg.username || 'U')}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div 
                    className={`relative inline-block max-w-[75%] px-2.5 py-1.5 rounded-lg ${
                      isOwnMessage 
                        ? 'rounded-tr-none' 
                        : 'rounded-tl-none'
                    } ${!isOwnMessage ? 'cursor-move' : ''}`}
                    draggable={!isOwnMessage}
                    onDragStart={(e) => handleDragStart(e, msg)}
                    onDragEnd={handleDragEnd}
                    onTouchStart={(e) => handleTouchStart(e, msg)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onMouseEnter={() => {
                      clearTimeout(hoverTimeoutRef.current);
                      setHoveredMessage(msg.id);
                    }}
                    onMouseLeave={() => {
                      // Delay hiding to allow moving to menu
                      hoverTimeoutRef.current = setTimeout(() => {
                        setHoveredMessage(null);
                      }, 200);
                    }}
                    style={{
                      backgroundColor: isOwnMessage ? ownMessageColor : otherMessageColor,
                      fontSize: `${messageFontSize}px`,
                      wordWrap: 'break-word',
                      opacity: draggingMessage?.id === msg.id ? 0.5 : 1
                    }}
                  >
                    {/* Reply preview if this is a reply */}
                    {msg.replyTo && msg.replyTo !== null && (
                      <div className="mb-2 pl-2 border-l-2 border-white/30 text-xs opacity-80">
                        <div className="font-medium">{msg.replyTo.username || ''}</div>
                        <div className="truncate">{(msg.replyTo.message !== null && msg.replyTo.message !== undefined) ? msg.replyTo.message : '📷 Image'}</div>
                      </div>
                    )}
                    {!isOwnMessage && (
                      <div className="text-[11px] text-gray-300 mb-1 font-medium">
                        {msg.username}
                      </div>
                    )}
                    {msg.imageUrl && (
                      <div className="mb-1 rounded overflow-hidden">
                        <img 
                          src={msg.imageUrl} 
                          alt="Shared" 
                          className="max-w-full h-auto cursor-pointer"
                          onClick={() => window.open(msg.imageUrl, '_blank')}
                        />
                      </div>
                    )}
                    {(() => {
                      // Debug logging
                      if (msg.messageType === 'audio') {
                        console.log('Audio message detected:', {
                          id: msg.id,
                          hasAudioUrl: !!msg.audioUrl,
                          audioUrlLength: msg.audioUrl?.length,
                          audioUrlPreview: msg.audioUrl?.substring(0, 50),
                          message: msg.message
                        });
                      }
                      return null;
                    })()}
                    {msg.audioUrl && msg.messageType === 'audio' && (
                      <div className="mb-1">
                        <audio 
                          controls 
                          className="w-full max-w-xs h-8"
                          style={{ minWidth: '250px', outline: 'none' }}
                          preload="metadata"
                          onError={(e) => {
                            console.error('Audio playback error:', e);
                            console.error('Message ID:', msg.id);
                            console.error('Audio URL length:', msg.audioUrl?.length);
                            console.error('Audio URL preview:', msg.audioUrl?.substring(0, 100));
                            const audioElement = e.target;
                            console.error('Audio error details:', {
                              error: audioElement.error,
                              networkState: audioElement.networkState,
                              readyState: audioElement.readyState
                            });
                          }}
                          onLoadStart={() => {
                            console.log('Loading audio for message:', msg.id);
                          }}
                          onLoadedData={() => {
                            console.log('Audio loaded successfully for message:', msg.id);
                          }}
                          onCanPlay={() => {
                            console.log('Audio can play for message:', msg.id);
                          }}
                        >
                          <source src={msg.audioUrl} type="audio/webm;codecs=opus" />
                          <source src={msg.audioUrl} type="audio/webm" />
                          <source src={msg.audioUrl} type="audio/mpeg" />
                          <source src={msg.audioUrl} type="audio/ogg" />
                          <source src={msg.audioUrl} type="audio/wav" />
                          Your browser does not support audio playback. 
                          <a href={msg.audioUrl} download={`voice-${msg.id}.webm`} style={{ color: 'inherit', textDecoration: 'underline' }}>Download audio</a>
                        </audio>
                      </div>
                    )}
                    {msg.messageType === 'audio' && !msg.audioUrl && (
                      <div className="mb-1 text-xs opacity-70 italic flex items-center gap-1">
                        <span>⚠️</span>
                        <span>Audio data not available for this message (old message format)</span>
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="ml-2 text-red-400 hover:text-red-300 underline text-[10px]"
                          title="Delete this invalid voice message"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                    {/* Edit mode or display mode */}
                    {editingMessage?.id === msg.id ? (
                      <div className="mb-1">
                        <input
                          ref={editInputRef}
                          type="text"
                          value={editingMessage.message}
                          onChange={(e) => setEditingMessage({ ...editingMessage, message: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit();
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          className={`w-full ${bgTertiary} rounded px-2 py-1 text-sm outline-none ${textPrimary}`}
                          autoFocus
                        />
                        <div className="flex gap-2 mt-1">
                          <button
                            onClick={saveEdit}
                            className="text-xs px-2 py-1 bg-green-600 rounded hover:bg-green-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-xs px-2 py-1 bg-gray-600 rounded hover:bg-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {msg.message && (
                          <div className="break-words">
                            {msg.message}
                            {msg.edited && (
                              <span className={`text-[9px] ${textSecondary} ml-1 italic`}>(edited)</span>
                            )}
                          </div>
                        )}
                      </>
                    )}
                    
                    {/* Message reactions */}
                    {messageReactions[msg.id] && Object.keys(messageReactions[msg.id]).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(messageReactions[msg.id]).map(([emoji, users]) => (
                          <button
                            key={emoji}
                            onClick={() => addReaction(msg.id, emoji)}
                            className={`text-xs px-1.5 py-0.5 rounded-full ${bgTertiary} hover:opacity-80 flex items-center gap-1`}
                            title={users.join(', ')}
                          >
                            <span>{emoji}</span>
                            <span className="text-[10px]">{users.length}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    <div 
                      className="flex items-center gap-1 mt-1 justify-end"
                    >
                      {/* Hover timestamp */}
                      {hoveredMessage === msg.id && (
                        <span className={`text-[9px] ${textSecondary} mr-1`} title={new Date(msg.timestamp).toLocaleString()}>
                          {new Date(msg.timestamp).toLocaleString()}
                        </span>
                      )}
                      <span className={`text-[9px] ${textSecondary}`}>
                        {formatTime(msg.timestamp)}
                      </span>
                      {isOwnMessage && (
                        <>
                          {/* Read receipts */}
                          {(() => {
                            const readStatus = messageReadStatus[msg.id];
                            if (readStatus && readStatus.readBy?.includes(otherUserName.toLowerCase())) {
                              return <span className="text-[9px] text-blue-400">✓✓</span>; // Blue = read
                            }
                            return <span className="text-[9px] text-gray-500">✓✓</span>; // Gray = sent but not read
                          })()}
                        </>
                      )}
                    </div>
                    
                    {/* Message actions menu (appears on hover) */}
                    {hoveredMessage === msg.id && (
                      <div 
                        className={`absolute ${isOwnMessage ? 'right-0' : 'left-0'} mt-1 ${bgSecondary} rounded-lg shadow-lg p-1 flex gap-1 z-20`}
                        onMouseEnter={() => {
                          clearTimeout(hoverTimeoutRef.current);
                          setHoveredMessage(msg.id);
                        }}
                        onMouseLeave={() => {
                          hoverTimeoutRef.current = setTimeout(() => {
                            setHoveredMessage(null);
                          }, 200);
                        }}
                      >
                        {/* Add reaction */}
                        <button
                          onClick={() => setShowReactionPicker(showReactionPicker === msg.id ? null : msg.id)}
                          className="p-1.5 hover:bg-gray-600 rounded text-sm"
                          title="Add reaction"
                        >
                          😊
                        </button>
                        {/* Copy */}
                        {msg.message && (
                          <button
                            onClick={() => copyMessage(msg.message)}
                            className="p-1.5 hover:bg-gray-600 rounded text-sm"
                            title="Copy message"
                          >
                            📋
                          </button>
                        )}
                        {/* Star */}
                        <button
                          onClick={() => toggleStar(msg.id)}
                          className={`p-1.5 hover:bg-gray-600 rounded text-sm ${starredMessages.includes(msg.id) ? 'text-yellow-400' : ''}`}
                          title={starredMessages.includes(msg.id) ? 'Unstar' : 'Star message'}
                        >
                          {starredMessages.includes(msg.id) ? '⭐' : '☆'}
                        </button>
                        {/* Edit (own messages only) */}
                        {isOwnMessage && msg.message && !msg.imageUrl && !msg.audioUrl && (
                          <button
                            onClick={() => startEditing(msg)}
                            className="p-1.5 hover:bg-gray-600 rounded text-sm"
                            title="Edit message"
                          >
                            ✏️
                          </button>
                        )}
                        {/* Delete (own messages only) */}
                        {isOwnMessage && (
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="p-1.5 hover:bg-gray-600 rounded text-sm text-red-400"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    )}
                    
                    {/* Reaction picker */}
                    {showReactionPicker === msg.id && (
                      <div 
                        ref={reactionPickerRef}
                        className={`absolute ${isOwnMessage ? 'right-0' : 'left-0'} mt-8 ${bgSecondary} rounded-lg shadow-lg p-2 flex gap-2 z-30`}
                        onMouseEnter={() => {
                          clearTimeout(hoverTimeoutRef.current);
                          setHoveredMessage(msg.id);
                        }}
                        onMouseLeave={() => {
                          hoverTimeoutRef.current = setTimeout(() => {
                            setHoveredMessage(null);
                          }, 200);
                        }}
                      >
                        {QUICK_REACTIONS.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => addReaction(msg.id, emoji)}
                            className="text-xl hover:scale-125 transition-transform p-1"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Profile photo for own messages (right side) - optional, usually not shown */}
                  {isOwnMessage && false && (
                    <div className="flex-shrink-0">
                      {getProfilePhoto(username?.toLowerCase()) ? (
                        <img
                          src={getProfilePhoto(username?.toLowerCase())}
                          alt={username}
                          className="w-8 h-8 rounded-full object-cover cursor-pointer"
                          onClick={() => {
                            setModalPhoto(getProfilePhoto(username?.toLowerCase()));
                            setShowPhotoModal(true);
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center font-bold text-xs text-white">
                          {getInitials(username || 'U')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        {isTyping && typingUser && typingUser !== username && (
          <div className="max-w-[75%] bg-[#202c33] text-sm px-2.5 py-1.5 rounded-lg rounded-tl-none mb-1.5">
            <div className="text-gray-400 text-xs italic">{typingUser} is typing...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview */}
      {replyingTo && (
        <div className="px-3 py-2 bg-[#202c33] flex-shrink-0 border-t border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[#00a884] mb-1">Replying to {replyingTo.username}</div>
              <div className="text-xs text-gray-400 truncate">
                {replyingTo.imageUrl ? '📷 Image' : replyingTo.message}
              </div>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-gray-400 hover:text-white ml-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Image Preview */}
      {imagePreview && (
        <div className="px-2 py-1 bg-[#202c33] flex-shrink-0">
          <div className="relative inline-block">
            <img src={imagePreview} alt="Preview" className="max-w-[200px] max-h-[200px] rounded-lg" />
            <button
              onClick={() => {
                setSelectedImage(null);
                setImagePreview(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div 
          ref={emojiPickerRef}
          className={`${bgSecondary} border-t ${borderColor} px-3 py-3 flex flex-col max-h-48 overflow-y-auto flex-shrink-0`}
        >
          {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
            <div key={category} className="mb-3">
              <div className={`text-xs ${textSecondary} mb-2 font-medium`}>{category}</div>
              <div className="flex flex-wrap gap-2">
                {emojis.map((emoji, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => insertEmoji(emoji)}
                    className="text-2xl hover:scale-125 transition-transform p-1"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <form 
        ref={inputAreaRef}
        onSubmit={handleSendMessage} 
        className={`flex items-center gap-1 px-2 py-2 ${bgSecondary} flex-shrink-0 overflow-hidden ${borderColor} border-t`}
      >
        {/* Emoji Icon */}
        <button 
          type="button" 
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={`p-2 touch-manipulation active:opacity-70 flex-shrink-0 ${showEmojiPicker ? 'bg-[#2a3942] rounded-full' : ''}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={textSecondary}>
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor"/>
            <path d="M8.5 10C9.33 10 10 9.33 10 8.5C10 7.67 9.33 7 8.5 7C7.67 7 7 7.67 7 8.5C7 9.33 7.67 10 8.5 10ZM15.5 10C16.33 10 17 9.33 17 8.5C17 7.67 16.33 7 15.5 7C14.67 7 14 7.67 14 8.5C14 9.33 14.67 10 15.5 10ZM12 17.5C14.33 17.5 16.31 16.08 17.11 14H6.89C7.69 16.08 9.67 17.5 12 17.5Z" fill="currentColor"/>
          </svg>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleImageSelect}
          style={{ display: 'none' }}
        />
        <input
          ref={messageInputRef}
          type="text"
          className={`flex-1 ${bgTertiary} rounded-lg px-3 py-2 text-sm outline-none ${textPrimary} placeholder-gray-500 min-w-0`}
          placeholder={replyingTo ? `Reply to ${replyingTo.username}...` : "Message"}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            handleTyping();
          }}
          disabled={!isConnected}
        />
        {/* Attachment Icon */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 touch-manipulation active:opacity-70 flex-shrink-0"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={textSecondary}>
            <path d="M16.5 6V17.5C16.5 19.71 14.71 21.5 12.5 21.5C10.29 21.5 8.5 19.71 8.5 17.5V5C8.5 3.62 9.62 2.5 11 2.5C12.38 2.5 13.5 3.62 13.5 5V15.5C13.5 16.05 13.05 16.5 12.5 16.5C11.95 16.5 11.5 16.05 11.5 15.5V6H10V15.5C10 17.16 11.34 18.5 13 18.5C14.66 18.5 16 17.16 16 15.5V5C16 2.79 14.21 1 12 1C9.79 1 8 2.79 8 5V17.5C8 20.54 10.46 23 13.5 23C16.54 23 19 20.54 19 17.5V6H16.5Z" fill="currentColor"/>
          </svg>
        </button>
        {/* Microphone/Send Icon */}
        {message.trim() || selectedImage ? (
          <button
            type="submit"
            className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center touch-manipulation active:bg-[#00b894] flex-shrink-0 ml-0.5"
            disabled={!isConnected}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="white"/>
            </svg>
          </button>
        ) : (
          <button
            type="button"
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            className={`w-8 h-8 rounded-full ${isRecording ? 'bg-red-500' : 'bg-[#00a884]'} flex items-center justify-center touch-manipulation active:bg-[#00b894] flex-shrink-0 ml-0.5`}
          >
            {isRecording ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 14C13.1 14 14 13.1 14 12C14 10.9 13.1 10 12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14ZM12 16C9.79 16 8 14.21 8 12C8 9.79 9.79 8 12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16ZM12 4C7.58 4 4 7.58 4 12C4 16.42 7.58 20 12 20C16.42 20 20 16.42 20 12C20 7.58 16.42 4 12 4Z" fill="white"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 14C13.1 14 14 13.1 14 12V6C14 4.9 13.1 4 12 4C10.9 4 10 4.9 10 6V12C10 13.1 10.9 14 12 14ZM17.3 12C17.3 15 14.76 17.1 12 17.1C9.24 17.1 6.7 15 6.7 12H5C5 15.41 7.72 18.23 11 18.72V21H13V18.72C16.28 18.23 19 15.41 19 12H17.3Z" fill="white"/>
              </svg>
            )}
          </button>
        )}
      </form>
    </div>
  );
}

