import Link from "next/link";
import styles from "./page.module.css";
import { ExamLevelBadge } from "@/components/hud/ExamLevelBadge";

/**
 * 「色彩図鑑とは」イントロページ。The-Algorithm-Illustratedのbasics/page.tsxパターンを転用し、
 * 色彩図鑑の目的・色彩検定との関係・数値データ(HSV/Lab)の読み方を解説する固定ページとして配置する。
 */
export default function BasicsPage() {
  return (
    <div className={styles.page}>
      <Link href="/" className={styles.backLink}>
        ← 色図鑑に戻る
      </Link>
      <header className={styles.header}>
        <p className={styles.eyebrow}>■ BASICS はじめての方へ</p>
        <h1 className={styles.title}>色彩図鑑とは? HSV/Labの読み方は?</h1>
        <p className={styles.lead}>
          このサイトの各詳細ページを読む前に知っておくと理解が早まる、色彩図鑑の狙いと数値データの読み方をまとめました。
        </p>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionLabel}>■ WHAT このサイトの狙い</h2>
        <p className={styles.paragraph}>
          ColorEncyclopedia(色彩図鑑)は、色相・彩度・明度・配色理論といった色のモチーフを<strong>数値データとして体系化</strong>し、カタログ・詳細・可視化の3層で見せる学習ダッシュボードです。感覚的に「なんとなく合う配色」を選ぶのではなく、色相環上の角度・WCAGコントラスト比といった具体的な数値に基づいて配色を判断できるようになることを目指しています。
        </p>
        <p className={styles.paragraph}>
          扱うコンテンツは<Link href="/" className={styles.link}>色(色相・彩度・明度・配色理論)</Link>と
          <Link href="/shapes" className={styles.link}>図形(比例・分割・対称性・平面充填)</Link>の2カテゴリで、独立したディレクトリ(
          <code className={styles.code}>content/colors/</code> / <code className={styles.code}>content/shapes/</code>)で管理されています。
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionLabel}>■ EXAM 色彩検定との関係</h2>
        <p className={styles.paragraph}>
          各色エントリには、色彩検定(色彩検定協会)の出題範囲を意識した<code className={styles.code}>examLevel</code>(
          <ExamLevelBadge level="1級" /> <ExamLevelBadge level="2級" /> <ExamLevelBadge level="3級" /> <ExamLevelBadge level="UC級" />
          の4区分)を付与しています。ただし著作権保護された過去問の全文転載は避け、要旨・自作問題ベースで構成しているため、実際の出題内容そのものではない点に注意してください。
        </p>
        <p className={styles.paragraph}>
          級別に問題を解きたい場合は<Link href="/exam" className={styles.link}>検定対策ページ</Link>から、
          対応する色エントリの詳細ページへ直接ジャンプできます。
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionLabel}>■ HSV HSVの読み方</h2>
        <p className={styles.paragraph}>
          HSVは色を<strong>色相(Hue)</strong>・<strong>彩度(Saturation)</strong>・<strong>明度(Value)</strong>の3属性で表す方式です。
        </p>
        <dl className={styles.propertyList}>
          <div className={styles.propertyRow}>
            <dt className={styles.propertyTerm}>色相(H)</dt>
            <dd className={styles.propertyDesc}>0〜360°の角度。色相環上の位置を表し、赤(0°)→黄→緑→青→紫と一周する</dd>
          </div>
          <div className={styles.propertyRow}>
            <dt className={styles.propertyTerm}>彩度(S)</dt>
            <dd className={styles.propertyDesc}>0〜100%。色の鮮やかさ・純粋さの度合い。0%は無彩色(グレー)</dd>
          </div>
          <div className={styles.propertyRow}>
            <dt className={styles.propertyTerm}>明度(V)</dt>
            <dd className={styles.propertyDesc}>0〜100%。色の明るさ・暗さの度合い。0%は黒</dd>
          </div>
        </dl>
        <p className={styles.paragraph}>
          <Link href="/colors" className={styles.link}>色図鑑</Link>の各詳細ページにある<strong>色相環(HueWheelVisualizer)</strong>
          は、この色相を角度、彩度を中心からの距離として円盤上に表現しています。
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionLabel}>■ LAB Labの読み方</h2>
        <p className={styles.paragraph}>
          Lab(CIE Lab)は人間の知覚に近い形で色を表現する国際規格の色空間です。<code className={styles.code}>L*</code>
          (明度・0〜100)、<code className={styles.code}>a*</code>(緑〜赤方向、マイナスが緑・プラスが赤)、
          <code className={styles.code}>b*</code>(青〜黄方向、マイナスが青・プラスが黄)の3値で色を一意に表します。HSVが「人間が色を選ぶときの直感」に寄っているのに対し、Labは「機器や測色計で色差を測る」用途に向いた表現方式です。
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionLabel}>■ CONTRAST WCAGコントラスト比とは</h2>
        <p className={styles.paragraph}>
          このサイトは選択した色に応じてサイト全体のテーマが変化する独自機能を持っていますが、任意の色を選ぶ以上、可読性を静的デザインだけでは保証できません。そこでW3Cの定めるWCAG(Web Content Accessibility Guidelines)のコントラスト比計算式を使い、通常テキストでAA基準(4.5:1)を下回る組み合わせになった場合は安全なフォールバックテーマに自動的に切り替える設計になっています。
        </p>
        <p className={styles.paragraph}>
          この計算式は<Link href="/compare" className={styles.link}>比較ビュー</Link>の各色エントリ詳細ページにある
          <strong>ContrastVisualizer</strong>でも共有されており、2色を選ぶとリアルタイムにコントラスト比とAA/AAA基準の適合・未達を確認できます。
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionLabel}>■ NEXT 次に読むと良いページ</h2>
        <p className={styles.paragraph}>
          準備ができたら、<Link href="/" className={styles.link}>色図鑑</Link>または
          <Link href="/shapes" className={styles.link}>図形図鑑</Link>から気になるエントリを選んで詳細ページを開いてみてください。複数のエントリを並べて比較したい場合は
          <Link href="/compare" className={styles.link}>比較画面</Link>も活用してください。
        </p>
      </section>
    </div>
  );
}
