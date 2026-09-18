# ボウリングレーン スコアリング分析システム(フロントエンド)

スポーツボウリング場運営システム構想 第五弾のフロントエンドです。React(Vite)で構築しています。

## 概要

第五弾のバックエンド([bowling-lane-scoring-system](https://github.com/Junko-Takahashi-Cloud/bowling-lane-scoring-system))が提供するAPIと接続し、投球データの分析結果を画面として表示・操作するためのアプリケーションです。

## 画面構成

- **会員向けダッシュボード**: 会員本人がログイン(会員コード/電話番号+PIN)し、自分の成績(総ゲーム数・平均スコア・投球傾向・フレーム内訳・ギア別成績・直近のゲーム)を確認できる画面
- **スタッフ向けダッシュボード**: センター全体のサマリー・レーン別成績・コンディション(オイルパターン)別成績を確認できる画面

## 技術スタック

- React 19 (Vite)
- axios(API通信)
- Recharts(グラフ描画)

## セットアップ

```bash
npm install
```

`.env.example`を`.env`にコピーし、必要なトークンを設定してください。

```bash
cp .env.example .env
```

```bash
npm run dev
```

`http://localhost:5173` で起動します。バックエンド(`bowling-lane-scoring-system`)を別途起動しておく必要があります。

## 関連リポジトリ

- [bowling-lane-scoring-system](https://github.com/Junko-Takahashi-Cloud/bowling-lane-scoring-system)(バックエンド)