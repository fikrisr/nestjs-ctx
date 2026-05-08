import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CtxStore } from './ctx-store';
import { ICtx } from './ctx.interface';
import { randomUUID } from 'node:crypto';

@Injectable()
export class CtxMiddleware implements NestMiddleware {
  constructor(private readonly store: CtxStore<ICtx>) {}

  use(req: Request, res: Response, next: NextFunction) {
    const correlationId = (req.headers['x-correlation-id'] as string) || randomUUID();

    // Set header for response if not present
    if (!res.getHeader('x-correlation-id')) {
      res.setHeader('x-correlation-id', correlationId);
    }

    const context: ICtx = {
      correlationId,
    };

    this.store.run(context, () => {
      next();
    });
  }
}
