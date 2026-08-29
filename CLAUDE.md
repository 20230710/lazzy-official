# Lazzy Official Website — 引き継ぎメモ

Vsingerユニット「Lazzy」（音琴うい・子守うたり）の公式サイト。素のHTML/CSS/JS（フレームワークなし、ビルド不要）。

## ファイル構成

```
index.html        トップページ（Hero / Profile / Movie / Schedule / Guideline / Works / Footer）
guideline.html    ガイドライン単独ページ（下層ページ扱い）
css/style.css     全スタイル（このファイル1本のみ）
js/script.js      ヘッダー制御・メニュー開閉・スクロール表示アニメーション
images/           画像素材（hero.png がメインビジュアルの元画像）
svg/              SVG素材置き場（ユーザーが直接ファイルを置くこともある）
```

デプロイ先: GitHubリポジトリ [`komoriuta0308/lazzy-official`](https://github.com/komoriuta0308/lazzy-official)（直下にファイルを配置、`lazzy-official-site/`のような入れ子構造にはしない）。

## デザイントークン（css/style.css の `:root`）

色・フォントは必ずここで定義された変数を使う。ベタ書きのhex値を新規に追加しない。
- 暗い背景の文字色 = `--color-text-light`（白）、明るい背景の文字色 = `--color-text-dark`（#2d3a5a）という2色に統一されている。
- ブランド色を追加するときは `--color-hero-navy` (#2d3a5a) / `--color-hero-gold` (#d5c28a) / `--color-marquee-navy` (#1d253a) のように用途名で追加し、rgba()で透過が必要なものは `--xxx-rgb: r, g, b;` の形でセットにする（`rgba(var(--xxx-rgb), 0.5)` のように使う）。
- 日本語フォント = Zen Kaku Gothic New（`--font-jp` / `--font-body`）、英語見出し = Comfortaa（`--font-heading` / `--font-logo`）。Comfortaaは和文グリフを持たないため、混在テキストは特に指定しなくても和文だけ自動でフォールバックされる。

## 主要コンポーネントの構造メモ

- **ヒーローセクション**: `.hero-art`（メインビジュアル）は `images/hero.png` を `object-fit: cover` でトリミング表示。位置は `top` / `width` / `aspect-ratio` で調整する。ページ読み込み時にフェードインするアニメーション（`hero-art-in` キーフレーム）が `both` フィルモードで常時適用されているため、後から `transform` を上書きしても反映されない（キーフレーム側を編集する必要がある）。
- **ヘッダーのナビ／ハンバーガー**: `#navToggle` ボタンは意図的に `<header>` の**外**（bodyの直下）に置いてある。理由: `.site-header` が `position: fixed` + `z-index` を持つため独自のstacking contextを作ってしまい、中に入れると開いたフルスクリーンメニュー（`z-index:200`）より奥に埋もれてしまう不具合があった。ボタンの表示/非表示は `display` ではなく `opacity` + `pointer-events` の切り替えでアニメーションさせている（スクロールでのナビ⇔ハンバーガー切り替えを滑らかにするため）。
- **フルスクリーンメニュー**: ハンバーガー1つで開閉両方を兼用（開くボタンと閉じるボタンが別々だった時期があったが統合した）。
- **フッター**: 高さ固定240px、左に「ロゴ＋SNSアイコン」、右に「ナビ→サブリンク→コピーライト」を`justify-content:space-between`で配置する2カラム構成。
- **マーキー**: 「Lazzy」の文字と「✦」を別要素（`.marquee-word` / `.marquee-star`）に分けて、`margin-right`を全要素に均等適用することでループの継ぎ目を含めて間隔を完全に揃えている（詳細は下記「学んだこと」参照）。
- **スクロール表示アニメーション**: `js/script.js` の `IntersectionObserver` が `.section-title` `.reveal` `.reveal-stagger` を監視し、画面に入ったら `is-visible` クラスを付与してCSSトランジションで見せる。新しい要素をフェードインさせたい時は該当要素にこれらのクラスを付けるだけでよい（`.reveal-stagger` は子要素に `.reveal-item` を付けると `nth-child` で自動的に時間差がつく／nth-childは8番目まで定義済み）。

## 開発時の運用ルール（このユーザーとの合意事項）

- **CSS変更のたびに、コミットする前に必ずユーザーに確認する。** 確認なしにコミット・pushしない。
- 数値の微調整（px単位）は何度も繰り返されるので、都度全体を作り直さず該当箇所だけ差分編集する。
- 「やっぱりなしで」と言われたら `git restore` で直前のコミット状態に戻す（このセッション中に何度も発生した）。

## 動作確認（プレビュー）の注意点

- ローカルでの見た目確認は `python3 -m http.server <port>` を使う。**編集のたびにポート番号を変えて再起動する**こと。同じポートのままブラウザで再読み込みすると、このBrowserプレビューペインはCSSを強くキャッシュしてしまい、変更が反映されないことが非常に多かった。
- スクロール操作（`computer` の `scroll` やJSの `scrollIntoView`）の直後にスクリーンショットを撮ると、真っ白（アイボリー一色）の画像が返ってくることがある。これは実際のページの不具合ではなく、プレビューペインの描画タイミングの問題。数値検証（`getBoundingClientRect` や `getComputedStyle` をJSで取得）を優先し、スクリーンショットは複数回リトライするか、`navigate`し直してから撮る。
- ごく稀に、特定のDOM要素に対して `getComputedStyle(el).opacity` だけが実際の値を反映しない現象が観測された（`transform` や `background-color` など他のプロパティは正しく読めるのに `opacity` だけ古い値を返し続けた）。CSSのルール自体は `matches()` やCSSOMで検証して正しいことを確認済みで、実ブラウザでは問題なく動作するはず。**opacityの検証だけで判断せず、他のプロパティや実際のスクリーンショットも併用して裏取りする**こと。

## 学んだこと（同じ沼にはまらないためのメモ）

1. **`flex-basis` は `flex-direction` が変わると効く軸も変わる。**
   `.member-photo` に `flex: 0 0 283px;`（横並び時の幅指定のつもり）を設定していたところ、モバイル幅で `.member-row` が `flex-direction: column` に切り替わった瞬間、その283pxが「主軸＝縦方向」のサイズとして解釈され、`height`の指定を無視して正方形に潰れる不具合が起きた。
   → 対策: 幅と高さを両方明示したい要素には `flex: 0 0 auto;` を使い、実際のサイズは `width` / `height` プロパティ側で決める。

2. **`margin` の実際の効き所は、一番外側の要素とは限らない（マージン相殺）。**
   見出しとリストの間隔を「wrapper divの `margin-top`」で調整しようとしたが、実際に効いていたのは中の `<ul>` 自身が持っていた `margin-top`（親子間でマージンが相殺＝伝播していた）。狙った間隔にならない時は、直接の子要素にある `margin` も疑うこと。

3. **マーキーのループを完全に途切れなく見せるには、"間隔"を全部同じ仕組みで作る。**
   最初は2つの `<span>` に長いテキストをまとめて入れ、末尾のスペース文字と要素間の `padding-right` を別々に管理していたため、ループの継ぎ目だけ間隔が不揃いになった。
   → 対策: 1語1要素に分解し、**すべての要素に同じ `margin-right`** を付ける。境目だけ特別扱いしない設計にすると、複製して並べたときに継ぎ目が完全に均一になる。

4. **色・フォントサイズの指定はなるべく `:root` のトークン経由にする。**
   一度ベタ書きの hex を混入させると、後から「サイト全体の配色を変えて」と言われたときに探すのが大変になる。都度トークン化する一手間を惜しまない。
