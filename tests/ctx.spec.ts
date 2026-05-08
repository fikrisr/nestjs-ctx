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
});
