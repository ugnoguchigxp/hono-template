# CLAUDE.md - AI実装ルール

**実装例**: `BESTPRACTICE.md` | **Drizzle**: `DRIZZLE.md`

---

## 核心原則

**アーキテクチャ**: ドメイン層はHTTPフレームワーク非依存。依存方向は外→内のみ。  
**型安全**: `any`禁止、Zod + TypeScript strict、`satisfies`活用  
**テスト**: Fake実装でユニットテスト容易に

---

## TypeScript設定

```json
{ "strict": true, "noUncheckedIndexedAccess": true, "noImplicitReturns": true }
```

**禁止**: `any`、型アサーション乱用(`as`, `!`)、暗黙的any

---

## Zod

**原則**: Zodスキーマ → `z.infer<typeof Schema>` で型導出。型の二重定義禁止。

**配置**:
- ドメイン固有: `packages/domains/{domain}/contracts.ts`
- 共通/API: `packages/foundation/contracts/`

**バリデーション**: HTTP境界、DB境界、外部API境界で実施

---

## フロントエンド

**デザインシステム**: `../gxp-designSystem` (shadcn/ui + Tailwind) を使用。直接shadcn/uiインストール禁止。

| ライブラリ | 用途 | 重要ポイント |
|-----------|------|-------------|
| TanStack Query | データ取得 | `useQuery`/`useMutation`、Zod検証、キャッシュ無効化 |
| TanStack Router | ルーティング | Zodでパラメータ検証、`loader`でプリフェッチ |
| TanStack Table | テーブル | `createColumnHelper<T>()`で型安全カラム |
| React Hook Form | フォーム | `zodResolver`統合、`useFieldArray`で動的フィールド |

---

## バックエンド層構造

| 層 | 責務 | 禁止事項 |
|---|------|---------|
| **Domain** | Entity/VO/Policy | HTTP依存、DB直接アクセス |
| **Application** | Usecase、Ports定義 | インフラ実装詳細 |
| **Adapter** | HTTP Handler、Repository実装 | ビジネスロジック |

**エンティティ**: `static create()` (新規) + `static reconstruct()` (再構築)  
**ユースケース**: Zod入出力定義 → Ports注入 → `execute()`  
**リポジトリ**: `toDomain()` / `toRow()` でDB↔Domain変換

---

## Drizzle ORM

- スキーマから型推論: `$inferSelect` / `$inferInsert`
- `drizzle-zod`でZod自動生成
- `drizzle-kit`でマイグレーション

**詳細**: `DRIZZLE.md`

---

## エラー階層

| エラー | HTTP | 用途 |
|--------|------|------|
| `DomainError` | 400 | ビジネスルール違反 |
| `AuthError` | 401 | 認証・認可 |
| `NotFoundError` | 404 | リソース不存在 |
| `ValidationError` | 422 | 入力バリデーション |
| `InfraError` | 500 | インフラ障害 |

**処理順**: ZodError→422、AppError→各statusCode、その他→500

---

## テスト

**ユニット**: Fake実装でPorts差し替え、AAA(Arrange-Act-Assert)パターン  
**統合**: Testcontainersで実DB、モックユースケースでHTTPテスト

---

## 命名規則

| 対象 | 規則 | 例 |
|------|------|---|
| ファイル(Entity/VO/Usecase) | PascalCase | `Patient.ts` |
| ファイル(interface/schema) | lowercase | `ports.ts`, `contracts.ts` |
| 変数/関数 | camelCase | `patientId` |
| クラス/型 | PascalCase | `Patient` |
| インターフェース | IPascalCase | `IPatientRepository` |
| Zodスキーマ | PascalCase + Schema | `PatientSchema` |
| 定数 | UPPER_SNAKE | `MAX_RETRY_COUNT` |

**インポート順**: 外部ライブラリ → Foundation → ドメイン → 相対

---

## 禁止事項

- `any`型
- 型アサーション乱用
- ドメインのHTTP依存
- ハンドラー内ビジネスロジック
- マジックナンバー
- N+1クエリ
- 不要な直列`await`（`Promise.all`使用）

---

## 実装前チェック

1. **層**: Domain / Application / Adapter のどこか
2. **依存**: 外側→内側のみか
3. **Zod**: 境界にスキーマあるか
4. **Ports**: 外部依存をインターフェース化したか
5. **テスト**: Fakeで代替可能か
