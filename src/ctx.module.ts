import { DynamicModule, Global, Module } from '@nestjs/common';
import { CtxStore } from './ctx-store';
import { CtxMiddleware } from './ctx.middleware';
import { CtxModuleOptions } from './ctx.interface';

@Global()
@Module({
  providers: [CtxStore, CtxMiddleware],
  exports: [CtxStore, CtxMiddleware],
})
export class CtxModule {
  static forRoot(options?: CtxModuleOptions): DynamicModule {
    return {
      module: CtxModule,
      providers: [
        {
          provide: 'CTX_OPTIONS',
          useValue: options || {},
        },
        CtxStore,
      ],
      exports: [CtxStore],
    };
  }
}
