# Hono Template - クリーンアーキテクチャ モノレポ

[English Version](./README.md)

Hono、Zod、ドメイン駆動設計（DDD）、およびクリーンアーキテクチャの原則を採用した、実用的なモノレポテンプレートです。

## 🏗️ アーキテクチャ

このプロジェクトは、関心の分離を明確にした厳格な階層型アーキテクチャに従っています。

```
┌─────────────────┐
│   HTTP Layer    │  (Hono - thin adapter)
├─────────────────┤
│  Application    │  (Use cases, Ports)
├─────────────────┤
│    Domain       │  (Entities, VOs, Policies)
├─────────────────┤
│ Infrastructure  │  (DB, External APIs)
└─────────────────┘
```

### 🧠 アーキテクチャの哲学

このプロジェクトは **「置換可能性とテスト容易性 (Replaceability & Testability)」** の原則に基づいて構築されています。ビジネスロジックを外部フレームワークやツールから切り離すことで、アプリケーションのコア部分を安定させ、テストを容易にします。

```mermaid
graph TD
    subgraph "外部世界 (External World)"
        HTTP["HTTP (Hono)"]
        CLI["CLI"]
        CRON["Cron ジョブ"]
    end

    subgraph "アダプター層 (Adapters Layer)"
        HTTP_A["HTTP アダプター"]
        DB_A["Drizzle ORM アダプター"]
    end

    subgraph "アプリケーション層 (Application Layer)"
        UC["ユースケース (Use Cases)"]
        Ports["ポート (Ports/インターフェース)"]
    end

    subgraph "ドメイン層 (Domain Layer)"
        Entities["エンティティ (Entities)"]
        VO["値オブジェクト (Value Objects)"]
        Policies["ドメインポリシー (Domain Policies)"]
    end

    HTTP --> HTTP_A
    HTTP_A --> UC
    UC --> Ports
    Ports --> DB_A
    UC --> Entities
    VO --> Entities
```

## 📁 リポジトリ構造

```
repo/
├── apps/
│   └── api/                    # HTTPエントリポイント (Hono app)
├── packages/
│   ├── foundation/
│   │   ├── app-core/          # DI, 設定, ロガー, エラー定義
│   │   ├── auth-suite/        # 認証 & 認可
│   │   ├── db/                # データベース抽象化 (Drizzle)
│   │   └── contracts/         # 共有 Zod スキーマ
│   ├── adapters/
│   │   ├── http-hono/         # Hono HTTP アダプター
│   │   └── db-drizzle/        # Drizzle ORM アダプター
│   └── domains/               # ビジネスドメイン
└── docs/                      # ドキュメント
```

## 🚀 クイックスタート

### 前提条件

- Bun 1.0+ (APIランタイムに必須)
- Node.js 20+ (型チェック/リント/テストなどのツール用途のみ)
- pnpm 8+
- PostgreSQL (本番環境用)

### インストール

```bash
# クローンと依存関係のインストール
git clone <repository-url>
cd hono-template
pnpm install

# 環境変数の設定
cp .env.example .env
# .env を実際の構成に合わせて編集

# データベースマイグレーションの実行
pnpm db:migrate

# インフラの起動 (Postgresのみ)
docker compose up -d

# Redisを含むインフラの起動 (オプション)
docker compose --profile redis up -d

# 開発サーバーの起動 (Bun)
pnpm dev

# Node.js はツール用途（typecheck/lint/test）でのみサポートされています
```

### 環境変数

```bash
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/db
LOG_LEVEL=info
REDIS_URL=redis://localhost:6379  # オプション (Redisプロファイル有効時のみ)
```

## 🧪 テスト

プロジェクトには、すべてのアーキテクチャ層を網羅した包括的なテストが含まれています。

### テストの実行

```bash
# すべてのテストを実行
pnpm test

# ウォッチモードで実行
pnpm test:watch

# カバレッジ付きで実行
pnpm test:coverage

# 特定のパッケージのテストを実行
pnpm --filter @foundation/auth-suite test
```

### テスト構造

- **ユニットテスト**: ドメインエンティティ、値オブジェクト、ビジネスロジック
- **統合テスト**: ユースケースとリポジトリの実装
- **APIテスト**: HTTPエンドポイントとリクエスト/レスポンスのハンドリング
- **E2Eテスト**: 完全なユーザーフロー（計画中）

### テストファイル

- `*.test.ts`: ユニットおよび統合テスト
- `*.spec.ts`: 仕様形式のテスト
- `vitest.config.ts`: テスト設定

### モック戦略

- ユニットテスト用にリポジトリインターフェースをモック化
- ユースケーステストで依存関係をモック化
- 隔離のためにAPIテストでサービスをモック化

## 📦 利用可能なスクリプト

### ルートレベル
- `pnpm build` - すべてのパッケージをビルド
- `pnpm test` - すべてのテストを実行
- `pnpm lint` - 型チェック
- `pnpm db:generate` - Drizzleマイグレーションの生成
- `pnpm db:migrate` - データベースマイグレーションの実行
- `pnpm db:studio` - Drizzle Studioを開く

### パッケージ固有
- `pnpm --filter @apps/api dev` - APIサーバーの起動
- `pnpm --filter @foundation/app-core test` - app-coreパッケージのテスト

## 🏛️ コア原則

### 1. フレームワークに依存しないドメイン
- ドメインロジックはフレームワークへの依存がゼロ
- Hono, Fastify, Express等で使用可能

