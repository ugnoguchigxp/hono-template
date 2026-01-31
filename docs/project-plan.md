# バックエンド・ファンデーション モノレポ プロジェクト計画書

Hono、Zod、ドメイン駆動設計を用いた、フレームワーク非依存のバックエンド基盤を持つクリーンアーキテクチャモノレポ。長期安定稼働、付け替え耐性、ユニットテスト容易性を最優先。

**主要リファレンス**:
- [CLAUDE.md](../CLAUDE.md): AI実装ルールと核心原則
- [BESTPRACTICE.md](../BESTPRACTICE.md): 実装例とベストプラクティス
- [DRIZZLE.md](../DRIZZLE.md): Drizzle ORMの使用方法

---


## 1. プロジェクト概要

### 核となる原則
- **フレームワーク非依存**: Hono依存を最小化し、薄いHTTPカーネルとして扱う
- **クリーンアーキテクチャ**: ドメインロジックをインフラから完全分離
- **Zodを唯一の真実**: すべての契約、DTO、バリデーションにZodを使用
- **テストファースト設計**: インメモリfakeを用いたドメイン/ユースケーステスト
- **付け替え可能性**: Hono → Fastify/NestJS、DB変更が容易

### 技術スタック

**バックエンド**:
- **ランタイム**: Node.js (最新LTS) / Bun (オプション)
- **HTTP層**: Hono (薄いアダプター層として)
- **バリデーション**: Zod (全面採用)
- **ORM**: Drizzle ORM (型安全、マイグレーション)
- **データベース**: PostgreSQL
- **テスト**: Vitest (unit/integration)、Testcontainers (DBテスト)
- **TypeScript**: Strict mode、path aliases

**フロントエンド**:
- **フレームワーク**: React 18+
- **デザインシステム**: `../gxp-designSystem` (shadcn/ui + Tailwind CSS ベース)
- **データフェッチング**: TanStack Query
- **ルーティング**: TanStack Router
- **フォーム**: React Hook Form + Zod
- **テーブル**: TanStack Table

**モノレポ**:
- **パッケージマネージャー**: pnpm workspaces
- **ビルドシステム**: Turborepo

---

## 2. リポジトリ構造

