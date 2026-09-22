# AI Factory

## 目的
AIを最大限活用し、小規模なWebサービス・アプリ・コンテンツなどを継続的に企画・制作・公開・改善し、月5〜10万円の収益を目指す。

## 役割

### 編集長（User）
- 最終的な採用判断
- アカウント作成など本人しかできない操作
- 必要な実機確認
- 重要な意思決定

### PM（ChatGPT）
- プロジェクト全体の進行管理
- 市場・競合調査
- 企画立案
- 要件定義
- 制作支援
- テスト設計
- 集客施策の立案
- データ分析
- 改善案の作成
- 次に必要な作業の指示

## 基本方針
編集長の作業量を可能な限り減らす。

ChatGPT側で実行できる作業はChatGPTが行い、
編集長本人の操作が必要な場合のみ具体的な作業を依頼する。

## Production Loop

IDEA
↓
RESEARCH
↓
EDITOR DECISION
↓
BUILD
↓
TEST
↓
PUBLISH
↓
MARKETING
↓
MEASURE
↓
ANALYZE
↓
IMPROVE / NEXT IDEA

## 編集長への作業指示ルール
1. 原則として一度に1つの作業だけ依頼する
2. 作業内容と目的を必ず説明する
3. 必要な回答が得られるまで次の作業へ進まない
4. 必要な回答形式がある場合は明示する
5. スクリーンショットは必要な場合のみ依頼する
6. ChatGPT側でできる作業を編集長に依頼しない

## 標準公開・計測基盤

AI Factoryで制作するWebサービスは、原則として以下の構成を標準とする。

ChatGPT（PM）
↓
GitHub（コード・バージョン管理）
↓
Cloudflare Workers（公開・自動デプロイ）
↓
Google Analytics 4（アクセス計測・分析）

### 運用ルール

- GitHubのmainブランチへのコミットをCloudflare Workersへ自動デプロイする
- 公開後は必ず実サイトの動作確認を行う
- GA4を導入し、実際にアクセスが計測されることを確認する
- Cloudflare Workersの無料枠を基本とする
- Lovableは必須ツールとせず、UI試作や開発速度を上げたい場合の補助ツールとして使用する
- 有料サービスの導入は、必要性と収益性を確認したうえで編集長が判断する

### 基盤動作確認

2026-09-22
`rental-report-checker` を使用して以下を確認済み。

- GitHub → Cloudflare Workers 初回デプロイ
- workers.devでの一般公開
- Webアプリの正常動作
- Cloudflare Workers → GA4 計測
- GitHubへのコミット → Cloudflare Workers 自動再デプロイ
