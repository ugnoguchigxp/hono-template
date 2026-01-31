# ベストプラクティス実装例集

このドキュメントは、プロジェクトで使用する各技術スタックの詳細な実装例を提供します。

**参照元**: `CLAUDE.md` から詳細な実装例を移動

---

## 目次

1. [Zod実装パターン](#1-zod実装パターン)
2. [satisfies パターン](#2-satisfies-パターン)
3. [OpenAPI統合](#3-openapi統合)
4. [Exhaustiveness（網羅性チェック）](#4-exhaustiveness網羅性チェック)
5. [フロントエンド実装](#5-フロントエンド実装)
6. [ドメイン層実装](#6-ドメイン層実装)
7. [アダプター層実装](#7-アダプター層実装)
8. [エラーハンドリング](#8-エラーハンドリング)
9. [テスト実装](#9-テスト実装)

---

## 1. Zod実装パターン

### 1.1 基本パターン

```typescript
import { z } from 'zod';

// Zodスキーマを定義
export const PatientSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  dateOfBirth: z.string().date(),
  email: z.string().email().optional(),
});

// TypeScript型を導出
export type Patient = z.infer<typeof PatientSchema>;

// 使用例
function createPatient(data: unknown): Patient {
  return PatientSchema.parse(data);
}
```

### 1.2 境界でのバリデーション

```typescript
// HTTPリクエスト → ドメインへの境界
export const createPatientHandler = async (c: Context) => {
  const body = CreatePatientRequestSchema.parse(await c.req.json());
  const result = await usecase.execute(body);
  return c.json(result, 201);
};

// DB → ドメインへの境界
class DrizzlePatientRepository {
  private toDomain(row: typeof patients.$inferSelect): Patient {
    return Patient.reconstruct({
      id: PatientId.create(row.id),
      name: row.name,
      dateOfBirth: new Date(row.dateOfBirth),
    });
  }
}
```

---

## 2. satisfies パターン

### 2.1 型安全な定数定義

```typescript
// 型推論を保ちつつ型チェック
const CONFIG = {
  database: {
    host: 'localhost',
    port: 5432,
  },
  api: {
    timeout: 30000,
  },
} satisfies Config;

// Enum的な使い方
const STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const satisfies Record<string, string>;

type Status = typeof STATUS[keyof typeof STATUS];
```

### 2.2 ルート定義での使用

```typescript
const routeDefinition = {
  method: 'POST',
  path: '/patients',
  requestSchema: CreatePatientRequestSchema,
  responseSchema: PatientResponseSchema,
  auth: true,
} satisfies RouteDefinition;
```

---

## 3. OpenAPI統合

### 3.1 Zodから自動生成

```typescript
import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { z } from 'zod';

const CreatePatientSchema = z.object({
  name: z.string().min(1).openapi({ example: 'John Doe' }),
  dateOfBirth: z.string().date().openapi({ example: '1990-01-01' }),
});

const PatientResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  dateOfBirth: z.string(),
}).openapi('Patient');

const route = createRoute({
  method: 'post',
  path: '/patients',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreatePatientSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: PatientResponseSchema,
        },
      },
      description: 'Patient created successfully',
    },
  },
  tags: ['Patients'],
});

app.openapi(route, async (c) => {
  const body = c.req.valid('json');
  // ...
});
```

### 3.2 OpenAPIメタデータ

```typescript
const PatientSchema = z.object({
  id: z.string().uuid().openapi({
    description: '患者の一意識別子',
    example: '123e4567-e89b-12d3-a456-426614174000',
  }),
  name: z.string().min(1).max(100).openapi({
    description: '患者の氏名',
    example: '山田太郎',
  }),
});
```

---

## 4. Exhaustiveness（網羅性チェック）

### 4.1 Switch文の網羅性

```typescript
type Status = 'pending' | 'approved' | 'rejected';

function handleStatus(status: Status): string {
  switch (status) {
    case 'pending':
      return '保留中';
    case 'approved':
      return '承認済み';
    case 'rejected':
      return '却下';
    default:
      const _exhaustive: never = status;
      throw new Error(`Unhandled status: ${_exhaustive}`);
  }
}
```

### 4.2 Union型の網羅性

```typescript
type Result<T, E> = 
  | { success: true; data: T }
  | { success: false; error: E };

function handleResult<T, E>(result: Result<T, E>): void {
  if (result.success) {
    console.log(result.data);
  } else {
    console.error(result.error);
  }
}
```

### 4.3 エラーハンドリングの網羅性

```typescript
function handleError(error: AppError): ErrorResponse {
  if (error instanceof DomainError) {
    return { status: 400, message: error.message };
  }
  if (error instanceof AuthError) {
    return { status: 401, message: error.message };
  }
  if (error instanceof ValidationError) {
    return { status: 422, message: error.message };
  }
  if (error instanceof InfraError) {
    return { status: 500, message: 'Internal server error' };
  }
  
  const _exhaustive: never = error;
  return { status: 500, message: 'Unknown error' };
}
```

---

## 5. フロントエンド実装

### 5.1 デザインシステム (gxp-designSystem)

```typescript
import { Button, Input, Dialog, Select } from 'gxp-designSystem';
import { Card, CardHeader, CardContent } from 'gxp-designSystem';

function PatientForm() {
  return (
    <Card>
      <CardHeader>
        <h2>患者登録</h2>
      </CardHeader>
      <CardContent>
        <Input placeholder="氏名" />
        <Button>登録</Button>
      </CardContent>
    </Card>
  );
}
```

### 5.2 TanStack Query

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const PatientSchema = z.object({
  id: z.string(),
  name: z.string(),
  dateOfBirth: z.string(),
});

async function fetchPatient(id: string) {
  const response = await fetch(`/api/patients/${id}`);
  const data = await response.json();
  return PatientSchema.parse(data);
}

function usePatient(id: string) {
  return useQuery({
    queryKey: ['patient', id],
    queryFn: () => fetchPatient(id),
    staleTime: 5 * 60 * 1000,
  });
}

function useCreatePatient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreatePatientInput) => {
      const response = await fetch('/api/patients', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return PatientSchema.parse(await response.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}
```

### 5.3 TanStack Router

```typescript
import { createRoute } from '@tanstack/react-router';

const patientParamsSchema = z.object({
  patientId: z.string().uuid(),
});

const patientRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/patients/$patientId',
  validateSearch: z.object({
    tab: z.enum(['overview', 'history']).optional(),
  }),
  loader: async ({ params }) => {
    const { patientId } = patientParamsSchema.parse(params);
    return fetchPatient(patientId);
  },
});
```

### 5.4 TanStack Table

```typescript
import { createColumnHelper, useReactTable, getCoreRowModel } from '@tanstack/react-table';

type Patient = z.infer<typeof PatientSchema>;

const columnHelper = createColumnHelper<Patient>();

const columns = [
  columnHelper.accessor('name', {
    header: '氏名',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('dateOfBirth', {
    header: '生年月日',
    cell: (info) => new Date(info.getValue()).toLocaleDateString('ja-JP'),
  }),
];

function PatientTable({ data }: { data: Patient[] }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  
  // レンダリング...
}
```

### 5.5 React Hook Form - 基本

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const CreatePatientFormSchema = z.object({
  name: z.string().min(1, '氏名は必須です'),
  dateOfBirth: z.string().date(),
  email: z.string().email().optional(),
});

type CreatePatientFormInput = z.infer<typeof CreatePatientFormSchema>;

function CreatePatientForm() {
  const queryClient = useQueryClient();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreatePatientFormInput>({
    resolver: zodResolver(CreatePatientFormSchema),
    defaultValues: {
      name: '',
      dateOfBirth: '',
      email: '',
    },
  });
  
  const mutation = useMutation({
    mutationFn: async (data: CreatePatientFormInput) => {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create patient');
      return PatientResponseSchema.parse(await response.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      reset();
    },
  });
  
  const onSubmit = handleSubmit((data) => {
    mutation.mutate(data);
  });
  
  return (
    <form onSubmit={onSubmit}>
      <div>
        <label htmlFor="name">氏名</label>
        <input
          id="name"
          {...register('name')}
          aria-invalid={errors.name ? 'true' : 'false'}
        />
        {errors.name && <span role="alert">{errors.name.message}</span>}
      </div>
      
      <button type="submit" disabled={isSubmitting || mutation.isPending}>
        {mutation.isPending ? '登録中...' : '登録'}
      </button>
      
      {mutation.isError && <div role="alert">エラーが発生しました</div>}
    </form>
  );
}
```

### 5.6 React Hook Form - ネストしたフォーム

```typescript
const AddressSchema = z.object({
  postalCode: z.string().regex(/^\d{3}-?\d{4}$/, '郵便番号の形式が正しくありません'),
  prefecture: z.string().min(1),
  city: z.string().min(1),
  street: z.string().min(1),
});

const PatientWithAddressSchema = z.object({
  name: z.string().min(1),
  dateOfBirth: z.string().date(),
  address: AddressSchema,
});

type PatientWithAddressInput = z.infer<typeof PatientWithAddressSchema>;

function PatientWithAddressForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<PatientWithAddressInput>({
    resolver: zodResolver(PatientWithAddressSchema),
  });
  
  return (
    <form onSubmit={handleSubmit((data) => console.log(data))}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
      
      <input {...register('address.postalCode')} />
      {errors.address?.postalCode && <span>{errors.address.postalCode.message}</span>}
      
      <input {...register('address.prefecture')} />
      {errors.address?.prefecture && <span>{errors.address.prefecture.message}</span>}
      
      <button type="submit">登録</button>
    </form>
  );
}
```

### 5.7 React Hook Form - 配列フィールド

```typescript
import { useForm, useFieldArray } from 'react-hook-form';

const PatientWithContactsSchema = z.object({
  name: z.string().min(1),
  contacts: z.array(
    z.object({
      type: z.enum(['phone', 'email']),
      value: z.string().min(1),
    })
  ).min(1, '最低1つの連絡先が必要です'),
});

type PatientWithContactsInput = z.infer<typeof PatientWithContactsSchema>;

function PatientWithContactsForm() {
  const { register, control, handleSubmit, formState: { errors } } = useForm<PatientWithContactsInput>({
    resolver: zodResolver(PatientWithContactsSchema),
    defaultValues: {
      name: '',
      contacts: [{ type: 'phone', value: '' }],
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'contacts',
  });
  
  return (
    <form onSubmit={handleSubmit((data) => console.log(data))}>
      <input {...register('name')} />
      
      {fields.map((field, index) => (
        <div key={field.id}>
          <select {...register(`contacts.${index}.type`)}>
            <option value="phone">電話</option>
            <option value="email">メール</option>
          </select>
          
          <input {...register(`contacts.${index}.value`)} />
          
          <button type="button" onClick={() => remove(index)}>削除</button>
        </div>
      ))}
      
      <button type="button" onClick={() => append({ type: 'phone', value: '' })}>
        連絡先を追加
      </button>
      
      {errors.contacts && <span>{errors.contacts.message}</span>}
      
      <button type="submit">登録</button>
    </form>
  );
}
```

---

## 6. ドメイン層実装

### 6.1 値オブジェクト

```typescript
export class PatientId {
  private readonly _value: string;
  
  private constructor(value: string) {
    this._value = value;
  }
  
  static create(value: string): PatientId {
    if (!value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      throw new ValidationError('Invalid patient ID format');
    }
    return new PatientId(value);
  }
  
  static generate(): PatientId {
    return new PatientId(crypto.randomUUID());
  }
  
  get value(): string {
    return this._value;
  }
  
  equals(other: PatientId): boolean {
    return this._value === other._value;
  }
}
```

### 6.2 エンティティ

```typescript
export class Patient {
  private constructor(
    private readonly _id: PatientId,
    private _name: string,
    private readonly _dateOfBirth: Date,
  ) {}
  
  static create(props: {
    name: string;
    dateOfBirth: Date;
  }): Patient {
    return new Patient(
      PatientId.generate(),
      props.name,
      props.dateOfBirth,
    );
  }
  
  static reconstruct(props: {
    id: PatientId;
    name: string;
    dateOfBirth: Date;
  }): Patient {
    return new Patient(props.id, props.name, props.dateOfBirth);
  }
  
  get id(): PatientId {
    return this._id;
  }
  
  get name(): string {
    return this._name;
  }
  
  updateName(name: string): void {
    if (name.length === 0) {
      throw new DomainError('Name cannot be empty');
    }
    this._name = name;
  }
  
  getAge(): number {
    const today = new Date();
    let age = today.getFullYear() - this._dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - this._dateOfBirth.getMonth();
    
    // 誕生日をまだ迎えていない場合は1歳引く
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < this._dateOfBirth.getDate())) {
      age--;
    }
    
    return age;
  }
}
```

### 6.3 ユースケース

```typescript
const RegisterPatientInputSchema = z.object({
  name: z.string().min(1),
  dateOfBirth: z.string().date(),
  actorId: z.string().uuid(),
});

type RegisterPatientInput = z.infer<typeof RegisterPatientInputSchema>;

const RegisterPatientOutputSchema = z.object({
  patientId: z.string().uuid(),
});

type RegisterPatientOutput = z.infer<typeof RegisterPatientOutputSchema>;

export class RegisterPatientUseCase {
  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly logger: Logger,
  ) {}
  
  async execute(input: RegisterPatientInput): Promise<RegisterPatientOutput> {
    this.logger.info('Registering patient', { actorId: input.actorId });
    
    const patient = Patient.create({
      name: input.name,
      dateOfBirth: new Date(input.dateOfBirth),
    });
    
    await this.patientRepository.save(patient);
    
    return {
      patientId: patient.id.value,
    };
  }
}
```

### 6.4 Ports（リポジトリインターフェース）

```typescript
export interface IPatientRepository {
  findById(id: PatientId): Promise<Patient | null>;
  findByMedicalRecordNumber(mrn: string): Promise<Patient | null>;
  save(patient: Patient): Promise<void>;
  delete(id: PatientId): Promise<void>;
}

export interface INotificationService {
  sendWelcomeEmail(patientId: PatientId): Promise<void>;
}
```

---

## 7. アダプター層実装

### 7.1 HTTPハンドラー

```typescript
import { Context } from 'hono';

const CreatePatientRequestSchema = z.object({
  name: z.string().min(1),
  dateOfBirth: z.string().date(),
});

const PatientResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  dateOfBirth: z.string(),
});

export function createPatientHandler(
  registerPatientUseCase: RegisterPatientUseCase
) {
  return async (c: Context) => {
    const body = CreatePatientRequestSchema.parse(await c.req.json());
    const ctx = c.get('requestContext') as RequestContext;
    
    if (!ctx.actorId) {
      throw new AuthError('Actor ID is required');
    }
    
    const result = await registerPatientUseCase.execute({
      ...body,
      actorId: ctx.actorId,
    });
    
    return c.json(
      PatientResponseSchema.parse({
        id: result.patientId,
        name: body.name,
        dateOfBirth: body.dateOfBirth,
      }),
      201
    );
  };
}
```

### 7.2 DBリポジトリ実装（Drizzle ORM）

**詳細は `DRIZZLE.md` を参照**

```typescript
import { eq } from 'drizzle-orm';
import { DBClient } from '@foundation/db';
import { patients } from '@foundation/db/schema';

export class DrizzlePatientRepository implements IPatientRepository {
  constructor(private readonly db: DBClient) {}
  
  async findById(id: PatientId): Promise<Patient | null> {
    const result = await this.db.query.patients.findFirst({
      where: eq(patients.id, id.value),
    });
    
    if (!result) return null;
    return this.toDomain(result);
  }
  
  async save(patient: Patient): Promise<void> {
    await this.db
      .insert(patients)
      .values(this.toRow(patient))
      .onConflictDoUpdate({
        target: patients.id,
        set: { name: patient.name, updatedAt: new Date() },
      });
  }
  
  private toDomain(row: typeof patients.$inferSelect): Patient {
    return Patient.reconstruct({
      id: PatientId.create(row.id),
      name: row.name,
      dateOfBirth: new Date(row.dateOfBirth),
    });
  }
  
  private toRow(patient: Patient): typeof patients.$inferInsert {
    return {
      id: patient.id.value,
      name: patient.name,
      dateOfBirth: patient.dateOfBirth.toISOString().split('T')[0],
    };
  }
}
```

---

## 8. エラーハンドリング

### 8.1 エラー階層

```typescript
export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  
  constructor(
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class DomainError extends AppError {
  readonly code = 'DOMAIN_ERROR';
  readonly statusCode = 400;
}

export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 422;
}

export class AuthError extends AppError {
  readonly code = 'AUTH_ERROR';
  readonly statusCode = 401;
}

export class NotFoundError extends AppError {
  readonly code = 'NOT_FOUND';
  readonly statusCode = 404;
}

export class InfraError extends AppError {
  readonly code = 'INFRA_ERROR';
  readonly statusCode = 500;
}
```

### 8.2 エラーハンドリングミドルウェア

```typescript
import { Context, Next } from 'hono';
import { ZodError } from 'zod';

export function errorHandler() {
  return async (c: Context, next: Next) => {
    try {
      await next();
    } catch (error) {
      if (error instanceof ZodError) {
        return c.json(
          {
            error: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors,
          },
          422
        );
      }
      
      if (error instanceof AppError) {
        return c.json(
          {
            error: error.code,
            message: error.message,
            details: error.details,
          },
          error.statusCode
        );
      }
      
      console.error('Unexpected error:', error);
      return c.json(
        {
          error: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
        500
      );
    }
  };
}
```

---

## 9. テスト実装

### 9.1 ユニットテスト（ドメイン/ユースケース）

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('RegisterPatientUseCase', () => {
  let usecase: RegisterPatientUseCase;
  let fakeRepo: FakePatientRepository;
  let fakeLogger: FakeLogger;
  
  beforeEach(() => {
    fakeRepo = new FakePatientRepository();
    fakeLogger = new FakeLogger();
    usecase = new RegisterPatientUseCase(fakeRepo, fakeLogger);
  });
  
  it('新規患者を登録できる', async () => {
    const input = {
      name: 'John Doe',
      dateOfBirth: '1990-01-01',
      actorId: crypto.randomUUID(),
    };
    
    const result = await usecase.execute(input);
    
    expect(result.patientId).toBeDefined();
    expect(fakeRepo.patients).toHaveLength(1);
    expect(fakeRepo.patients[0]?.name).toBe('John Doe');
  });
  
  it('無効な名前で登録を拒否する', async () => {
    // 注意: 実際の実装では、入力バリデーションはZodスキーマで行うため、
    // このテストはZodErrorを投げるか、Patient.createでDomainErrorを投げる
    const input = {
      name: '',
      dateOfBirth: '1990-01-01',
      actorId: crypto.randomUUID(),
    };
    
    // Zodスキーマでmin(1)を設定している場合はZodError
    // Patient.create内で検証している場合はDomainError
    await expect(usecase.execute(input)).rejects.toThrow();
  });
});
```

### 9.2 Fake実装

```typescript
export class FakePatientRepository implements IPatientRepository {
  public patients: Patient[] = [];
  
  async findById(id: PatientId): Promise<Patient | null> {
    return this.patients.find(p => p.id.equals(id)) ?? null;
  }
  
  async findByMedicalRecordNumber(mrn: string): Promise<Patient | null> {
    return this.patients.find(p => p.medicalRecordNumber === mrn) ?? null;
  }
  
  async save(patient: Patient): Promise<void> {
    const index = this.patients.findIndex(p => p.id.equals(patient.id));
    if (index >= 0) {
      this.patients[index] = patient;
    } else {
      this.patients.push(patient);
    }
  }
  
  async delete(id: PatientId): Promise<void> {
    this.patients = this.patients.filter(p => !p.id.equals(id));
  }
  
  clear(): void {
    this.patients = [];
  }
}
```

### 9.3 統合テスト（Testcontainers）

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';

describe('DrizzlePatientRepository', () => {
  let container: StartedPostgreSqlContainer;
  let db: DBClient;
  let repo: DrizzlePatientRepository;
  
  beforeAll(async () => {
    container = await new PostgreSqlContainer().start();
    db = createDBClient(container.getConnectionString());
    await runMigrations(db);
    repo = new DrizzlePatientRepository(db);
  }, 60000);
  
  afterAll(async () => {
    await container.stop();
  });
  
  it('患者を永続化して取得できる', async () => {
    const patient = Patient.create({
      name: 'Test Patient',
      dateOfBirth: new Date('1990-01-01'),
    });
    
    await repo.save(patient);
    const found = await repo.findById(patient.id);
    
    expect(found).not.toBeNull();
    expect(found?.name).toBe('Test Patient');
  });
});
```

---

## まとめ

このドキュメントの実装例を参考に、プロジェクトの各層で一貫したパターンを使用してください。

詳細なルールは `CLAUDE.md` を、Drizzle ORM の詳細は `DRIZZLE.md` を参照してください。