```
repo/
├── apps/
│   ├── api/                      # HTTPエントリポイント (Honoアプリ)
│   │   ├── src/
│   │   │   ├── main.ts           # Bootstrap & DIセットアップ
│   │   │   ├── routes/           # ルート登録
│   │   │   └── middleware/       # HTTP固有のミドルウェア
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/                      # フロントエンドアプリ
│       ├── src/
│       ├── package.json          # gxp-designSystemへの依存
│       └── tsconfig.json
│
├── packages/
│   ├── foundation/
│   │   ├── app-core/             # DI、Config、Logger、Error、Context
│   │   │   ├── src/
│   │   │   │   ├── di/           # DIコンテナ (request/singleton scope)
│   │   │   │   ├── config/       # Env + Zodバリデーション
│   │   │   │   ├── logger/       # 構造化ログ (pino/winston)
│   │   │   │   ├── errors/       # エラー階層
│   │   │   │   └── context/      # リクエストコンテキスト (actorId, tenantId, traceId)
│   │   │   ├── tests/
│   │   │   └── package.json
│   │   │
│   │   ├── auth-suite/           # 認証・認可
│   │   │   ├── src/
│   │   │   │   ├── domain/       # 認証エンティティ (User, Session, Role)
│   │   │   │   ├── application/  # 認証ユースケース
│   │   │   │   │   ├── ports.ts  # IAuthRepository, ISessionStore
│   │   │   │   │   └── usecases/ # Login, MFA, RBACチェック
│   │   │   │   ├── infrastructure/
│   │   │   │   │   ├── session/  # セッションストア実装 (PostgreSQL cache table/Redis/Memory)
│   │   │   │   │   └── crypto/   # パスワードハッシュ、トークン生成
│   │   │   │   └── contracts.ts  # 認証用Zodスキーマ
│   │   │   └── package.json
│   │   │
│   │   ├── db/                   # データベース基盤 (Drizzle ORM)
│   │   │   ├── src/
│   │   │   │   ├── client.ts     # Drizzle クライアント
│   │   │   │   ├── schema/       # Drizzle スキーマ定義
│   │   │   │   ├── transaction.ts # トランザクション管理
│   │   │   │   └── types.ts      # 共通DB型
│   │   │   ├── migrations/       # Drizzle マイグレーション
│   │   │   ├── drizzle.config.ts
│   │   │   └── package.json
│   │   │
│   │   └── contracts/            # 共有Zodスキーマ
│   │       ├── src/
│   │       │   ├── common/       # 共通DTO (Paginationなど)
│   │       │   ├── errors/       # エラーレスポンススキーマ
│   │       │   └── api/          # API契約スキーマ
│   │       └── package.json
│   │
│   ├── domains/                  # ドメインパッケージ (独立パッケージ)
│   │   ├── patient/              # ドメイン例
│   │   │   ├── src/
│   │   │   │   ├── domain/       # Entity、VO、Policy
│   │   │   │   │   ├── entities/
│   │   │   │   │   ├── value-objects/
│   │   │   │   │   └── policies/
│   │   │   │   ├── application/
│   │   │   │   │   ├── ports.ts  # リポジトリインターフェース
│   │   │   │   │   └── usecases/ # ビジネスロジック
│   │   │   │   ├── infrastructure/ # Port実装 (オプション)
│   │   │   │   └── contracts.ts  # ドメイン固有Zodスキーマ
│   │   │   ├── tests/
│   │   │   │   ├── fakes/        # インメモリfake実装
│   │   │   │   └── usecases/     # ユースケーステスト
│   │   │   └── package.json
│   │   │
│   │   └── appointment/          # 別のドメイン例
│   │
│   └── adapters/                 # インフラアダプター
│       ├── http-hono/            # Hono HTTPアダプター
│       │   ├── src/
│       │   │   ├── handlers/     # HTTPハンドラー (薄い層)
│       │   │   ├── middleware/   # 認証ミドルウェアアダプター
│       │   │   ├── router.ts     # ルート定義
│       │   │   └── response.ts   # レスポンスフォーマット
│       │   └── package.json
│       │
│       └── db-drizzle/           # Drizzle ORMアダプター
│           ├── src/
│           │   ├── repositories/ # Port実装 (Drizzle使用)
│           │   ├── mappers/      # DB ↔ Domain マッピング
│           │   └── schemas/      # ドメイン固有スキーマ
│           └── package.json
│
# 外部パッケージ (リポジトリ外)
# ../gxp-designSystem/           # 既存デザインシステム (shadcn/ui + Tailwind CSS ベース)
#   → apps/web から workspace:* で参照
│
├── docs/
│   ├── project-plan.md           # 本ファイル
│   ├── architecture.md           # アーキテクチャ決定記録
│   └── development.md            # 開発ガイド
│
├── package.json                  # ルートpackage.json
├── pnpm-workspace.yaml           # ワークスペース設定
├── turbo.json                    # Turborepo設定 (オプション)
└── tsconfig.base.json            # ベースTypeScript設定
```

---

## 3. Foundation各コンポーネントの設計

### 3.1 app-core パッケージ

**目的**: フレームワーク非依存のアプリケーションコア

**主要コンポーネント**:

1. **DIコンテナ**
   - Singletonスコープ: Config、Logger、DBクライアント
   - Requestスコープ: Context、Transaction
   - インターフェース: `Container.register()`, `Container.resolve()`
   - リフレクション不使用、明示的登録

2. **Config**
   ```typescript
   // Zodベースのenv検証
   const ConfigSchema = z.object({
     NODE_ENV: z.enum(['development', 'production', 'test']),
     PORT: z.coerce.number().default(3000),
     DATABASE_URL: z.string().url(),
     // ...
   });
   ```

3. **Logger**
   - 構造化ログ (JSON)
   - requestId、actorIdを自動注入
   - レベル: debug、info、warn、error
   - インターフェース: `Logger.info(message, context)`

4. **エラー階層**
   ```typescript
   abstract class AppError extends Error
   class DomainError extends AppError      // ビジネスルール違反
   class ValidationError extends AppError  // 入力バリデーション
   class InfraError extends AppError       // DB、外部API障害
   class AuthError extends AppError        // 認証・認可
   ```

5. **リクエストコンテキスト**
   ```typescript
   interface RequestContext {
     requestId: string;
     actorId: string | null;
     tenantId: string | null;
     traceId: string;
     timestamp: Date;
   }
   ```

