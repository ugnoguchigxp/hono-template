import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DrizzleUserRepository } from '@adapters/db-drizzle/repositories/UserRepository.js';
import { User } from '@foundation/auth-suite/domain/entities/User.js';
import { PostgresClient } from '@foundation/db/client.js';

// Mock database client for testing
const createMockDBClient = () => ({
  query: {
    users: {
      findFirst: vi.fn(),
    },
  },
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
});

describe('DrizzleUserRepository', () => {
  let repository: DrizzleUserRepository;
  let mockDB: any;

  beforeEach(() => {
    mockDB = createMockDBClient();
    repository = new DrizzleUserRepository(mockDB);
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const userData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
      };

      mockDB.query.users.findFirst.mockResolvedValue(userData);

      const result = await repository.findById(userData.id);

      expect(result).toBeInstanceOf(User);
      expect(result!.getId()).toBe(userData.id);
      expect(result!.getEmail()).toBe(userData.email);
    });

    it('should return null when user not found', async () => {
      mockDB.query.users.findFirst.mockResolvedValue(null);

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return user when found', async () => {
      const userData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
      };

      mockDB.query.users.findFirst.mockResolvedValue(userData);

      const result = await repository.findByEmail(userData.email);

      expect(result).toBeInstanceOf(User);
      expect(result!.getEmail()).toBe(userData.email);
    });

    it('should return null when email not found', async () => {
      mockDB.query.users.findFirst.mockResolvedValue(null);

      const result = await repository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('should save new user', async () => {
      const user = User.create({
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        firstName: 'John',
        lastName: 'Doe',
      });

      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
      };
      mockDB.insert.mockReturnValue(mockInsert);

      const result = await repository.save(user);

      expect(mockDB.insert).toHaveBeenCalled();
      expect(result).toBe(user);
    });
  });

  describe('existsByEmail', () => {
    it('should return true when email exists', async () => {
      mockDB.query.users.findFirst.mockResolvedValue({ id: 'user-id' });

      const result = await repository.existsByEmail('test@example.com');

      expect(result).toBe(true);
    });

    it('should return false when email does not exist', async () => {
      mockDB.query.users.findFirst.mockResolvedValue(null);

      const result = await repository.existsByEmail('nonexistent@example.com');

      expect(result).toBe(false);
    });
  });
});
