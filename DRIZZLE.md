# DRIZZLE.md - Drizzle ORM クイックリファレンス

---

## スキーマ定義

```typescript
import { pgTable, uuid, varchar, timestamp, date, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

// テーブル定義
export const patients = pgTable('patients', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  dateOfBirth: date('date_of_birth').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// リレーション
export const patientsRelations = relations(patients, ({ many }) => ({
  appointments: many(appointments),
}));

// 型推論
export type Patient = typeof patients.$inferSelect;
export type NewPatient = typeof patients.$inferInsert;

// Zodスキーマ自動生成
export const insertPatientSchema = createInsertSchema(patients);
export const selectPatientSchema = createSelectSchema(patients);
```

**ルール**:
- スキーマは機能ごとにファイル分割
- 全テーブルに `createdAt`, `updatedAt` 必須
- UUIDをPK、NOT NULL明示

---

## クライアント

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export function createDBClient(connectionString: string) {
  const client = postgres(connectionString, { max: 10 });
  return drizzle(client, { schema });
}

export type DBClient = ReturnType<typeof createDBClient>;
```

---

## クエリパターン

### 基本CRUD

```typescript
import { eq, and, like } from 'drizzle-orm';

// 取得
const patient = await db.query.patients.findFirst({
  where: eq(patients.id, id),
});

// リレーション込み取得（N+1回避）
const patientWithAppointments = await db.query.patients.findFirst({
  where: eq(patients.id, id),
  with: { appointments: true },
});

// 挿入
await db.insert(patients).values(data);

// 更新
await db.update(patients).set({ name: 'New Name' }).where(eq(patients.id, id));

// Upsert
await db.insert(patients).values(data).onConflictDoUpdate({
  target: patients.id,
  set: { name: data.name, updatedAt: new Date() },
});

// 削除
await db.delete(patients).where(eq(patients.id, id));
```

### 複数条件・ページネーション

```typescript
// 複数条件
const results = await db.query.patients.findMany({
  where: and(
    like(patients.name, `%${name}%`),
    eq(patients.isActive, true)
  ),
  orderBy: (p, { asc }) => [asc(p.name)],
});

// ページネーション
const data = await db.query.patients.findMany({
  limit: 10,
  offset: (page - 1) * 10,
});
const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(patients);
```

---

## トランザクション

```typescript
await db.transaction(async (tx) => {
  const [patient] = await tx.insert(patients).values(data).returning();
  await tx.insert(appointments).values({ patientId: patient.id, ... });
});
```

---

## マイグレーション

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/schema/*',
  out: './migrations',
  driver: 'pg',
  dbCredentials: { connectionString: process.env.DATABASE_URL! },
} satisfies Config;
```

```bash
pnpm drizzle-kit generate:pg  # マイグレーション生成
pnpm drizzle-kit push:pg      # 実行
pnpm drizzle-kit studio       # GUI確認
```

---

## リポジトリ実装

```typescript
export class DrizzlePatientRepository implements IPatientRepository {
  constructor(private readonly db: DBClient) {}

  async findById(id: PatientId): Promise<Patient | null> {
    const row = await this.db.query.patients.findFirst({
      where: eq(patients.id, id.value),
    });
    return row ? this.toDomain(row) : null;
  }

  async save(patient: Patient): Promise<void> {
    await this.db.insert(patients).values(this.toRow(patient))
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

## 禁止事項

| ❌ 禁止 | ✅ 代替 |
|--------|--------|
| N+1クエリ（ループ内でクエリ） | `with`でリレーション込み取得 |
| `any`型 | `$inferSelect`/`$inferInsert`で型推論 |
| 手動マイグレーション | `drizzle-kit generate` |
| 全カラム取得 | `select({ name: patients.name })` |

---

## テスト

```typescript
import { PostgreSqlContainer } from '@testcontainers/postgresql';

let container: StartedPostgreSqlContainer;
let db: DBClient;

beforeAll(async () => {
  container = await new PostgreSqlContainer().start();
  db = createDBClient(container.getConnectionString());
  await runMigrations(db);
}, 60000);

afterAll(() => container.stop());
beforeEach(() => db.delete(patients));
```
