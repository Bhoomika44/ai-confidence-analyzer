const mongoClient = require('./mongodb_client');

const connectDB = async () => {
  return await mongoClient.connect();
};

module.exports = {
  connectDB,
  getIsConnected: () => mongoClient.isConnected,
  mongoClient
};
