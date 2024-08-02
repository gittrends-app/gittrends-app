import { StorageService, User } from '@/core/index.js';
import { AbstractTask } from '../helpers/task.js';

/**
 * Task to retrieve all resources from a repository.
 */
export class UserUpdater extends AbstractTask<User> {
  private idOrLogin: string | number;

  private service: StorageService;

  constructor(idOrName: string | number, params: { service: StorageService }) {
    super();
    this.idOrLogin = idOrName;
    this.service = params.service;
  }

  async execute(): Promise<void> {
    if (this.state === 'running') throw new Error('Task already running!');

    try {
      this.state = 'running';

      const user = await this.service.user(this.idOrLogin);
      if (!user) throw new Error('User not found!');

      this.notify(user);

      this.state = 'completed';
    } catch (error) {
      this.state = 'error';
      this.notify(error instanceof Error ? error : new Error(JSON.stringify(error)));
      throw error;
    }
  }
}
