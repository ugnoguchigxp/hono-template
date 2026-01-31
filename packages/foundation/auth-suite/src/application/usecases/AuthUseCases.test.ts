import { describe, it, expect, beforeEach } from 'vitest';
import { RegisterUserUseCase } from '@foundation/auth-suite/application/usecases/RegisterUserUseCase.js';
import { LoginUseCase } from '@foundation/auth-suite/application/usecases/LoginUseCase.js';
import { User } from '@foundation/auth-suite/domain/entities/User.js';
import { Session } from '@foundation/auth-suite/domain/entities/Session.js';

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
  generate: vi.fn(),
  verify: vi.fn(),
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

    mockUserRepo.existsByEmail.mockResolvedValue(false);
    mockPasswordHasher.hash.mockResolvedValue('hashed_password');
    mockUserRepo.save.mockImplementation((user: User) => user);

    const result = await useCase.execute(userData);

    expect(result).toBeInstanceOf(User);
    expect(result.getEmail()).toBe(userData.email);
    expect(result.getFirstName()).toBe(userData.firstName);
    expect(mockUserRepo.existsByEmail).toHaveBeenCalledWith(userData.email);
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

    mockUserRepo.existsByEmail.mockResolvedValue(true);

    await expect(useCase.execute(userData)).rejects.toThrow('Email already exists');
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
      mockAuditLogger
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
      token: 'session-token',
      userId: mockUser.getId(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    mockUserRepo.findByEmail.mockResolvedValue(mockUser);
    mockPasswordHasher.verify.mockResolvedValue(true);
    mockTokenGenerator.generate.mockResolvedValue('session-token');
    mockSessionStore.save.mockResolvedValue(mockSession);

    const result = await useCase.execute(loginData);

    expect(result.user).toBe(mockUser);
    expect(result.session).toBe(mockSession);
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