### 3.2 auth-suite パッケージ

**目的**: 完全な認証・認可ソリューション

**機能**:
- メール + パスワード認証
- MFA (TOTP)
- セッション管理 (短命トークン)
- RBAC (ロールベースアクセス制御)
- ABAC (属性ベースアクセス制御) フック
- 監査ログ

**主要コンポーネント**:
1. **ドメイン層**
   - Userエンティティ (id、email、passwordHash、roles)
   - Sessionエンティティ (token、expiresAt、userId)
   - Role/Permission値オブジェクト

2. **アプリケーション層**
   - `LoginUseCase`: ユーザー認証
   - `VerifyMFAUseCase`: TOTPコード検証
   - `CheckPermissionUseCase`: RBAC/ABACチェック
   - Ports: `IUserRepository`、`ISessionStore`、`IAuditLogger`

3. **インフラストラクチャ**
   - パスワードハッシュ (bcrypt/argon2)
   - トークン生成 (crypto.randomBytes)
   - セッションストア (PostgreSQL cache tableを第一候補、Redisはオプション、Memoryはテスト用)

   **PostgreSQL cache table 方針 (Drizzle想定)**
   - 目的: セッション/短命キャッシュをPostgreSQLで高速化し、依存を最小化
   - 代表テーブル: `session_cache`
     - `token` (PK), `user_id`, `expires_at`, `created_at`, `updated_at`, `data` (jsonb)
     - 主要インデックス: `expires_at`, `user_id`
   - 運用: `expires_at` による期限管理 + 定期クリーンアップ (cron/job)
   - 実装: `ISessionStore` を Drizzle 実装 (db-drizzle) で提供

4. **HTTPアダプター**
   - `authMiddleware`: トークン抽出 → 検証 → コンテキスト注入
   - `requireRole`: ユーザーロールチェック
   - フレームワーク非依存 (コンテキストを返すかthrow)

### 3.3 db パッケージ

**目的**: データベース抽象化とトランザクション管理

**主要コンポーネント**:
1. **クライアントファクトリ**
   ```typescript
   interface DBClient {
     query<T>(sql: string, params: any[]): Promise<T[]>;
     transaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T>;
   }
   ```

2. **Unit of Work**
   ```typescript
   class TransactionManager {
     async execute<T>(fn: (tx: Transaction) => Promise<T>): Promise<T>;
   }
   ```

3. **マイグレーションランナー**
   - SQLベースマイグレーション
   - バージョン追跡
   - ロールバックサポート

**注意**: ドメインは直接DBに触らず、ports経由でのみアクセス

### 3.4 contracts パッケージ

**目的**: API契約用の共有Zodスキーマ

**構造**:
```typescript
// 共通DTO
export const PaginationSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive().max(100),
});

// エラーレスポンス
export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.record(z.any()).optional(),
});

// API契約 (OpenAPIに生成可能)
export const CreatePatientRequestSchema = z.object({
  name: z.string().min(1),
  dateOfBirth: z.string().date(),
  // ...
});
```

---

## 4. ドメインパッケージ設計パターン

### 標準構造 (例: Patientドメイン)

```
packages/domains/patient/
├── src/
│   ├── domain/
│   │   ├── entities/
│   │   │   └── Patient.ts           # エンティティクラス
│   │   ├── value-objects/
│   │   │   ├── PatientId.ts
│   │   │   └── MedicalRecordNumber.ts
│   │   └── policies/
│   │       └── PatientAgePolicy.ts  # ビジネスルール
│   │
│   ├── application/
│   │   ├── ports.ts                 # インターフェース
│   │   │   # export interface IPatientRepository
│   │   │   # export interface INotificationService
│   │   └── usecases/
│   │       ├── RegisterPatient.ts
│   │       ├── UpdatePatient.ts
│   │       └── GetPatient.ts
│   │
│   ├── infrastructure/              # オプション (またはadapter内)
│   │   └── PatientRepositoryImpl.ts
│   │
│   └── contracts.ts                 # 公開Zodスキーマ
│       # export const PatientSchema = z.object({...})
│
├── tests/
│   ├── fakes/
│   │   └── FakePatientRepository.ts # インメモリfake
│   ├── domain/
│   │   └── Patient.test.ts
│   └── usecases/
│       └── RegisterPatient.test.ts
│
└── package.json
```

