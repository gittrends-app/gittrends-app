import { ObservableLike, Observer, Unsubscribable } from 'type-fest';

export interface Task<T = unknown> extends ObservableLike<T> {
  state: 'pending' | 'running' | 'completed' | 'error';
  execute(): Promise<void>;
}

/**
 * Abstract class for tasks.
 */
export abstract class AbstractTask<T = unknown> implements Task<T> {
  state: 'pending' | 'running' | 'completed' | 'error' = 'pending';

  private observers: (Partial<Observer<T>> | undefined)[] = [];

  subscribe(observer: Partial<Observer<T>>): Unsubscribable {
    const index = this.observers.push(observer) - 1;
    return { unsubscribe: () => (this.observers[index] = undefined) };
  }

  protected notify(data: T | Error): void {
    if (typeof data === 'number') {
      if (data === 1) this.complete();
      this.observers.forEach((observer) => observer?.next?.(data));
    } else if (data instanceof Error) {
      this.observers.forEach((observer) => observer?.error?.(data));
    } else {
      this.observers.forEach((observer) => observer?.next?.(data));
    }
  }

  protected complete(): void {
    this.observers.forEach((observer) => observer?.complete?.());
  }

  [Symbol.observable](): ObservableLike<T> {
    return this;
  }

  abstract execute(): Promise<void>;
}
