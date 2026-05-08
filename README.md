# @fikrisr/nestjs-ctx

A high-performance, type-safe alternative to `Scope.REQUEST` in NestJS using `AsyncLocalStorage`.

## Why this library?

NestJS's `Scope.REQUEST` is powerful but comes with a performance cost:
1.  **Dependency Infection**: Making one service request-scoped makes everything that depends on it request-scoped, leading to a cascade of new instances per request.
2.  **Memory Overhead**: High memory usage due to constant object creation and garbage collection.

`@fikrisr/nestjs-ctx` uses Node.js's native `AsyncLocalStorage` to store context data without breaking the Singleton pattern of your services.

## Features

- **Singleton Safe**: Access request data inside Singleton services.
- **Type-Safe**: Full TypeScript support for your context data.
- **High Performance**: 60x+ faster than native `Scope.REQUEST` in high-concurrency scenarios.

## Benchmark Results

Running the included benchmark suite (`tests/benchmark.ts`) with a deep dependency tree (5 levels) and 1,000,000 iterations:

| Strategy | Time (ms) | Throughput (ops/s) |
| :--- | :--- | :--- |
| `Scope.REQUEST` | 14,912.25 | 67,059 |
| `nestjs-ctx` | 225.92 | 4,426,422 |

**Result**: `@fikrisr/nestjs-ctx` is **66.0x faster** than native request-scoped providers.

## Installation

```bash
npm install @fikrisr/nestjs-ctx
```

## Usage

### 1. Register the Module

```typescript
import { CtxModule } from '@fikrisr/nestjs-ctx';

@Module({
  imports: [
    CtxModule.forRoot(),
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CtxMiddleware).forRoutes('*');
  }
}
```

### 2. Define Your Context Type

```typescript
import { ICtx } from '@fikrisr/nestjs-ctx';

export interface MyContext extends ICtx {
  userId?: string;
  role?: string;
}
```

### 3. Set or Update Context
You can update the context anywhere in your application (Services, Guards, Interceptors).

```typescript
@Injectable()
export class AuthService {
  constructor(private readonly store: CtxStore<MyContext>) {}

  async validateUser(token: string) {
    const user = await this.verify(token);
    
    // Set data into context
    this.store.set('userId', user.id);
    this.store.set('role', user.role);
  }
}
```

### 4. Access Context in Services

```typescript
import { Injectable } from '@nestjs/common';
import { CtxStore } from '@fikrisr/nestjs-ctx';
import { MyContext } from './interfaces/my-context';

@Injectable()
export class MyService {
  constructor(private readonly store: CtxStore<MyContext>) {}

  doSomething() {
    const { correlationId, userId } = this.store.get();
    console.log(`Processing for user ${userId} with ID ${correlationId}`);
  }
}
```

## API Reference

### `CtxStore<T>`
- `run(context: T, callback: () => void)`: Starts a new context.
- `get(): T`: Returns the current context. Throws error if not in context.
- `getStore(): T | undefined`: Returns the current context or undefined.
- `set<K extends keyof T>(key: K, value: T[K])`: Updates a property in the current context object.

### `CtxMiddleware`
Automatically extracts `x-correlation-id` from headers or generates a new one, then wraps the request in a context.

## License

MIT