### 設計ルール

1. **フレームワーク依存なし**
   - ドメイン層はHono/Express/Fastifyを知らない
   - HTTP Request/Responseを直接受け取らない

2. **公開API**
   - Usecases (アプリケーションサービス)
   - Ports (インターフェース)
   - Contracts (Zodスキーマ)

3. **依存の流れ**
   ```
   Domain ← Application ← Infrastructure
   (依存なし) ← (Ports) ← (実装)
   ```

---

## 5. アダプター層の設計

### 5.1 HTTPアダプター (http-hono)

**責務**: HTTP → Usecase の薄い変換層

**構造**:
```typescript
// ハンドラー例
export const createPatientHandler = (
  registerPatient: RegisterPatientUseCase
) => async (c: Context) => {
  // 1. リクエストのパース & バリデーション
  const body = CreatePatientRequestSchema.parse(await c.req.json());
  
  // 2. コンテキスト抽出
  const ctx = c.get('requestContext');
  
  // 3. ユースケース呼び出し
  const result = await registerPatient.execute({
    ...body,
    actorId: ctx.actorId,
  });
  
  // 4. レスポンスフォーマット
  return c.json(result, 201);
};
```

**重要ポイント**:
- ハンドラーは純粋関数 (DIはパラメータ経由)
- 境界でZodバリデーション
- エラーハンドリングミドルウェアがAppError → HTTPステータスに変換
- ハンドラーにビジネスロジックなし

### 5.2 DBアダプター (db-drizzle)

**責務**: ドメイン用のPort実装 (Drizzle ORM使用)

**構造**:
```typescript
import { eq } from 'drizzle-orm';
import { patients } from '@foundation/db/schema';

// リポジトリ実装
export class DrizzlePatientRepository implements IPatientRepository {
  constructor(private db: DBClient) {}
  
  async findById(id: PatientId): Promise<Patient | null> {
    const result = await this.db.query.patients.findFirst({
      where: eq(patients.id, id.value),
    });
    
    if (!result) return null;
    
    // DB行 → ドメインエンティティへマッピング
    return this.toDomain(result);
  }
  
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

## 6. テスト戦略

### 6.1 テストピラミッド

```
        E2E (数本)
       /          \
    Integration    |
   (Adapterテスト) |
  /                |
