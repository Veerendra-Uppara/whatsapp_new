import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';

function App() {
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
  const [showProfile, setShowProfile] = useState(false);
  const [loginError, setLoginError] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection
    // In production, connect to the same server (relative URL)
    // In development, use localhost
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 
      (process.env.NODE_ENV === 'production' ? window.location.origin : 'http://localhost:5000');
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
      setMessages((prev) => {
        const newMessages = [...prev, data];
        console.log('Updated messages array, total messages:', newMessages.length);
        return newMessages;
      });
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

    newSocket.on('userJoined', (data) => {
      console.log('User joined:', data);
    });

    newSocket.on('userLeft', (data) => {
      console.log('User left:', data);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    
    // Validate credentials against allowed users
    if (!validateCredentials(trimmedUsername, trimmedUserId)) {
      setLoginError('Invalid credentials. Only authorized users can access this chat.');
      return;
    }
    
    console.log('Joining chat with:', { username: trimmedUsername, userId: trimmedUserId });
    
    // Update state with trimmed values so message comparison works correctly
    console.log('Setting userId state to:', `"${trimmedUserId}"`);
    setUsername(trimmedUsername);
    setUserId(trimmedUserId);
    
    socket.emit('join', { username: trimmedUsername, userId: trimmedUserId });
    setHasJoined(true); // Set immediately to prevent message sending before join completes
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    console.log('handleSendMessage called', { socket: !!socket, message: message.trim(), username, userId, isConnected, hasImage: !!selectedImage });
    
    if (!socket) {
      console.error('Socket not connected');
      alert('Not connected to server. Please refresh the page.');
      return;
    }
    
    if (!username || !userId) {
      console.error('Username or userId missing', { username, userId });
      alert('Please join the chat first by entering your name and ID.');
      return;
    }
    
    // Check if there's a message or image
    if (!message.trim() && !selectedImage) {
      console.log('Empty message and no image, not sending');
      return;
    }
    
    const messageData = {
      message: message.trim() || null,
      username,
      userId,
      timestamp: new Date().toISOString(),
    };
    
    // If image is selected, convert to base64 and include
    if (selectedImage && imagePreview) {
      messageData.imageUrl = imagePreview;
      messageData.messageType = 'image';
      if (!messageData.message) {
        messageData.message = '📷 Image';
      }
    }
    
    console.log('Sending message:', { ...messageData, imageUrl: messageData.imageUrl ? 'present' : 'none' });
    
    socket.emit('sendMessage', messageData);
    console.log('Message emitted to server');
    
    setMessage('');
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
    if (!messageId) {
      console.error('Cannot delete message: messageId is missing');
      return;
    }

    if (window.confirm('Are you sure you want to delete this message?')) {
      if (socket) {
        socket.emit('deleteMessage', { messageId });
        console.log('Delete message request sent:', messageId);
      } else {
        console.error('Cannot delete message: socket not connected');
      }
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    // Get first letter, handle special cases
    if (name.toLowerCase().startsWith('veerendra') || name.toLowerCase().startsWith('veer')) {
      return 'V';
    }
    if (name.toLowerCase().startsWith('madhu')) {
      return 'M';
    }
    return name.charAt(0).toUpperCase();
  };

  // Allowed users - only these 2 can login
  const allowedUsers = [
    { username: 'veerendra', userId: 'veeru@123' },
    { username: 'madhu', userId: 'madhu@123' }
  ];

  const validateCredentials = (username, userId) => {
    return allowedUsers.some(
      user => user.username.toLowerCase() === username.trim().toLowerCase() && 
              user.userId.toLowerCase() === userId.trim().toLowerCase()
    );
  };

  // Format username with first letter capitalized
  const formatUsername = (name) => {
    if (!name) return '';
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  if (!hasJoined) {
    return (
      <div className="app">
        <div className="login-container">
          <div className="login-box">
            <div className="login-header">
              <div className="login-logo">💬</div>
              <h1>Private Chat</h1>
              <p className="subtitle">Connect and chat securely</p>
            </div>
            <form onSubmit={handleJoin} className="login-form">
              <div className="input-group">
                <label>Your Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setLoginError(''); // Clear error when user types
                  }}
                  className="input-field"
                  required
                  autoFocus
                />
              </div>
              <div className="input-group">
                <label>Your ID</label>
                <input
                  type="password"
                  placeholder="Enter your ID"
                  value={userId}
                  onChange={(e) => {
                    setUserId(e.target.value);
                    setLoginError(''); // Clear error when user types
                  }}
                  className="input-field"
                  required
                />
              </div>
              {loginError && (
                <div className="login-error">
                  {loginError}
                </div>
              )}
              <button type="submit" className="join-button" disabled={!username.trim() || !userId.trim()}>
                Join Chat
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="chat-container">
        <div className="chat-header">
          <div className="header-left">
            <h2 className="app-name">{formatUsername(username)}</h2>
          </div>
          <div className="header-actions">
            <button className="header-icon-button" title="Scan QR Code">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="5" height="5"></rect>
                <rect x="16" y="3" width="5" height="5"></rect>
                <rect x="3" y="16" width="5" height="5"></rect>
                <path d="M21 16h-3"></path>
                <path d="M16 21v-3"></path>
                <path d="M21 12v-1"></path>
                <path d="M12 21h-1"></path>
                <path d="M8 8h.01"></path>
                <path d="M16 8h.01"></path>
                <path d="M8 16h.01"></path>
              </svg>
            </button>
            <button className="header-icon-button" onClick={() => fileInputRef.current?.click()} title="Camera">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
            </button>
            <button className="header-icon-button" onClick={() => setShowProfile(!showProfile)} title="Menu">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="1"></circle>
                <circle cx="19" cy="12" r="1"></circle>
                <circle cx="5" cy="12" r="1"></circle>
              </svg>
            </button>
          </div>
        </div>

        {showProfile && (
          <div className="profile-panel">
            <div className="profile-content">
              <div className="profile-picture-large">
                {getInitials(username)}
              </div>
              <h3 className="profile-name">{username}</h3>
              <p className="profile-id">ID: {userId}</p>
              <div className="profile-section">
                <h4>About</h4>
                <p className="profile-about">Private chat user. Connect and share messages securely with your partner.</p>
              </div>
              <div className="profile-stats">
                <div className="stat-item">
                  <span className="stat-value">{messages.length}</span>
                  <span className="stat-label">Messages</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{isConnected ? 'Online' : 'Offline'}</span>
                  <span className="stat-label">Status</span>
                </div>
              </div>
              <button className="close-profile-btn" onClick={() => setShowProfile(false)}>Close</button>
            </div>
          </div>
        )}

        <div className="messages-container">
          {messages.map((msg, index) => {
            // Compare userIds after trimming to handle any whitespace issues
            const msgUserId = msg.userId ? msg.userId.trim() : '';
            const currentUserId = userId ? userId.trim() : '';
            const isOwnMessage = msgUserId && currentUserId && msgUserId === currentUserId;
            
            // Debug logging (check browser console)
            if (index === 0) {
              console.log('First message userId comparison:', {
                msgUserId: `"${msgUserId}"`,
                currentUserId: `"${currentUserId}"`,
                match: isOwnMessage,
                msgUserIdLength: msgUserId.length,
                currentUserIdLength: currentUserId.length
              });
            }
            return (
              <div
                key={index}
                className={`message-wrapper ${isOwnMessage ? 'own' : 'other'}`}
              >
                {!isOwnMessage && (
                  <div className="message-avatar">
                    {getInitials(msg.username)}
                  </div>
                )}
                <div className={`message ${isOwnMessage ? 'own-message' : 'other-message'}`}>
                  {!isOwnMessage && (
                    <div className="message-sender">{msg.username}</div>
                  )}
                  {msg.imageUrl && (
                    <div className="message-image-container">
                      <img 
                        src={msg.imageUrl} 
                        alt="Shared image" 
                        className="message-image"
                        onClick={() => window.open(msg.imageUrl, '_blank')}
                      />
                    </div>
                  )}
                  {msg.message && (
                    <div className="message-content">{msg.message}</div>
                  )}
                  <div className="message-footer">
                    <span className="message-time">{formatTime(msg.timestamp)}</span>
                    {isOwnMessage && (
                      <>
                        <span className="message-status">✓✓</span>
                        <button 
                          className="delete-message-btn"
                          onClick={() => handleDeleteMessage(msg.id)}
                          title="Delete message"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {isOwnMessage && (
                  <div className="message-avatar own-avatar">
                    {getInitials(msg.username)}
                  </div>
                )}
              </div>
            );
          })}
          {isTyping && typingUser && typingUser !== username && (
            <div className="typing-indicator">
              <span>{typingUser} is typing...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="message-form">
          {imagePreview && (
            <div className="image-preview-container">
              <img src={imagePreview} alt="Preview" className="image-preview" />
              <button 
                type="button" 
                className="remove-image-button" 
                onClick={handleRemoveImage}
                title="Remove image"
              >
                ×
              </button>
            </div>
          )}
          <div className="input-container">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageSelect}
              style={{ display: 'none' }}
              id="image-input"
            />
            <label htmlFor="image-input" className="image-upload-button" title="Upload image">
              📷
            </label>
            <input
              type="text"
              placeholder={selectedImage ? "Add a caption (optional)..." : "Type your message..."}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                handleTyping();
              }}
              className="message-input"
              disabled={!isConnected || !hasJoined}
            />
            <button 
              type="submit" 
              className="send-button" 
              disabled={!isConnected || !hasJoined || (!message.trim() && !selectedImage)}
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;

