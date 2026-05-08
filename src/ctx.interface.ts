export interface CtxModuleOptions {
  /**
   * Header key to extract as correlation ID.
   * @default 'x-correlation-id'
   */
  correlationIdHeader?: string;
}

export interface ICtx {
  correlationId: string;
  [key: string]: any;
}
