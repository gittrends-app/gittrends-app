import get from './get.js';
import { resources } from './resources/index.js';

export const repos = { get, ...resources };
