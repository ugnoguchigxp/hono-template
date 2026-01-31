import type { RequestContext } from '../types.js';

export class RequestContextBuilder {
  private data: Partial<RequestContext> = {};

  withRequestId(requestId: string): this {
    (this.data as any).requestId = requestId;
    return this;
  }

  withActorId(actorId: string | null): this {
    (this.data as any).actorId = actorId;
    return this;
  }

  withTenantId(tenantId: string | null): this {
    (this.data as any).tenantId = tenantId;
    return this;
  }

  withTraceId(traceId: string): this {
    (this.data as any).traceId = traceId;
    return this;
  }

  withTimestamp(timestamp: Date = new Date()): this {
    (this.data as any).timestamp = timestamp;
    return this;
  }

  build(): RequestContext {
    if (!this.data.requestId) {
      throw new Error('requestId is required');
    }
    if (!this.data.traceId) {
      throw new Error('traceId is required');
    }
    if (!this.data.timestamp) {
      throw new Error('timestamp is required');
    }

    return {
      requestId: this.data.requestId,
      actorId: this.data.actorId ?? null,
      tenantId: this.data.tenantId ?? null,
      traceId: this.data.traceId,
      timestamp: this.data.timestamp,
    };
  }

  static create(): RequestContextBuilder {
    return new RequestContextBuilder();
  }

  static fromPartial(partial: Partial<RequestContext>): RequestContextBuilder {
    const builder = new RequestContextBuilder();
    (builder.data as any) = { ...partial };
    return builder;
  }
}

export function createRequestContext(
  requestId: string,
  traceId?: string,
  actorId?: string | null,
  tenantId?: string | null,
  timestamp?: Date
): RequestContext {
  return RequestContextBuilder.create()
    .withRequestId(requestId)
    .withTraceId(traceId ?? requestId)
    .withActorId(actorId ?? null)
    .withTenantId(tenantId ?? null)
    .withTimestamp(timestamp ?? new Date())
    .build();
}
