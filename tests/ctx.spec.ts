import { CtxStore } from '../src/ctx-store';

describe('CtxStore', () => {
  let store: CtxStore<{ id: number }>;

  beforeEach(() => {
    store = new CtxStore();
  });

  it('should store and retrieve context', () => {
    const context = { id: 1 };
    store.run(context, () => {
      expect(store.get()).toBe(context);
    });
  });

  it('should update context value using set()', () => {
    const context = { id: 1 };
    store.run(context, () => {
      store.set('id', 2);
      expect(store.get().id).toBe(2);
      expect(context.id).toBe(2); // Should mutate the original object
    });
  });

  it('should throw error if get() called outside context', () => {
    expect(() => store.get()).toThrow();
  });

  it('should return undefined if getStore() called outside context', () => {
    expect(store.getStore()).toBeUndefined();
  });

  it('should maintain context across async operations', async () => {
    const context = { id: 1 };
    await new Promise<void>((resolve) => {
      store.run(context, async () => {
        await new Promise((r) => setTimeout(r, 10));
        expect(store.get()).toBe(context);
        resolve();
      });
    });
  });

  it('should handle high concurrency without race conditions', async () => {
    const iterations = 100;
    const tasks = Array.from({ length: iterations }).map((_, index) => {
      const context = { id: index };
      return new Promise<void>((resolve) => {
        // Random delay to shuffle execution order
        const delay = Math.random() * 50;
        setTimeout(() => {
          store.run(context, async () => {
            // Further async delay
            await new Promise((r) => setTimeout(r, Math.random() * 50));

            const current = store.get();
            if (current.id !== index) {
              throw new Error(`Race condition detected! Expected ${index}, got ${current.id}`);
            }
            resolve();
          });
        }, delay);
      });
    });

    await expect(Promise.all(tasks)).resolves.not.toThrow();
  });

  it('should ensure strict isolation between concurrent contexts', async () => {
    const runTask = (id: number) => {
      return new Promise<void>((resolve) => {
        store.run({ id }, async () => {
          // 1. Initial check
          expect(store.get().id).toBe(id);

          // 2. Wait to let other tasks start and potentially interfere
          await new Promise((r) => setTimeout(r, Math.random() * 30));

          // 3. Mutate context
          store.set('id', id * 10);

          // 4. Wait again
          await new Promise((r) => setTimeout(r, Math.random() * 30));

          // 5. Final check - should NOT be affected by other tasks' mutations
          expect(store.get().id).toBe(id * 10);
          resolve();
        });
      });
    };

    // Run multiple tasks concurrently
    await Promise.all([runTask(1), runTask(2), runTask(3), runTask(4), runTask(5)]);
  });
});
