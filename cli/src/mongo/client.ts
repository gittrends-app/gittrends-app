import env from '@/helpers/env.js';
import { MongoClient } from 'mongodb';

export default new MongoClient(env.MONGO_URL);
