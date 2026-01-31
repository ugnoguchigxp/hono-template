import type { ITokenGenerator } from '../application/ports.js';

export class CryptoTokenGenerator implements ITokenGenerator {
  private readonly tokenLength: number;

  constructor(tokenLength = 64) {
    this.tokenLength = tokenLength;
  }

  async generateToken(): Promise<string> {
    const array = new Uint8Array(this.tokenLength);
    crypto.getRandomValues(array);

    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  async verifyToken(token: string): Promise<boolean> {
    // For crypto-generated tokens, verification is just checking format
    const expectedLength = this.tokenLength * 2;
    const pattern = new RegExp(`^[a-f0-9]{${expectedLength}}$`);
    return pattern.test(token);
  }
}

export function createTokenGenerator(tokenLength?: number): ITokenGenerator {
  return new CryptoTokenGenerator(tokenLength);
}
