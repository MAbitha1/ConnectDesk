import app from '../server/index.js';
import { connectDB } from '../server/config/db.js';

export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (error) {
    console.error('[Vercel Serverless] DB connection error:', error.message);
  }
  return app(req, res);
}
