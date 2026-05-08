import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CtxStore<T = any> {
  private readonly asyncLocalStorage = new AsyncLocalStorage<T>();

  /**
   * Runs a callback within a context.
   * @param context The context data to store.
   * @param callback The function to execute.
   */
  run(context: T, callback: () => void): void {
    this.asyncLocalStorage.run(context, callback);
  }

  /**
   * Retrieves the current context.
   * Throws an error if called outside of a context.
   */
  get(): T {
    const store = this.asyncLocalStorage.getStore();
    if (!store) {
      throw new Error(
        'CtxStore: No context found. Ensure you are running within CtxMiddleware or store.run().',
      );
    }
    return store;
  }

  /**
   * Retrieves the current context, or undefined if not set.
   */
  getStore(): T | undefined {
    return this.asyncLocalStorage.getStore();
  }
}
