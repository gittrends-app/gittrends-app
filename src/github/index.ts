import { clients } from './clients.js';
import { repos } from './repository/index.js';
import { users } from './user/index.js';

import search from './search.js';

export const github = { repos, users, search, clients };
