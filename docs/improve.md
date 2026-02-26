# バックエンド アーキテクチャ改善計画

A2UIリポジトリの設計パターンを、本プロジェクトに安全に導入するための実装計画です。

> 参考: `A2UI/specification/v0_8/docs/a2ui_protocol.md`, `A2UI/renderers/web_core/src/v0_8/`, `A2UI/a2a_agents/python/a2ui_agent/`

---

## 前提と決定事項

- BBS はダミーAPIとして扱い、破壊的変更を許容する
- 方針 5, 6, 8 は「設計先行」で進め、今回の実装では未使用でも契約定義まで作成可
- 実装優先は「既存コードの型安全化」と「責務分離」

---

## 実装対象（今回）

### 方針 1：BBS DTO をフラット構造に統一（隣接リスト）

#### 目的

- `z.custom<CommentNode>()` を除去して Zod で検証可能にする
- ネスト木をやめ、`kind` + `id` 参照で構成する

#### 追加・変更

- `packages/domains/bbs/src/contracts.ts`

```typescript
import { z } from 'zod';
import { IdSchema } from '@foundation/contracts';

export const ThreadIdSchema = IdSchema;
export const CommentIdSchema = IdSchema;

const ThreadResourceSchema = z.object({
  kind: z.literal('Thread'),
  id: ThreadIdSchema,
  title: z.string().min(1).max(255),
  content: z.string().max(10000).optional(),
  authorId: IdSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  commentIds: z.array(CommentIdSchema).default([]),
});

const CommentResourceSchema = z.object({
  kind: z.literal('Comment'),
  id: CommentIdSchema,
  threadId: ThreadIdSchema,
  parentId: CommentIdSchema.nullable().optional(),
  content: z.string().min(1).max(5000),
  authorId: IdSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  replyIds: z.array(CommentIdSchema).default([]),
});

export const AnyBbsResourceSchema = z.discriminatedUnion('kind', [
  ThreadResourceSchema,
  CommentResourceSchema,
]);

export const ThreadListResponseSchema = z.object({
  items: z.array(AnyBbsResourceSchema),
});
```

#### 実装ステップ

1. `ThreadDetailSchema` / `CommentNode` を deprecated 扱いにする（削除でも可）
2. `AnyBbsResourceSchema` と `ThreadListResponseSchema` を導入
3. BBSユースケースの返却型を `ThreadListResponse` に寄せる
4. BBS HTTPハンドラーを追加する場合は、この DTO のみを返す

#### 受け入れ条件

- `z.custom<CommentNode>()` がコードベースから消える
- BBSのレスポンス型が discriminated union で表現される

---

### 方針 2：`superRefine` による参照整合性チェック

#### 目的

- フラット DTO 内の `id` 重複と参照切れを schema レベルで検知する

#### 追加・変更

- 新規: `packages/foundation/contracts/src/common/refine.ts`
- 変更: `packages/foundation/contracts/src/common/index.ts`

```typescript
// refine.ts
import { z } from 'zod';

export function withReferenceIntegrity<T extends { id: string }>(
  getRefIds: (item: T) => string[],
) {
  return (items: T[], ctx: z.RefinementCtx) => {
    const allIds = new Set(items.map((i) => i.id));
    const seen = new Set<string>();

    items.forEach((item, idx) => {
      if (seen.has(item.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `duplicate id: ${item.id}`,
          path: [idx, 'id'],
        });
      }
      seen.add(item.id);

      for (const refId of getRefIds(item)) {
        if (!allIds.has(refId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `missing ref id: ${refId}`,
            path: [idx],
          });
        }
      }
    });
  };
}
```

```typescript
// bbs/contracts.ts の利用イメージ
export const BulkBbsRequestSchema = z
  .object({ items: z.array(AnyBbsResourceSchema) })
  .superRefine((data, ctx) => {
    withReferenceIntegrity<AnyBbsResource>((item) => {
      if (item.kind === 'Thread') return item.commentIds;
      return item.replyIds;
    })(data.items, ctx);
  });
```

#### 実装ステップ

1. `refine.ts` を作成
2. `common/index.ts` から re-export 追加
3. `bbs/contracts.ts` に `BulkBbsRequestSchema` を追加
4. テストを `packages/foundation/contracts/src/common/index.test.ts` に追加

#### 受け入れ条件

- 重複IDと参照不整合が `safeParse` で失敗する

---

### 方針 3：ハンドラーの DTO 変換をマッパー層へ分離

#### 目的

- `auth.ts` 内の重複したレスポンス組み立て処理を 1 箇所に集約する

#### 追加・変更

