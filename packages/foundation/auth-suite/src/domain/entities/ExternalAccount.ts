import type { ExternalAccount as ExternalAccountType } from '../../contracts.js';

export class ExternalAccount {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly provider: string,
    public readonly externalId: string,
    public readonly email: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(data: {
    userId: string;
    provider: string;
    externalId: string;
    email?: string;
  }): ExternalAccount {
    return new ExternalAccount(
      crypto.randomUUID(),
      data.userId,
      data.provider,
      data.externalId,
      data.email ?? null,
      new Date(),
      new Date()
    );
  }

  static reconstruct(data: ExternalAccountType): ExternalAccount {
    return new ExternalAccount(
      data.id,
      data.userId,
      data.provider,
      data.externalId,
      data.email,
      data.createdAt,
      data.updatedAt
    );
  }

  getData(): ExternalAccountType {
    return {
      id: this.id,
      userId: this.userId,
      provider: this.provider,
      externalId: this.externalId,
      email: this.email,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
