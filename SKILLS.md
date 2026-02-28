# SKILLS.md

## Conversation Archive Skill (for OpenClaw/webchat/Discord bridging)

このリポジトリでは、会話を `chat_sessions` / `chat_messages` に保存し、必要時に LIKE 検索で横断参照します。

### 目的
- チャネル（webchat / discord など）を跨いだ会話の引き継ぎ
- 指示履歴・決定事項の検索

### API
- `GET /api/v1/chat/sessions` セッション一覧
- `POST /api/v1/chat/sessions` セッション作成
- `GET /api/v1/chat/sessions/:id` セッション取得
- `PATCH /api/v1/chat/sessions/:id` セッション更新
- `DELETE /api/v1/chat/sessions/:id` セッション削除（ソフトデリート）
- `GET /api/v1/chat/sessions/:id/messages` メッセージ一覧
- `POST /api/v1/chat/sessions/:id/messages` メッセージ作成
- `GET /api/v1/chat/messages/search?q=<keyword>` LIKE 検索

### 運用ルール（現段階）
- 保持期間・自動削除は未設定（後日検討）
- 検索はまず LIKE で十分。将来的に FTS / embeddings へ拡張可能
- 会話保存の最小単位は 1メッセージ1レコード

### UI
- `/chat-sessions` に CRUD + LIKE 検索 UI を実装済み
