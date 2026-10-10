import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('<username>')) {
    console.warn('[ConnectDesk DB] Warning: MONGODB_URI is missing or contains placeholder values. Running with database disconnected state.');
    return false;
  }

  try {
    // Configure Mongoose options
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`[ConnectDesk DB] Connected successfully to MongoDB: ${conn.connection.host}/${conn.connection.name}`);
    return true;
  } catch (error) {
    console.error(`[ConnectDesk DB] Error connecting to MongoDB: ${error.message}`);
    return false;
  }
}

export function getDBHealthStatus() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const readyState = mongoose.connection.readyState;
  return {
    connected: readyState === 1,
    state: states[readyState] || 'unknown',
    host: readyState === 1 ? mongoose.connection.host : null,
    dbName: readyState === 1 ? mongoose.connection.name : null,
  };
}