- 新規: `packages/adapters/http-hono/src/mappers/auth.ts`
- 新規: `packages/adapters/http-hono/src/mappers/index.ts`
- 変更: `packages/adapters/http-hono/src/handlers/auth.ts`

#### 実装ステップ

1. `toLoginResponse(userData, sessionData)` を作成
2. `auth.ts` の3箇所（login/verify-mfa/oauth-callback）をこの関数に置換
3. 置換後も `LoginResponseSchema.parse(...)` で最終検証する

#### 受け入れ条件

- `handlers/auth.ts` 内に同形の `user/session -> LoginResponse` 変換ロジックが重複しない

---

### 方針 4：型ガードライブラリ（`kind` 判定）の追加

#### 目的

- union の分岐を型ガードで明示し、アプリ層の分岐を簡潔にする

#### 追加・変更

- 新規: `packages/foundation/contracts/src/guards/resource.ts`
- 新規: `packages/foundation/contracts/src/guards/index.ts`
- 変更: `packages/foundation/contracts/src/index.ts`

```typescript
export function isKind<K extends string>(kind: K) {
  return (value: unknown): value is { kind: K } =>
    typeof value === 'object' &&
    value !== null &&
    (value as Record<string, unknown>).kind === kind;
}
```

#### 実装ステップ

1. `isKind` を実装
2. `contracts/index.ts` から `guards` を re-export
3. BBS 側で `isThread`/`isComment` を必要に応じて定義

#### 受け入れ条件

- `kind` 判定で型が狭まり、`as` キャストなしで分岐できる

---

### 方針 7：AI feature flag ミドルウェア

#### 目的

- リクエストごとに AI 関連機能の有効・無効を切り替える

#### 追加・変更

- 新規: `packages/adapters/http-hono/src/middleware/featureFlag.ts`
- 変更: `packages/adapters/http-hono/src/middleware/index.ts`
- 変更: `packages/adapters/http-hono/src/index.ts`

#### 実装ステップ

1. `FeatureFlags` 型を `index.ts`（または専用型ファイル）に定義
2. `AppEnv['Variables']` に `featureFlags` を追加
3. `featureFlagMiddleware` を実装し `app.use('*', ...)` へ組み込み

#### 受け入れ条件

- `c.get('featureFlags')` が型付きで利用できる
- `X-Feature-AI` または環境変数で挙動が切り替わる

---

## 設計先行（今回は契約定義のみ）

### 方針 5：双方向メッセージスキーマ

#### スコープ

- 新規: `packages/foundation/contracts/src/events/client.ts`
- 新規: `packages/foundation/contracts/src/events/server.ts`
- 変更: `packages/foundation/contracts/src/index.ts`

#### 重要ルール

- `ClientEvent` は HTTP の入力/WS受信 payload として扱う
- `AppEnv` に `clientEvent` は置かない（環境変数とメッセージ契約を分離）

---

### 方針 6：ストリーム完了シグナル

#### スコープ

- `packages/foundation/contracts/src/common/index.ts` に以下を追加
  - `StreamStatusSchema = z.enum(['partial', 'complete', 'error'])`
  - `createStreamResponseSchema(itemSchema)`

#### 設計メモ

- `PaginationResultSchema` とは別用途として定義し、統合は後続判断

---

### 方針 8：AI生成バリデーション + リトライ

#### スコープ

- 新規: `packages/foundation/app-core/src/ai/validateWithRetry.ts`（設計のみ）

#### 設計メモ

- 実装時に `zod-to-json-schema` を導入
- 失敗時エラーは「再生成用プロンプト」と「監査ログ」を分離

---

## 実装順（依存関係を反映）

| 優先 | 方針 | 主な作業 | 工数目安 |
|---|---|---|---|
| 1 | 方針1 | BBSフラットDTO導入 | 2〜4時間 |
| 2 | 方針2 | 参照整合性`superRefine` + テスト | 2〜3時間 |
| 3 | 方針3 | authマッパー分離 | 1〜2時間 |
| 4 | 方針4 | `kind`型ガード追加 | 1時間 |
| 5 | 方針7 | feature flag ミドルウェア | 0.5〜1時間 |
| 6 | 方針5 | events契約定義のみ | 1〜2時間 |
| 7 | 方針6 | stream status 契約定義のみ | 0.5〜1時間 |
| 8 | 方針8 | validateWithRetry の設計メモ反映 | 0.5時間 |

---

## 先に決めておく運用ルール

- HTTPハンドラーは「入力検証」「ユースケース呼び出し」「マッパー呼び出し」の3責務に限定
- DTO変換は `mappers/` 配下に置く
- `contracts` 配下の union は必ず discriminated union（`kind` か `eventType`）を使う
- 参照を持つフラット配列には `withReferenceIntegrity` を適用する
