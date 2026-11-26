import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const sourcePath = path.join(root, "app/components/our-solution.tsx");
const outputPath = path.join(root, "app/components/our-solution-ja.tsx");
const catalogPath = path.join(root, "lib/i18n/solutions-ja.json");
const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
const sourceText = fs.readFileSync(sourcePath, "utf8");
const source = ts.createSourceFile(sourcePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let translated = 0;
const dataKeys = new Set([
  "World", "Europe", "United States", "Japan", "Taiwan", "Australia", "China", "Other markets",
  "SHREDDING", "HOT_KNIFE", "PVCIRCULATOR",
  "Silver", "Glass", "Aluminium", "Copper", "Silicon", "EVA", "Backsheet",
]);

function translatedText(value) {
  if (dataKeys.has(value)) return value;
  const result = catalog[value];
  if (typeof result === "string") translated += 1;
  return typeof result === "string" ? result : value;
}

const transformer = (context) => {
  const { factory } = context;
  const visit = (node) => {
    if (ts.isStringLiteral(node)) {
      const value = translatedText(node.text);
      return value === node.text ? node : factory.createStringLiteral(value);
    }
    if (ts.isNoSubstitutionTemplateLiteral(node)) {
      const value = translatedText(node.text);
      return value === node.text ? node : factory.createNoSubstitutionTemplateLiteral(value);
    }
    if (ts.isJsxText(node)) {
      const raw = node.getText(source);
      const leading = raw.match(/^\s*/)?.[0] ?? "";
      const trailing = raw.match(/\s*$/)?.[0] ?? "";
      const core = raw.slice(leading.length, raw.length - trailing.length);
      const value = translatedText(core);
      return value === core ? node : factory.createJsxText(`${leading}${value}${trailing}`, false);
    }
    return ts.visitEachChild(node, visit, context);
  };
  return (rootNode) => ts.visitNode(rootNode, visit);
};

const result = ts.transform(source, [transformer]);
const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
let output = printer.printFile(result.transformed[0]);
result.dispose();
output = output
  .replace('export function OurSolution(', 'export function OurSolutionJa(')
  .replace('<PublicHeader assistantInlineLinks', '<PublicHeader locale="ja-JP" assistantInlineLinks')
  .replaceAll('toLocaleString("en-US"', 'toLocaleString("ja-JP"')
  .replace('document.documentElement.classList.add("os-section-scroll");', 'document.documentElement.lang = "ja";\n        document.documentElement.classList.add("os-section-scroll");')
  .replaceAll('useState<RetirementMarket>("United States")', 'useState<RetirementMarket>("Japan")')
  .replaceAll('useState<DemandMarket>("United States")', 'useState<DemandMarket>("Japan")')
  .replace('className={`pv-review os-page${lightNavigation ? " pv-light-nav" : ""}`}', 'lang="ja" className={`pv-review os-page os-page-ja${lightNavigation ? " pv-light-nav" : ""}`}')
  .replace('>Skip to Our Solution</a>', '>ソリューションへスキップ</a>')
  .replace('<h1 id="os-title">Owners pay less.<br />Recyclers earn more.<br />Materials stay in circulation.</h1>', '<h1 id="os-title">所有者の負担を軽減。<br />リサイクル事業者の利益を向上。<br />材料の循環を維持。</h1>')
  .replace('<h2>Installed solar capacity grows from {capacityFirst.totalLabel} to {capacityLast.totalLabel} by {capacityLast.year}.</h2>', '<h2>{capacityLast.year} 年までに太陽光の累積導入容量が {capacityFirst.totalLabel} から {capacityLast.totalLabel} へ拡大</h2>')
  .replace('heading={<>Simple principle.<br />Layer by layer.<br />Material by material.</>}', 'heading={<>シンプルな原理。<br />層ごとに。<br />材料ごとに。</>}')
  .replace('<h2 id="value-title">Silver is only {pct(ag.share, 2)} of panel weight—but {pct(ag.valueShare)} of material value.</h2><span className="os-value-thesis">Silver is the most direct route to higher recovery value.</span>', '<h2 id="value-title">銀はパネル重量のわずか {pct(ag.share, 2)}、材料価値では {pct(ag.valueShare)}</h2><span className="os-value-thesis">銀は回収価値を高める最も直接的な手段です。</span>')
  .replace('<h2 id="evidence-title">Every panel gets a record:<br /><span>origin, process, destination.</span></h2>', '<h2 id="evidence-title">すべての太陽光パネルに記録を：<br /><span>出所、処理工程、行き先。</span></h2>')
  .replaceAll('<strong>Origin</strong>', '<strong>出所</strong>')
  .replaceAll('<strong>Process</strong>', '<strong>処理工程</strong>')
  .replaceAll('<strong>Destination</strong>', '<strong>行き先</strong>')
  .replaceAll('<strong>Owners</strong>', '<strong>所有者</strong>')
  .replaceAll('<strong>Material buyers</strong>', '<strong>材料購入者</strong>')
  .replaceAll('<strong>Generate at the machine</strong>', '<strong>設備側で記録を生成</strong>')
  .replaceAll('<strong>Lock data integrity</strong>', '<strong>データの完全性を保護</strong>')
  .replaceAll('<strong>Scale storage with every machine</strong>', '<strong>設備とともにストレージを拡張</strong>')
  .replaceAll('<strong>Verify efficiently at scale</strong>', '<strong>大規模でも効率的に検証</strong>')
  .replaceAll('<strong>Disclose selectively</strong>', '<strong>必要な情報だけを開示</strong>')
  .replaceAll('<strong>Local price comparison in preparation</strong>', '<strong>日本の価格比較は準備中です</strong>')
  .replaceAll('This edition uses the uploaded country parameter set. Public processing-price and landfill comparisons appear only after approved local data are available.', 'この版はアップロード済みの日本向け後台パラメーターを使用しています。処理料金と埋立費用の比較は、承認済みの国内公開データが揃ってから掲載します。')
  .replace('>Explore EasyCycle <Arrow /></Link>', '>EasyCycle を詳しく見る <Arrow /></Link>')
  .replace('["economic", "Economic"]', '["economic", "経済性"]');
output = `/* Generated by scripts/generate-ja-solutions.mjs. Edit the English source or translation catalog, then regenerate. */\n${output}`;

if (translated < 350) throw new Error(`Only ${translated} Japanese strings were applied; expected at least 350.`);
fs.writeFileSync(outputPath, output);
console.log(`Generated ${path.relative(root, outputPath)} with ${translated} translated string occurrences.`);
