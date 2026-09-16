const mongoose = require('mongoose');

class MongoDBClient {
  constructor() {
    this.isConnected = false;

    this.uri =
      process.env.MONGODB_URI ||
      'mongodb://127.0.0.1:27017/ai_confidence_analyzer';

    this.connectionOptions = {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority',
      maxPoolSize: 10,
      autoIndex: true
    };
  }

  async connect() {
    try {
      console.log('[MongoDB Client] Starting MongoDB connection...');

      const conn = await mongoose.connect(
        this.uri,
        this.connectionOptions
      );

      this.isConnected = true;

      console.log(
        `[MongoDB Client] Successfully connected to MongoDB: ${conn.connection.host}/${conn.connection.name}`
      );

      mongoose.connection.on('error', (err) => {
        console.error(
          `[MongoDB Client] Database runtime error: ${err.message}`
        );
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('[MongoDB Client] MongoDB disconnected.');
        this.isConnected = false;
      });

      return conn;
    } catch (error) {
      console.error(
        `[MongoDB Client] Could not establish MongoDB connection: ${error.message}`
      );

      this.isConnected = false;

      console.log(
        '[MongoDB Client] Activating resilient local database storage fallback.'
      );

      return null;
    }
  }

  getStatus() {
    return {
      connected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host || 'local-storage',
      name: mongoose.connection.name || 'ai_confidence_analyzer',
      status: this.isConnected
        ? 'MongoDB Active'
        : 'Local Storage Fallback Active'
    };
  }

  async disconnect() {
    if (this.isConnected) {
      await mongoose.disconnect();
      this.isConnected = false;

      console.log(
        '[MongoDB Client] MongoDB connection closed gracefully.'
      );
    }
  }
}

const mongoClient = new MongoDBClient();

module.exports = mongoClient;