Unit Tests         |
(Domain/Usecase)   |
```

### 6.2 ユニットテスト (主戦場)

**対象**: ドメインエンティティ、値オブジェクト、ユースケース

**アプローチ**:
```typescript
// tests/usecases/RegisterPatient.test.ts
describe('RegisterPatient', () => {
  let usecase: RegisterPatientUseCase;
  let fakeRepo: FakePatientRepository;
  
  beforeEach(() => {
    fakeRepo = new FakePatientRepository();
    usecase = new RegisterPatientUseCase(fakeRepo);
  });
  
  it('新規患者を登録できる', async () => {
    const result = await usecase.execute({
      name: 'John Doe',
      dateOfBirth: '1990-01-01',
    });
    
    expect(result.id).toBeDefined();
    expect(fakeRepo.patients).toHaveLength(1);
  });
  
  it('重複したカルテ番号を拒否する', async () => {
    await usecase.execute({ mrn: 'MRN001', ... });
    
    await expect(
      usecase.execute({ mrn: 'MRN001', ... })
    ).rejects.toThrow(DomainError);
  });
});
```

**メリット**:
- 高速 (DB不要、HTTP不要)
- 安定 (外部依存なし)
- 大量に書ける

### 6.3 統合テスト

**対象**: アダプター (HTTPハンドラー、DBリポジトリ)

**アプローチ**:
- HTTP: モックユースケースでハンドラーをテスト
- DB: Testcontainersで実際のPostgresを使用

```typescript
// tests/adapters/PatientRepository.integration.test.ts
describe('PostgresPatientRepository', () => {
  let container: StartedPostgreSqlContainer;
  let db: DBClient;
  let repo: PostgresPatientRepository;
  
  beforeAll(async () => {
    container = await new PostgreSqlContainer().start();
    db = createDBClient(container.getConnectionString());
    repo = new PostgresPatientRepository(db);
  });
  
  afterAll(async () => {
    await container.stop();
  });
  
  it('患者を永続化して取得できる', async () => {
    const patient = new Patient({ ... });
    await repo.save(patient);
    
    const found = await repo.findById(patient.id);
    expect(found).toEqual(patient);
  });
});
```

### 6.4 E2Eテスト

**対象**: クリティカルなユーザーフロー (認証含む)

**アプローチ**:
- 数本のみ (login → create → read → update)
- 実際のHTTPサーバー + Testcontainer DB

---

## 7. 決定事項とトレードオフ

### 7.1 採用したアプローチ

1. **Zodを唯一の真実とする**
   - ✅ 型定義の重複なし
   - ✅ ランタイムバリデーション + TypeScript型
   - ✅ OpenAPI生成が容易

2. **明示的DI (デコレータなし)**
   - ✅ フレームワーク非依存
   - ✅ テストが容易
   - ✅ 依存関係が明確
   - ❌ NestJSよりボイラープレート多い

3. **ドメインパッケージを個別ワークスペース化**
   - ✅ 境界が明確
   - ✅ 無効化・差し替えが容易
   - ✅ 将来的に個別リポジトリ化可能
   - ❌ セットアップのオーバーヘッド

4. **Portsをドメイン内、実装をアダプター内**
   - ✅ クリーンな依存の流れ
   - ✅ 実装の差し替えが容易
   - ❌ 管理するファイルが増える

### 7.2 採用しないアプローチ

1. ❌ **Hono上でNestJS風デコレータ**
   - 理由: 過剰設計、密結合

2. ❌ **ドメインがHTTPコンテキストを直接受け取る**
   - 理由: フレームワーク非依存性を損なう

3. ❌ **スキーマの二重管理 (Zod + TypeScript)**
   - 理由: メンテナンス負荷

4. ❌ **モノリシックなドメインパッケージ**
   - 理由: 付け替え可能性が低い

---

## 8. 実装ロードマップ

### フェーズ1: 基盤セットアップ (1-2週間)

1. **モノレポセットアップ**
   - [ ] pnpm workspaceの初期化
   - [ ] Turborepoセットアップ (オプション)
   - [ ] TypeScript設定 (strict mode、path aliases)
   - [ ] Vitestセットアップ

2. **app-core パッケージ**
   - [ ] DIコンテナ (singleton/requestスコープ)
   - [ ] Zod検証付きConfig
   - [ ] 構造化ログ (pino)
   - [ ] エラー階層
   - [ ] リクエストコンテキスト
   - [ ] ユニットテスト

3. **db パッケージ**
   - [ ] Drizzle ORMクライアントファクトリ
   - [ ] トランザクションマネージャー
   - [ ] Drizzle Kitマイグレーションセットアップ
   - [ ] Testcontainersを使った統合テスト

### フェーズ2: 認証基盤 (2-3週間)

1. **auth-suite パッケージ**
   - [ ] Userエンティティ & 値オブジェクト
   - [ ] Sessionエンティティ
   - [ ] 認証ユースケース (login、verify、check permission)
   - [ ] Ports (IUserRepository、ISessionStore)
   - [ ] パスワードハッシュ & トークン生成
   - [ ] fakeを使ったユニットテスト

2. **db-drizzle アダプター**
   - [ ] UserRepository実装 (Drizzle ORM使用)
   - [ ] SessionStore実装 (PostgreSQL cache table を第一候補、Redisはオプション)
   - [ ] 認証テーブル + `session_cache` 用Drizzleスキーマ・マイグレーション
   - [ ] 期限切れ削除ジョブの設計 (cron/worker)
   - [ ] 統合テスト

### フェーズ3: HTTP層 (3-4週間)

1. **http-hono アダプター**
   - [ ] Honoアプリセットアップ
   - [ ] 認証ミドルウェア (トークン検証)
   - [ ] エラーハンドリングミドルウェア
   - [ ] リクエストコンテキストミドルウェア
   - [ ] レスポンスフォーマットユーティリティ

2. **apps/api**
   - [ ] Bootstrap & DIセットアップ
   - [ ] ルート登録
   - [ ] 認証エンドポイント (login、logout、verify)
   - [ ] ヘルスチェックエンドポイント
   - [ ] 認証フローのE2Eテスト

### フェーズ4: サンプルドメイン (4-5週間)

1. **domains/patient パッケージ**
   - [ ] Patientエンティティ & 値オブジェクト
   - [ ] ビジネスポリシー
   - [ ] ユースケース (register、update、get)
   - [ ] Ports (IPatientRepository)
   - [ ] Contracts (Zodスキーマ)
   - [ ] fakeを使ったユニットテスト

2. **統合**
   - [ ] db-drizzle内のPatientRepository (Drizzle ORM使用)
   - [ ] http-hono内のPatient HTTPハンドラー
   - [ ] apps/api内のルート登録
   - [ ] E2Eテスト

### フェーズ5: 可観測性 & 仕上げ (5-6週間)

1. **可観測性**
   - [ ] リクエストログミドルウェア
   - [ ] 認証イベントの監査ログ
   - [ ] エラートラッキング (Sentry統合)
   - [ ] パフォーマンス監視

2. **ドキュメント**
   - [ ] アーキテクチャ決定記録
   - [ ] APIドキュメント (OpenAPI)
   - [ ] 開発ガイド
   - [ ] テストガイド

3. **開発者体験**
   - [ ] ホットリロードセットアップ
   - [ ] デバッグ設定
   - [ ] Pre-commitフック (lint、test)
   - [ ] CI/CDパイプライン

---

## 9. 未決定事項 (要決定)

### 9.1 Zodスキーマの配置

**質問**: Zodスキーマをドメイン起点にするか、contractsに集約するか？

**オプションA: ドメインファースト**
```
domains/patient/contracts.ts  # Patient固有スキーマ
foundation/contracts/         # 共通スキーマのみ
```
- ✅ ドメインが自己完結
- ❌ フロントエンドが複数ドメインからimport必要

**オプションB: コントラクトファースト**
```
foundation/contracts/
  patient.ts                  # すべてのpatientスキーマ
  appointment.ts              # すべてのappointmentスキーマ
