import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RegisterUserUseCase } from '@foundation/auth-suite/application/usecases/RegisterUserUseCase.js';
import { LoginUseCase } from '@foundation/auth-suite/application/usecases/LoginUseCase.js';
import { LogoutUseCase } from '@foundation/auth-suite/application/usecases/LogoutUseCase.js';
import { ValidateSessionUseCase } from '@foundation/auth-suite/application/usecases/ValidateSessionUseCase.js';
import { User } from '@foundation/auth-suite/domain/entities/User.js';
import { Session, SessionToken } from '@foundation/auth-suite/domain/entities/Session.js';

// Mock implementations
const createMockUserRepository = () => ({
  findById: vi.fn(),
  findByEmail: vi.fn(),
  save: vi.fn(),
  existsByEmail: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
});

const createMockSessionStore = () => ({
  findByToken: vi.fn(),
  save: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  deleteByUserId: vi.fn(),
  deleteExpired: vi.fn(),
});

const createMockPasswordHasher = () => ({
  hash: vi.fn(),
  verify: vi.fn(),
});

const createMockTokenGenerator = () => ({
  generateToken: vi.fn(),
  verifyToken: vi.fn(),
});

const createMockAuditLogger = () => ({
  logUserLogin: vi.fn(),
  logUserLogout: vi.fn(),
  logUserRegistration: vi.fn(),
  logPasswordChange: vi.fn(),
  logFailedLogin: vi.fn(),
});

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let mockUserRepo: any;
  let mockPasswordHasher: any;
  let mockAuditLogger: any;

  beforeEach(() => {
    mockUserRepo = createMockUserRepository();
    mockPasswordHasher = createMockPasswordHasher();
    mockAuditLogger = createMockAuditLogger();
    
    useCase = new RegisterUserUseCase(mockUserRepo, mockPasswordHasher, mockAuditLogger);
  });

  it('should register a new user successfully', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    };

    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockPasswordHasher.hash.mockResolvedValue('hashed_password');
    mockUserRepo.save.mockImplementation((user: User) => user);

    const result = await useCase.execute(userData);

    expect(result.user).toBeInstanceOf(User);
    expect(result.user.getEmail()).toBe(userData.email);
    expect(result.user.getFirstName()).toBe(userData.firstName);
    expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(userData.email);
    expect(mockPasswordHasher.hash).toHaveBeenCalledWith(userData.password);
    expect(mockUserRepo.save).toHaveBeenCalled();
    expect(mockAuditLogger.logUserRegistration).toHaveBeenCalled();
  });

  it('should throw error if email already exists', async () => {
    const userData = {
      email: 'existing@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    };

    mockUserRepo.findByEmail.mockResolvedValue(
      User.create({
        id: 'user-id',
        email: userData.email,
        passwordHash: 'hashed_password',
        firstName: 'John',
        lastName: 'Doe',
      })
    );

    await expect(useCase.execute(userData)).rejects.toThrow('User with this email already exists');
    expect(mockUserRepo.save).not.toHaveBeenCalled();
  });
});

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let mockUserRepo: any;
  let mockSessionStore: any;
  let mockPasswordHasher: any;
  let mockTokenGenerator: any;
  let mockAuditLogger: any;

  beforeEach(() => {
    mockUserRepo = createMockUserRepository();
    mockSessionStore = createMockSessionStore();
    mockPasswordHasher = createMockPasswordHasher();
    mockTokenGenerator = createMockTokenGenerator();
    mockAuditLogger = createMockAuditLogger();
    
    useCase = new LoginUseCase(
      mockUserRepo,
      mockSessionStore,
      mockPasswordHasher,
      mockTokenGenerator,
      mockAuditLogger,
      60 * 60 * 24
    );
  });

  it('should login user successfully', async () => {
    const loginData = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockUser = User.create({
      id: 'user-id',
      email: loginData.email,
      passwordHash: 'hashed_password',
      firstName: 'John',
      lastName: 'Doe',
    });

    const mockSession = Session.create({
      id: 'session-id',
      token: SessionToken.create('session-token'),
      userId: mockUser.getId(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockPasswordHasher.verify.mockResolvedValue(true);
    mockTokenGenerator.generateToken.mockResolvedValue('session-token');
    mockSessionStore.save.mockResolvedValue(mockSession);

    const result = await useCase.execute(loginData);

    expect(result.user.getId()).toBe(mockUser.getId());
    expect(result.user.getLastLoginAt()).toBeDefined();
    expect(result.session.getData().id).toBe(mockSession.getData().id);
    expect(mockAuditLogger.logUserLogin).toHaveBeenCalled();
  });

  it('should throw error for invalid credentials', async () => {
    const loginData = {
      email: 'test@example.com',
      password: 'wrong-password',
    };

    const mockUser = User.create({
      id: 'user-id',
      email: loginData.email,
      passwordHash: 'hashed_password',
      firstName: 'John',
      lastName: 'Doe',
    });

    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockPasswordHasher.verify.mockResolvedValue(false);

    await expect(useCase.execute(loginData)).rejects.toThrow('Invalid credentials');
    expect(mockAuditLogger.logFailedLogin).toHaveBeenCalled();
  });

  it('should throw error if user not found', async () => {
    const loginData = {
      email: 'nonexistent@example.com',
      password: 'password123',
    };

    mockUserRepo.findByEmail.mockResolvedValue(null);

    await expect(useCase.execute(loginData)).rejects.toThrow('Invalid credentials');
    expect(mockAuditLogger.logFailedLogin).toHaveBeenCalled();
  });
});

describe('LogoutUseCase', () => {
  let useCase: LogoutUseCase;
  let mockSessionStore: any;
  let mockAuditLogger: any;

  beforeEach(() => {
    mockSessionStore = createMockSessionStore();
    mockAuditLogger = createMockAuditLogger();
    useCase = new LogoutUseCase(mockSessionStore, mockAuditLogger);
  });

  it('should logout user successfully using token raw value', async () => {
    const token = 'valid-token';
    const mockSession = { getData: () => ({ id: 's1', userId: 'u1' }) };
    mockSessionStore.findByToken.mockResolvedValue(mockSession);

    await useCase.execute({ token });

    expect(mockSessionStore.delete).toHaveBeenCalledWith(token);
    expect(mockAuditLogger.logUserLogout).toHaveBeenCalled();
  });

  it('should do nothing if session not found', async () => {
    mockSessionStore.findByToken.mockResolvedValue(null);
    await useCase.execute({ token: 'none' });
    expect(mockSessionStore.delete).not.toHaveBeenCalled();
  });
});

describe('ValidateSessionUseCase', () => {
  let useCase: ValidateSessionUseCase;
  let mockSessionStore: any;
  let mockUserRepo: any;
  let mockTokenGenerator: any;

  beforeEach(() => {
    mockSessionStore = createMockSessionStore();
    mockUserRepo = createMockUserRepository();
    mockTokenGenerator = createMockTokenGenerator();
    useCase = new ValidateSessionUseCase(mockSessionStore, mockUserRepo, mockTokenGenerator);
  });

  it('should validate a valid session', async () => {
    const token = 'valid-token';
    const userId = 'user-123';
    const mockUser = User.create({ id: userId, email: 't@e.com', passwordHash: 'h', firstName: 'F', lastName: 'L' });
    const mockSession = Session.reconstruct({
      id: 's1',
      token,
      userId,
      expiresAt: new Date(Date.now() + 10000),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockTokenGenerator.verifyToken.mockResolvedValue(true);
    mockSessionStore.findByToken.mockResolvedValue(mockSession);
    mockUserRepo.findById.mockResolvedValue(mockUser);

    const result = await useCase.execute({ token });

    expect(result.user.getId()).toBe(mockUser.getId());
    expect(result.session.getData().id).toBe(mockSession.getData().id);
  });

  it('should throw AuthError for invalid token', async () => {
    mockTokenGenerator.verifyToken.mockResolvedValue(false);
    await expect(useCase.execute({ token: 'bad' })).rejects.toThrow('Invalid session token');
  });

  it('should throw AuthError for expired session and delete it', async () => {
    const token = 'expired-token';
    const mockSession = Session.reconstruct({
      id: 's1',
      token,
      userId: 'u1',
      expiresAt: new Date(Date.now() - 10000),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockTokenGenerator.verifyToken.mockResolvedValue(true);
    mockSessionStore.findByToken.mockResolvedValue(mockSession);

    await expect(useCase.execute({ token })).rejects.toThrow('Session expired or invalid');
    expect(mockSessionStore.delete).toHaveBeenCalledWith(token);
  });
});
