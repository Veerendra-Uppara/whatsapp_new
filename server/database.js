const { MongoClient } = require('mongodb');

// MongoDB connection URL (hardcoded as requested)
const MONGODB_URI = 'mongodb+srv://veeru:veeru123@connectapp.rdrcqrl.mongodb.net/test';
const DB_NAME = 'Chatting';
const COLLECTION_NAME = 'messages';

let client = null;
let db = null;
let collection = null;

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

    // Create index on timestamp for faster queries
    await collection.createIndex({ timestamp: 1 });
    await collection.createIndex({ userId: 1 });

    console.log(`✅ MongoDB collection '${COLLECTION_NAME}' ready in database '${DB_NAME}'`);
    
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

  try {
    const messageDoc = {
      message: message || null,
      username: username,
      userId: userId,
      timestamp: timestampValue,
      imageUrl: imageUrl || null,
      messageType: messageType || 'text',
      createdAt: new Date()
    };

    const result = await collection.insertOne(messageDoc);
    
    // MongoDB returns _id as ObjectId, convert to string for consistency
    return {
      id: result.insertedId.toString(),
      ...messageData
    };
  } catch (err) {
    console.error('Error saving message to MongoDB:', err.message);
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
  deleteOldMessages,
  closeDatabase,
  DB_PATH: 'MongoDB'
};
