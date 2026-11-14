# 第 5 回 忘れる頃に出す(間隔反復)

> 所要時間の目安: 2.5 時間 / 前提: 第 4 回

## この回のゴール

- ライトナー式の**箱**で、次の出題日が決まる仕組みを説明できる。
- **元の状態を変えない**更新(不変)の利点を説明できる。
- **保存されたデータを疑う**(検証・読み飛ばし)方法を説明できる。

## 1. 箱

検定問題を、**間違えた直後はすぐ**、**正解を重ねるほど間を空けて**出す。

| 箱 | 0 | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| 次の出題まで(日) | 0 | 1 | 3 | 7 | 14 | 30 |

- **正解** → 箱が 1 つ上がる(最大 5)。**不正解** → **箱 0 に戻る**(すぐ再出題)。
- 日数は**学習の目安**で、記憶の最適値を主張するものではない(コードのコメントにも明記)。

```typescript
// 抜粋ファイル: src/lib/spaced-repetition.ts
export const BOX_INTERVAL_DAYS = [0, 1, 3, 7, 14, 30] as const;
const box = isCorrect ? Math.min((prev?.box ?? 0) + 1, MAX_BOX) : 0;
due: now + BOX_INTERVAL_DAYS[box] * DAY_MS,
return { ...state, [questionId]: next };
```

```javascript
// 実行できる
(async () => {
  const s = await import("./src/lib/spaced-repetition.ts");
  const DAY = 24 * 60 * 60 * 1000;
  const t0 = Date.UTC(2026, 0, 1);

  let state = {};
  const days = (id) => (state[id].due - t0) / DAY;

  state = s.recordAnswer(state, "q1", true, t0);
  console.log("1 回正解: 箱", state.q1.box, "→ 次まで", days("q1"), "日");
  state = s.recordAnswer(state, "q1", true, t0);
  state = s.recordAnswer(state, "q1", true, t0);
  console.log("3 回正解: 箱", state.q1.box, "→ 次まで", days("q1"), "日");
  state = s.recordAnswer(state, "q1", false, t0);
  console.log("間違える: 箱", state.q1.box, "→ 次まで", days("q1"), "日 / 正解", state.q1.correct, "不正解", state.q1.wrong);

  let many = {};
  for (let i = 0; i < 8; i++) many = s.recordAnswer(many, "q2", true, t0);
  console.log("8 回正解しても箱の上限:", many.q2.box);

  // 元の状態は変わらない(新しい状態を返す)
  const before = {};
  const after = s.recordAnswer(before, "q3", true, t0);
  console.log("元の状態:", JSON.stringify(before), "新しい状態のキー:", Object.keys(after));

  // 出題してよい問題: 期限が来たもの(古い順)
  state = s.recordAnswer({}, "a", true, t0);
  state = s.recordAnswer(state, "b", false, t0);
  console.log("今日:", s.dueQuestionIds(state, ["a", "b"], t0));
  console.log("1 日後:", s.dueQuestionIds(state, ["a", "b"], t0 + DAY));
  console.log("知らない id は出さない:", s.dueQuestionIds(state, ["a"], t0 + DAY));
})();
```

```text
# 出力
1 回正解: 箱 1 → 次まで 1 日
3 回正解: 箱 3 → 次まで 7 日
間違える: 箱 0 → 次まで 0 日 / 正解 3 不正解 1
8 回正解しても箱の上限: 5
元の状態: {} 新しい状態のキー: [ 'q3' ]
今日: [ 'b' ]
1 日後: [ 'b', 'a' ]
知らない id は出さない: [ 'a' ]
```

- **不変**: `recordAnswer` は、**渡された状態を書き換えず**、新しい状態を返す。React の `useSyncExternalStore` のように「**変わったか**」を参照の比較で見る仕組みと相性がよい。

## 2. 保存データを疑う

解答の履歴は、**ブラウザの `localStorage`**(キー `ce:review:v1`)に保存する。**その中身は信用しない**(古い版・壊れた文字列・削除された問題の id)。

```javascript
// 実行できる
(async () => {
  const s = await import("./src/lib/spaced-repetition.ts");
  const t0 = Date.UTC(2026, 0, 1);
  const known = ["q1", "q2"];

  let state = s.recordAnswer({}, "q1", true, t0);
  state = s.recordAnswer(state, "q2", false, t0);
  const text = s.serializeReview(state, t0);

  // 書き出し → 読み込み
  const ok = s.parseReviewExport(text, known);
  console.log("読み込み:", ok.ok, "件数:", Object.keys(ok.records).length, "捨てた:", ok.skipped);

  // 問題が削除された(知らない id は読み込まない)
  console.log("q2 が無くなった後:", s.parseReviewExport(text, ["q1"]).skipped, "件を捨てる");

  // 壊れたデータ・別の版
  console.log(s.parseReviewExport("{", known));
  console.log(s.parseReviewExport(JSON.stringify({ version: 99, records: {} }), known));

  // 数が不正なレコードは捨てる。範囲外の箱は丸める
  const dirty = { q1: { box: 99, due: 1, last: 1, correct: 2, wrong: -3 }, q2: { box: "x" } };
  console.log(JSON.stringify(s.sanitizeRecords(dirty, known)));

  // 2 つの端末の履歴を結合: 同じ問題は、最後に答えた時刻が新しい方
  const a = { q1: { box: 1, due: 0, last: 100, correct: 1, wrong: 0 } };
  const b = { q1: { box: 3, due: 0, last: 200, correct: 3, wrong: 0 } };
  console.log("結合後の箱:", s.mergeReviewStates(a, b).q1.box);
})();
```

```text
# 出力
読み込み: true 件数: 2 捨てた: 0
q2 が無くなった後: 1 件を捨てる
{ ok: false, error: 'JSONとして読み込めませんでした。' }
{ ok: false, error: '対応していないバージョンのファイルです。' }
{"q1":{"box":5,"due":1,"last":1,"correct":2,"wrong":0}}
結合後の箱: 3
```

- 読み込みは、**形式(version)・各レコードの数・知らない id** を検査し、**合わないものは捨てて**、捨てた数を知らせる。
- 範囲外の値は、**丸めて取り込む**(箱は 0〜5、回数は 0 以上)。
- **端末を変える**と履歴は失われる(localStorage は端末ごと)ので、`/exam` から **JSON の書き出し・読み込み**ができる。結合は、**新しく答えた方**を採る。

## 確認問題

1. 間違えたとき、箱はどうなりますか。次の出題はいつですか。
2. `recordAnswer` が、元の状態を書き換えないのは、なぜ良いですか。
3. 保存されたデータを、そのまま使わず `sanitizeRecords` を通すのは、なぜですか。
4. 2 つの端末の履歴を結合するとき、同じ問題はどちらを採りますか。

## 解答

1. 箱 0 に戻り、次の出題は期限なし(すぐ再出題)。
2. 変わったかを参照の比較で判断でき、元の状態を、別の場所で安全に使い続けられる。
3. 古い版・壊れた値・削除された問題の id が混ざっていても、画面や計算が壊れないようにするため。
4. 最後に答えた時刻(`last`)が新しい方。

## まとめ

- 箱 0〜5 と間隔(0・1・3・7・14・30 日)。不正解は箱 0。
- 更新は**不変**。保存データは**検証して**取り込む(捨てた数を知らせる)。
- これで講義は終わり。続きは [学習資料](../learn/index.md)。
