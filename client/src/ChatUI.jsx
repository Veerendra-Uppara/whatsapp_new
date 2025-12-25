import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

export default function ChatUI() {
  const [socket, setSocket] = useState(null);
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState('');
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
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const messageInputRef = useRef(null);

  // Allowed users - only these 2 can login
  const allowedUsers = [
    { username: 'veerendra', userId: 'veeru@123' },
    { username: 'madhu', userId: 'madhu@123' }
  ];

  // Shared function to get backend URL
  const getBackendUrl = () => {
    // First, check for environment variable (set at build time)
    if (process.env.REACT_APP_SOCKET_URL) {
      return process.env.REACT_APP_SOCKET_URL;
    }
    
    // For local development
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    
    // For production, warn if env variable is missing
    if (window.location.hostname.includes('pages.dev') || window.location.hostname.includes('cloudflare')) {
      console.error('⚠️ REACT_APP_SOCKET_URL not set! Profile photos and socket may not work.');
      console.error('⚠️ Please set REACT_APP_SOCKET_URL in Cloudflare Pages environment variables.');
    }
    
    // Fallback: try using current hostname (won't work for Cloudflare + Railway)
    return `http://${hostname}:5000`;
  };

  useEffect(() => {
    // Initialize socket connection
    const socketUrl = getBackendUrl();
    console.log('Connecting to socket:', socketUrl);
    const newSocket = io(socketUrl);
    setSocket(newSocket);

    // Socket event listeners
    newSocket.on('connect', () => {
      console.log('Connected to server, socket ID:', newSocket.id);
      setIsConnected(true);
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('joined', (data) => {
      console.log('Joined:', data);
      setHasJoined(true);
    });

    newSocket.on('messageHistory', (history) => {
      console.log('Loading message history:', history.length, 'messages');
      setMessages(history);
    });

    newSocket.on('receiveMessage', (data) => {
      console.log('Received message:', data);
      setMessages((prev) => [...prev, data]);
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
  }, []);

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
  }, [hasJoined, messages, username]);

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

  // Handle drag to reply
  const handleDragStart = (e, msg) => {
    const msgUserId = msg.userId ? msg.userId.trim() : '';
    const currentUserId = userId ? userId.trim() : '';
    const isOwnMessage = msgUserId && currentUserId && msgUserId === currentUserId;
    
    // Only allow dragging other person's messages to reply
    if (!isOwnMessage) {
      setDraggingMessage(msg);
      e.dataTransfer.effectAllowed = 'move';
    } else {
      e.preventDefault();
    }
  };

  const handleDragEnd = () => {
    setDraggingMessage(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (draggingMessage) {
      setReplyingTo(draggingMessage);
      setDraggingMessage(null);
      messageInputRef.current?.focus();
    }
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

  // Group messages by date
  const groupMessagesByDate = () => {
    const grouped = {};
    messages.forEach((msg) => {
      const dateKey = formatDate(msg.timestamp);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(msg);
    });
    return grouped;
  };

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
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Chat UI
  const groupedMessages = groupMessagesByDate();
  const otherUserName = getOtherUserName();
  const otherUserInitials = getInitials(otherUserName);

  return (
    <div className="h-[100dvh] bg-[#0b141a] flex flex-col text-white overflow-hidden w-full">
      {/* Header - Fixed */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-[#202c33] flex-shrink-0 fixed top-0 left-0 right-0 z-10">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {getProfilePhoto(otherUserName.toLowerCase()) ? (
            <img 
              src={getProfilePhoto(otherUserName.toLowerCase())} 
              alt={otherUserName}
              className="w-9 h-9 rounded-full object-cover flex-shrink-0 ml-2 cursor-pointer"
              onClick={() => {
                setModalPhoto(getProfilePhoto(otherUserName.toLowerCase()));
                setShowPhotoModal(true);
              }}
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center font-bold text-sm flex-shrink-0 ml-2">
              {otherUserInitials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm truncate">{otherUserName}</div>
            <div className="text-[10px] text-gray-400">
              {isConnected ? 'online' : 'offline'}
            </div>
          </div>
        </div>
        <div className="flex gap-4 items-center flex-shrink-0">
          {/* Video Call Icon */}
          <button className="p-2 -mr-2 touch-manipulation active:opacity-70">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-gray-300">
              <path d="M17 10.5V7C17 6.45 16.55 6 16 6H4C3.45 6 3 6.45 3 7V17C3 17.55 3.45 18 4 18H16C16.55 18 17 17.55 17 17V13.5L21 17.5V6.5L17 10.5Z" fill="currentColor"/>
            </svg>
          </button>
          {/* Voice Call Icon */}
          <button className="p-2 -mr-2 touch-manipulation active:opacity-70">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-gray-300">
              <path d="M6.62 10.79C8.06 13.62 10.38 15.94 13.21 17.38L15.41 15.18C15.69 14.9 16.08 14.82 16.43 14.93C17.55 15.3 18.75 15.5 20 15.5C20.55 15.5 21 15.95 21 16.5V20C21 20.55 20.55 21 20 21C10.61 21 3 13.39 3 4C3 3.45 3.45 3 4 3H7.5C8.05 3 8.5 3.45 8.5 4C8.5 5.25 8.7 6.45 9.07 7.57C9.18 7.92 9.1 8.31 8.82 8.59L6.62 10.79Z" fill="currentColor"/>
            </svg>
          </button>
          {/* Menu/Settings Icon */}
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 -mr-2 touch-manipulation active:opacity-70"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-gray-300">
              <circle cx="12" cy="8" r="1.5" fill="currentColor"/>
              <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
              <circle cx="12" cy="16" r="1.5" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>

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
        className="flex-1 whatsapp-bg px-3 py-2 overflow-y-auto overflow-x-hidden pt-14"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {Object.keys(groupedMessages).map((dateKey) => (
          <div key={dateKey}>
            <div className="text-center text-[10px] text-gray-400 mb-3 py-1">{dateKey}</div>
            {groupedMessages[dateKey].map((msg, index) => {
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
                    <div className="flex-shrink-0">
                      {getProfilePhoto(msg.username?.toLowerCase()) ? (
                        <img
                          src={getProfilePhoto(msg.username?.toLowerCase())}
                          alt={msg.username}
                          className="w-8 h-8 rounded-full object-cover cursor-pointer"
                          onClick={() => {
                            setModalPhoto(getProfilePhoto(msg.username?.toLowerCase()));
                            setShowPhotoModal(true);
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center font-bold text-xs text-white">
                          {getInitials(msg.username || 'U')}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div 
                    className={`inline-block max-w-[75%] px-2.5 py-1.5 rounded-lg ${
                      isOwnMessage 
                        ? 'rounded-tr-none' 
                        : 'rounded-tl-none'
                    } ${!isOwnMessage ? 'cursor-move' : ''}`}
                    draggable={!isOwnMessage}
                    onDragStart={(e) => handleDragStart(e, msg)}
                    onDragEnd={handleDragEnd}
                    style={{
                      backgroundColor: isOwnMessage ? ownMessageColor : otherMessageColor,
                      fontSize: `${messageFontSize}px`,
                      wordWrap: 'break-word',
                      opacity: draggingMessage?.id === msg.id ? 0.5 : 1
                    }}
                  >
                    {/* Reply preview if this is a reply */}
                    {msg.replyTo && (
                      <div className="mb-2 pl-2 border-l-2 border-white/30 text-xs opacity-80">
                        <div className="font-medium">{msg.replyTo.username}</div>
                        <div className="truncate">{msg.replyTo.message || '📷 Image'}</div>
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
                    {msg.message && (
                      <div className="break-words">{msg.message}</div>
                    )}
                    <div className="flex items-center gap-1 mt-1 justify-end">
                      <span className="text-[9px] text-gray-400">
                        {formatTime(msg.timestamp)}
                      </span>
                      {isOwnMessage && (
                        <>
                          <span className="text-[9px]">✓✓</span>
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="ml-1 text-[10px] opacity-70 hover:opacity-100"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </div>
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

      {/* Input */}
      <form onSubmit={handleSendMessage} className="flex items-center gap-1 px-2 py-2 bg-[#202c33] flex-shrink-0 overflow-hidden">
        {/* Emoji Icon */}
        <button type="button" className="p-2 touch-manipulation active:opacity-70 flex-shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gray-400">
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
          className="flex-1 bg-[#2a3942] rounded-lg px-3 py-2 text-sm outline-none text-white placeholder-gray-500 min-w-0"
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gray-400">
            <path d="M16.5 6V17.5C16.5 19.71 14.71 21.5 12.5 21.5C10.29 21.5 8.5 19.71 8.5 17.5V5C8.5 3.62 9.62 2.5 11 2.5C12.38 2.5 13.5 3.62 13.5 5V15.5C13.5 16.05 13.05 16.5 12.5 16.5C11.95 16.5 11.5 16.05 11.5 15.5V6H10V15.5C10 17.16 11.34 18.5 13 18.5C14.66 18.5 16 17.16 16 15.5V5C16 2.79 14.21 1 12 1C9.79 1 8 2.79 8 5V17.5C8 20.54 10.46 23 13.5 23C16.54 23 19 20.54 19 17.5V6H16.5Z" fill="currentColor"/>
          </svg>
        </button>
        {/* Camera Icon */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 touch-manipulation active:opacity-70 flex-shrink-0"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gray-400">
            <path d="M12 15.5C13.38 15.5 14.5 14.38 14.5 13C14.5 11.62 13.38 10.5 12 10.5C10.62 10.5 9.5 11.62 9.5 13C9.5 14.38 10.62 15.5 12 15.5ZM21 19V7C21 5.9 20.1 5 19 5H17.83L16.42 3.59C16.05 3.22 15.55 3 15 3H9C8.45 3 7.95 3.22 7.58 3.59L6.17 5H5C3.9 5 3 5.9 3 7V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM19 19H5V7H5.83L7.24 5.59C7.61 5.22 8.11 5 8.66 5H15.34C15.89 5 16.39 5.22 16.76 5.59L18.17 7H19V19Z" fill="currentColor"/>
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
            className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center touch-manipulation active:bg-[#00b894] flex-shrink-0 ml-0.5"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 14C13.1 14 14 13.1 14 12V6C14 4.9 13.1 4 12 4C10.9 4 10 4.9 10 6V12C10 13.1 10.9 14 12 14ZM17.3 12C17.3 15 14.76 17.1 12 17.1C9.24 17.1 6.7 15 6.7 12H5C5 15.41 7.72 18.23 11 18.72V21H13V18.72C16.28 18.23 19 15.41 19 12H17.3Z" fill="white"/>
            </svg>
          </button>
        )}
      </form>
    </div>
  );
}