```
- ✅ フロントエンドの単一importポイント
- ❌ ドメインの自己完結性が低い

**推奨**: **オプションA (ドメインファースト)**。`CLAUDE.md` の規定に従い、ドメイン固有のスキーマは `packages/domains/{domain}/contracts.ts` に配置し、バックエンドの純粋性を保つ。

### 9.2 Fake実装の標準

**質問**: Fake実装の標準パターンは？

**推奨**:
```typescript
// tests/fakes/FakePatientRepository.ts
export class FakePatientRepository implements IPatientRepository {
  public patients: Patient[] = [];
  
  async findById(id: PatientId): Promise<Patient | null> {
    return this.patients.find(p => p.id.equals(id)) ?? null;
  }
  
  async save(patient: Patient): Promise<void> {
    const index = this.patients.findIndex(p => p.id.equals(patient.id));
    if (index >= 0) {
      this.patients[index] = patient;
    } else {
      this.patients.push(patient);
    }
  }
  
  // テストヘルパー
  clear(): void {
    this.patients = [];
  }
}
```

### 9.3 RouteDef (HTTP非依存ルート定義)

**質問**: HTTP非依存のルート定義を採用するか？

**例**:
```typescript
// Hono非依存のルート定義
export const patientRoutes: RouteDef[] = [
  {
    method: 'POST',
    path: '/patients',
    handler: 'createPatient',
    auth: true,
    schema: {
      body: CreatePatientRequestSchema,
      response: PatientResponseSchema,
    },
  },
];
```

**推奨**: **採用しない** (初期段階では過剰設計)。必要になったら導入。

### 9.4 リクエストスコープの最小セット

**質問**: リクエストスコープに載せる最小セットは？

**推奨**:
```typescript
interface RequestScope {
  context: RequestContext;      // requestId、actorId、tenantId、traceId
  transaction?: Transaction;    // オプション (書き込み操作のみ)
  logger: Logger;               // コンテキスト事前注入済み
}
```

---

## 10. 成功基準

### 技術目標
- [ ] ドメインパッケージのフレームワーク依存ゼロ
- [ ] ドメイン/ユースケース層のテストカバレッジ80%以上
- [ ] Hono → Fastify移行が1日以内に可能
- [ ] DB変更 (Postgres → SQLite) が1日以内に可能
- [ ] 新規ドメインパッケージ追加が2時間以内

### 品質目標
- [ ] すべてのテストが10秒以内に実行 (ユニットテスト)
- [ ] E2Eテストが30秒以内に実行
- [ ] TypeScript `any` 型ゼロ (アダプター除く)
- [ ] すべての公開APIにZodスキーマあり
- [ ] すべてのエラーが型付き (汎用Errorのthrowなし)

### 開発者体験目標
- [ ] すべてのパッケージでホットリロード動作
- [ ] 新規開発者が5分以内にプロジェクト起動可能
- [ ] バリデーション失敗時の明確なエラーメッセージ
- [ ] ZodスキーマからOpenAPIドキュメント自動生成

---

## 11. 将来の拡張

### 追加可能な機能 (フェーズ6以降)

1. **マルチテナンシー**
   - DBレベルでのテナント分離
   - テナント対応コンテキスト
   - テナント固有設定

2. **イベントソーシング (オプション)**
   - ドメインイベント
   - イベントストア
   - イベント駆動アーキテクチャ

3. **CQRS (オプション)**
   - 読み取り/書き込みモデル分離
   - クエリ最適化
   - イベントプロジェクション

4. **GraphQLアダプター**
   - RESTの代替
   - 同じユースケース、異なるアダプター

5. **マイクロサービス分割**
   - ドメインパッケージ → 個別サービス化
   - gRPC通信
   - サービスメッシュ

---

## 12. リスク軽減策

### リスク1: 過剰設計
**軽減策**: シンプルに始め、必要になってから複雑性を追加。フェーズ1-3は最小限の実行可能な基盤とする。

### リスク2: DIのボイラープレート
**軽減策**: DIヘルパーユーティリティを作成。ボイラープレートが過剰になったら軽量DIライブラリ (例: tsyringe) を検討。

### リスク3: モノレポの複雑性
**軽減策**: Turborepoでキャッシング。パッケージ依存を最小限に。ワークスペース構造を明確にドキュメント化。

### リスク4: テストメンテナンス
**軽減策**: 優れたfake実装に投資。テストは実装ではなく振る舞いに焦点。複雑なエンティティにはテストビルダーを使用。

---

## 13. 次のステップ

1. **計画のレビュー & 承認**: 未決定事項を議論し、決定を確定
2. **リポジトリセットアップ**: モノレポ構造の初期化
3. **フェーズ1実装**: 基盤パッケージ (app-core、db) の構築
4. **アーキテクチャ検証**: 1つの完全なドメイン (patient) をエンドツーエンドで構築
5. **反復 & 改善**: 最初のドメインからの学びに基づいて調整

---

## 付録: 主要な依存関係

### バックエンド本番依存関係
- `hono`: ^4.x (HTTPフレームワーク)
- `@hono/zod-openapi`: ^0.x (OpenAPI生成)
- `zod`: ^3.x (バリデーション)
- `drizzle-orm`: ^0.29.x (型安全ORM)
- `drizzle-kit`: ^0.20.x (マイグレーションツール)
- `postgres`: ^3.x (PostgreSQLクライアント)
- `pino`: ^8.x (ロガー)
- `@node-rs/argon2`: ^1.x (パスワードハッシュ)

### フロントエンド本番依存関係
- `react`: ^18.x
- `react-dom`: ^18.x
- `@tanstack/react-query`: ^5.x (データフェッチング)
- `@tanstack/react-router`: ^1.x (ルーティング)
- `@tanstack/react-table`: ^8.x (テーブル)
- `react-hook-form`: ^7.x (フォーム)
- `@hookform/resolvers`: ^3.x (Zodリゾルバー)
- `zod`: ^3.x (バリデーション)
- `gxp-designSystem`: workspace:* (既存デザインシステム)

### 開発依存関係
- `typescript`: ^5.x
- `vitest`: ^1.x (テスト)
- `testcontainers`: ^10.x (統合テスト)
- `@types/node`: (型定義)
- `tsx`: (TypeScript実行)
- `turbo`: (モノレポビルドシステム)

### オプション依存関係
- `ioredis`: ^5.x (Redisクライアント)
- `@sentry/node`: (エラートラッキング)

---

**ドキュメントステータス**: レビュー待ち  
**最終更新**: 2026-01-31  
**次回レビュー**: フェーズ1完了後
