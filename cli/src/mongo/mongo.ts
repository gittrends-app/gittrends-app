import env from '@/helpers/env.js';
import { MongoClient } from 'mongodb';

/**
 *  MongoDB client.
 */
export default new MongoClient(env.DATABASE_URL);
