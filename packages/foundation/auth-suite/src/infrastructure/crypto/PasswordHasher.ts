import * as argon2 from '@node-rs/argon2';
import type { IPasswordHasher } from '../application/ports.js';

export class Argon2PasswordHasher implements IPasswordHasher {
  async hash(password: string): Promise<string> {
    return await argon2.hash(password, {
      memoryCost: 65536,
      timeCost: 3,
      outputLen: 32,
      parallelism: 4,
    });
  }

  async verify(password: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }
}

export function createPasswordHasher(): IPasswordHasher {
  return new Argon2PasswordHasher();
}
