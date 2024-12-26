export interface Cache {
  /**
   * Retrieves an item from the cache.
   * @param key The key of the item to retrieve.
   * @returns The cached item or null if not found.
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Stores an item in the cache.
   * @param key The key of the item to store.
   * @param value The value of the item to store.
   */
  set<T>(key: string, value: T): Promise<void>;

  /**
   * Removes an item from the cache.
   * @param key The key of the item to remove.
   */
  remove(key: string): Promise<void>;

  /**
   * Clears all items from the cache.
   */
  clear(): Promise<void>;
}
