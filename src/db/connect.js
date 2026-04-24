import mongoose from "mongoose";

/**
 * TODO: Connect to MongoDB
 *
 * 1. Check if uri is provided (throw error if not: "MongoDB URI is required")
 * 2. Connect using mongoose.connect(uri)
 * 3. Return mongoose.connection
 */
export async function connectDB(uri) {
  // Your code here
  if (!uri) {
    throw new Error("MongoDB URI is required");
  }
  try {
     await mongoose.connect(uri);
     return mongoose.connection;  // mongoose gives access to this after connection - it gives event listeners, connection states, DB-level control
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}
