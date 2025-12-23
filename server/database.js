const { MongoClient } = require('mongodb');

// MongoDB connection URL (hardcoded as requested)
const MONGODB_URI = 'mongodb+srv://veeru:veeru123@connectapp.rdrcqrl.mongodb.net/test';
const DB_NAME = 'Chatting';
const COLLECTION_NAME = 'messages';
const USERS_COLLECTION_NAME = 'users';

let client = null;
let db = null;
let collection = null;
let usersCollection = null;

// Initialize MongoDB database
async function initDatabase() {
  try {
    // Create MongoDB client
    client = new MongoClient(MONGODB_URI);

    // Connect to MongoDB
    await client.connect();
    console.log('✅ Connected to MongoDB database');

    // Get database and collection
    db = client.db(DB_NAME);
    collection = db.collection(COLLECTION_NAME);
    usersCollection = db.collection(USERS_COLLECTION_NAME);

    // Create index on timestamp for faster queries
    await collection.createIndex({ timestamp: 1 });
    await collection.createIndex({ userId: 1 });
    
    // Create index on username for user profile queries
    await usersCollection.createIndex({ username: 1 }, { unique: true });

    console.log(`✅ MongoDB collection '${COLLECTION_NAME}' ready in database '${DB_NAME}'`);
    console.log(`✅ MongoDB collection '${USERS_COLLECTION_NAME}' ready in database '${DB_NAME}'`);
    
    // Return collection for backward compatibility with existing code
    return collection;
  } catch (err) {
    console.error('❌ Error initializing MongoDB:', err.message);
    throw err;
  }
}

// Save a message to the database
async function saveMessage(db, messageData) {
  const { message, username, userId, timestamp, imageUrl, messageType } = messageData;
  const timestampValue = timestamp || new Date().toISOString();

  // Validate required fields
  if (!username || !userId) {
    const error = `Missing required fields: username=${username}, userId=${userId}`;
    console.error('❌ Error saving message to MongoDB:', error);
    console.error('Message data received:', JSON.stringify(messageData, null, 2));
    throw new Error(error);
  }

  try {
    const messageDoc = {
      message: message || null,
      username: username.trim(),
      userId: userId.trim(),
      timestamp: timestampValue,
      imageUrl: imageUrl || null,
      messageType: messageType || 'text',
      createdAt: new Date()
    };

    console.log(`💾 Saving message to MongoDB for user: ${messageDoc.username} (${messageDoc.userId})`);
    
    if (!collection) {
      throw new Error('MongoDB collection not initialized');
    }

    const result = await collection.insertOne(messageDoc);
    
    console.log(`✅ Message saved successfully (ID: ${result.insertedId.toString()})`);
    
    // MongoDB returns _id as ObjectId, convert to string for consistency
    return {
      id: result.insertedId.toString(),
      ...messageData
    };
  } catch (err) {
    console.error('❌ Error saving message to MongoDB:', err.message);
    console.error('Error details:', err);
    console.error('Message data that failed:', JSON.stringify(messageData, null, 2));
    throw err;
  }
}

// Get message history
async function getMessages(db, limit = 100) {
  try {
    const messages = await collection
      .find({})
      .sort({ timestamp: 1 }) // Sort ascending (oldest first)
      .limit(limit)
      .toArray();

    // Convert MongoDB documents to expected format
    return messages.map(msg => ({
      id: msg._id.toString(),
      message: msg.message,
      username: msg.username,
      userId: msg.userId,
      timestamp: msg.timestamp,
      imageUrl: msg.imageUrl || null,
      messageType: msg.messageType || 'text'
    }));
  } catch (err) {
    console.error('Error fetching messages from MongoDB:', err.message);
    throw err;
  }
}

// Get messages by user ID
async function getMessagesByUserId(db, userId, limit = 100) {
  try {
    const messages = await collection
      .find({ userId: userId })
      .sort({ timestamp: 1 }) // Sort ascending (oldest first)
      .limit(limit)
      .toArray();

    // Convert MongoDB documents to expected format
    return messages.map(msg => ({
      id: msg._id.toString(),
      message: msg.message,
      username: msg.username,
      userId: msg.userId,
      timestamp: msg.timestamp,
      imageUrl: msg.imageUrl || null,
      messageType: msg.messageType || 'text'
    }));
  } catch (err) {
    console.error('Error fetching user messages from MongoDB:', err.message);
    throw err;
  }
}

// Delete a specific message by ID
async function deleteMessage(db, messageId) {
  try {
    if (!collection) {
      throw new Error('MongoDB collection not initialized');
    }

    // MongoDB uses ObjectId, messages stored have _id as ObjectId
    // We return id as msg._id.toString() in getMessages, so we need to convert back
    const { ObjectId } = require('mongodb');
    
    if (!ObjectId.isValid(messageId)) {
      throw new Error('Invalid message ID format');
    }

    const query = { _id: new ObjectId(messageId) };
    const result = await collection.deleteOne(query);

    if (result.deletedCount === 0) {
      throw new Error('Message not found or already deleted');
    }

    console.log(`✅ Message deleted successfully (ID: ${messageId})`);
    return { success: true, deletedCount: result.deletedCount };
  } catch (err) {
    console.error('❌ Error deleting message from MongoDB:', err.message);
    throw err;
  }
}

// Delete old messages (optional cleanup function)
async function deleteOldMessages(db, daysOld = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await collection.deleteMany({
      timestamp: { $lt: cutoffDate.toISOString() }
    });

    console.log(`Deleted ${result.deletedCount} old messages from MongoDB`);
    return result.deletedCount;
  } catch (err) {
    console.error('Error deleting old messages from MongoDB:', err.message);
    throw err;
  }
}

// Save or update user profile photo
async function saveUserProfilePhoto(username, photoBase64) {
  try {
    if (!usersCollection) {
      throw new Error('MongoDB users collection not initialized');
    }

    const userDoc = {
      username: username.toLowerCase().trim(),
      photoBase64: photoBase64,
      updatedAt: new Date()
    };

    const result = await usersCollection.updateOne(
      { username: userDoc.username },
      { $set: userDoc },
      { upsert: true }
    );

    console.log(`✅ User profile photo saved for ${username}`);
    return result;
  } catch (err) {
    console.error('❌ Error saving user profile photo:', err.message);
    throw err;
  }
}

// Get user profile photo
async function getUserProfilePhoto(username) {
  try {
    if (!usersCollection) {
      throw new Error('MongoDB users collection not initialized');
    }

    const user = await usersCollection.findOne({ 
      username: username.toLowerCase().trim() 
    });

    if (user && user.photoBase64) {
      return user.photoBase64;
    }
    return null;
  } catch (err) {
    console.error('❌ Error fetching user profile photo:', err.message);
    throw err;
  }
}

// Get all user profiles
async function getAllUserProfiles() {
  try {
    if (!usersCollection) {
      throw new Error('MongoDB users collection not initialized');
    }

    const users = await usersCollection.find({}).toArray();
    return users.map(user => ({
      username: user.username,
      photoBase64: user.photoBase64 || null
    }));
  } catch (err) {
    console.error('❌ Error fetching user profiles:', err.message);
    throw err;
  }
}

// Close database connection (useful for graceful shutdown)
async function closeDatabase() {
  if (client) {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

module.exports = {
  initDatabase,
  saveMessage,
  getMessages,
  getMessagesByUserId,
  deleteMessage,
  deleteOldMessages,
  saveUserProfilePhoto,
  getUserProfilePhoto,
  getAllUserProfiles,
  closeDatabase,
  DB_PATH: 'MongoDB'
};