### 2. 型安全性重視
- TypeScript厳格モードの有効化
- `any` 型の禁止
- ランタイムバリデーションと型推論に Zod を使用

### 3. テスト容易性
- ユニットテスト用のインメモリ・フェイク
- 明確な依存性の注入
- Ports & Adapters パターン

### 4. 単一の真実の源 (Single Source of Truth)
- Zodスキーマがすべてのコントラクトを定義
- 型はスキーマから推論
- 重複した型定義を排除

---

## 🧠 ビジネスロジック実装ガイド

このアーキテクチャでの開発は、**「内側から外側へ (Inside-Out)」** のアプローチで行います。常にドメインから開始し、アダプターへと進みます。

### 1. ドメインの定義 (「何をなすか」)
`packages/domains/[domain-name]/src/domain` で始めます。**エンティティ** と **値オブジェクト** を定義します。これらは Hono や Drizzle などのフレームワークへの依存を一切持たないようにします。

```typescript
// 例: packages/domains/billing/src/domain/Subscription.ts
export class Subscription {
  constructor(private readonly data: { id: string; status: 'active' | 'expired' }) {}
  
  isValid(): boolean {
    return this.data.status === 'active';
  }
}
```

### 2. コントラクトの定義 (「どのように見えるか」)
`packages/domains/[domain-name]/contracts.ts` で **Zod** を使用してデータ形状を定義します。これはドメインとAPIの両方における唯一の真理の源となります。

### 3. アプリケーション層 & ポート (「ブリッジ」)
`packages/domains/[domain-name]/src/application` で以下を定義します：
- **ポート (Ports)**: 操作のためのインターフェース (例: `ISubscriptionRepository`)。
- **ユースケース (Use Cases)**: ドメインロジックを統合・実行します。

### 4. インフラストラクチャ層 (「どのように動作するか」)
`packages/adapters/db-drizzle` (データベース用) や、ドメイン内のインフラフォルダでポートを実装します。

### 5. HTTPアダプター (「入口」)
`packages/adapters/http-hono` で、以下を行うコントローラー/ハンドラーを作成します：
1. Zodコントラクトを使用して入力を検証する。
2. ユースケースを呼び出す。
3. ドメインの結果やエラーをHTTPレスポンスにマッピングする。

### 6. 依存性の注入 (「接着剤」)
`apps/api/src/di/index.ts` (またはドメイン固有のDI設定) ですべてを登録します。これにより、すべてのコンポーネントが自動的に接続され、コンテナを介して利用可能になります。

---

## 🔧 開発ガイド

### 新しいドメインの追加

1. ドメインパッケージの作成:
```bash
mkdir -p packages/domains/your-domain/src/{domain,application,infrastructure}
```

2. 標準構造に従う:
```
packages/domains/your-domain/
├── src/
│   ├── domain/           # エンティティ, VO, ポリシー
│   ├── application/      # ユースケース, ポート
│   ├── infrastructure/   # ポートの実装
│   └── contracts.ts      # Zod スキーマ
└── tests/
    ├── fakes/           # インメモリ実装
    └── usecases/        # ユースケーステスト
```

### 新しいAPIエンドポイントの追加

1. `@foundation/contracts` で Zod スキーマを定義
2. 関連するドメインでユースケースを作成
3. `@adapters/http-hono` にハンドラーを追加
4. `apps/api` でルートを登録

### データベースの変更

1. `@foundation/db/src/schema` で Drizzle スキーマを更新
2. マイグレーション生成: `pnpm db:generate`
3. マイグレーション適用: `pnpm db:migrate`

## 📊 API エンドポイント

### 認証
- `POST /api/v1/auth/register` - ユーザー登録
- `POST /api/v1/auth/login` - ログイン
- `POST /api/v1/auth/logout` - ログアウト
- `GET /api/v1/auth/me` - 現在のユーザー情報を取得

### ヘルスチェック
- `GET /health` - ヘルスチェック

## 🔐 セキュリティ機能

- Argon2 によるパスワードハッシュ化 (高セキュリティな Argon2id)
- データベースに保存された **ハッシュ化トークン** によるセッション管理
- `SESSION_TTL` による固定セッション有効期限（デフォルトは非スライディング方式）
- 一意のリクエストIDによるコンテキスト追跡
- 重要な認証イベントの監査ログ（ログイン、ログアウト、登録、ログイン失敗）
- Zod による入力バリデーション
- 機密データの比較における定数時間比較の採用（可能な箇所）

## 📈 モニタリング & オブザーバビリティ

- Pino による構造化ログ
- トレースIDによるリクエスト追跡
- ヘルスチェックエンドポイント
- コンテキスト付きのエラー追跡

## 🧩 テクノロジースタック

**バックエンド:**
- Hono (HTTP フレームワーク)
- Drizzle ORM (型安全なデータベースアクセス)
- Zod (バリデーション & 型推論)
- PostgreSQL (データベース)
- Vitest (テスト)

**インフラストラクチャ:**
- pnpm (パッケージマネージャー)
- TypeScript (言語)
- パスエイリアス (クリーンなインポート)

## 🤝 貢献

1. 既存のコードパターンに従う
2. 新機能にはテストを追加する
3. ドキュメントを更新する
4. 型安全性を確保する（`any` 禁止）
5. 提出前にテストを実行する

## 📄 ライセンス

MIT ライセンス - 詳細は LICENSE ファイルを参照。
