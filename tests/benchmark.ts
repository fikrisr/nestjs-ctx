import { Test, TestingModule } from '@nestjs/testing';
import { Injectable, Scope } from '@nestjs/common';
import { CtxStore } from '../src/ctx-store';
import { performance } from 'node:perf_hooks';

// --- Scenario 1: Native Scope.REQUEST (Deep Tree) ---
@Injectable({ scope: Scope.REQUEST })
class Deep5 { getData() { return 'data'; } }

@Injectable({ scope: Scope.REQUEST })
class Deep4 { constructor(private readonly d: Deep5) {} execute() { return this.d.getData(); } }

@Injectable({ scope: Scope.REQUEST })
class Deep3 { constructor(private readonly d: Deep4) {} execute() { return this.d.execute(); } }

@Injectable({ scope: Scope.REQUEST })
class Deep2 { constructor(private readonly d: Deep3) {} execute() { return this.d.execute(); } }

@Injectable({ scope: Scope.REQUEST })
class Deep1 { constructor(private readonly d: Deep2) {} execute() { return this.d.execute(); } }

// --- Scenario 2: Singleton + CtxStore (Deep Tree) ---
@Injectable()
class SingletonDeep5 { getData() { return 'data'; } }

@Injectable()
class SingletonDeep4 { constructor(private readonly d: SingletonDeep5) {} execute() { return this.d.getData(); } }

@Injectable()
class SingletonDeep3 { constructor(private readonly d: SingletonDeep4) {} execute() { return this.d.execute(); } }

@Injectable()
class SingletonDeep2 { constructor(private readonly d: SingletonDeep3) {} execute() { return this.d.execute(); } }

@Injectable()
class SingletonDeep1 {
  constructor(
    private readonly d: SingletonDeep2,
    private readonly store: CtxStore<any>
  ) {}
  execute() {
    // Access store to simulate real usage
    this.store.getStore();
    return this.d.execute();
  }
}

async function runBenchmark() {
  const iterations = 1000000;
  const warmup = Math.floor(iterations * 0.1);

  console.log('--- 🚀 NestJS Context Benchmark (Maximal) ---');
  console.log(`Iterations: ${iterations.toLocaleString()}`);
  console.log(`Warmup:     ${warmup.toLocaleString()}`);
  console.log('--------------------------------------------\n');

  // Setup Module for Scenario 1
  const moduleRef1: TestingModule = await Test.createTestingModule({
    providers: [Deep1, Deep2, Deep3, Deep4, Deep5],
  }).compile();

  // Setup Module for Scenario 2
  const moduleRef2: TestingModule = await Test.createTestingModule({
    providers: [
      SingletonDeep1, SingletonDeep2, SingletonDeep3, SingletonDeep4, SingletonDeep5,
      CtxStore
    ],
  }).compile();

  const singletonService = moduleRef2.get(SingletonDeep1);
  const store = moduleRef2.get(CtxStore);

  // --- Warmup ---
  console.log('🔥 Warming up...');
  for (let i = 0; i < warmup; i++) {
    const contextId = { id: i };
    const dep = await moduleRef1.resolve(Deep1, contextId);
    dep.execute();
    store.run({ id: i }, () => {
      singletonService.execute();
    });
  }

  // --- Benchmark Scenario 1: Request Scope ---
  console.log('📊 Benchmarking Scope.REQUEST...');
  const start1 = performance.now();
  for (let i = 0; i < iterations; i++) {
    const contextId = { id: i };
    const dep = await moduleRef1.resolve(Deep1, contextId);
    dep.execute();
  }
  const end1 = performance.now();
  const time1 = end1 - start1;

  // --- Benchmark Scenario 2: nestjs-ctx ---
  console.log('📊 Benchmarking nestjs-ctx...');
  const start2 = performance.now();
  for (let i = 0; i < iterations; i++) {
    store.run({ id: i }, () => {
      singletonService.execute();
    });
  }
  const end2 = performance.now();
  const time2 = end2 - start2;

  // --- Results ---
  const ops1 = (iterations / time1 * 1000);
  const ops2 = (iterations / time2 * 1000);

  console.log('\n--- 🏆 Final Results ---');
  console.log(`Scope.REQUEST: ${time1.toFixed(2).padStart(10)}ms | ${ops1.toFixed(0).padStart(12)} ops/s`);
  console.log(`nestjs-ctx:    ${time2.toFixed(2).padStart(10)}ms | ${ops2.toFixed(0).padStart(12)} ops/s`);
  
  const improvement = time1 / time2;
  console.log('\n--------------------------------------------');
  console.log(`🚀 Performance Gain: ${improvement.toFixed(1)}x faster`);
  console.log('--------------------------------------------\n');
}

runBenchmark().catch(console.error);
