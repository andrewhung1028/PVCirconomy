'use client';
import {solutionLabel as defaultSolutionLabel} from '../../lib/business-case/solution-labels';
import {formatCurrency} from '../../lib/region-format';
import {localizedPublicPath, type OurSolutionLocale, type PublicSolutionMarket} from '../../lib/our-solution/market';
import {businessCaseMarketForCountry, initialBusinessCaseRegion} from '../../lib/business-case/market';
import type {Region} from '../../lib/business-case/types';
import japaneseCopy from '../../lib/i18n/business-case-ja.json';
import chineseCopy from '../../lib/i18n/business-case-zh.json';
import {PublicHeader} from '../components/public-header';

import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

const CALCULATE_TIMEOUT_MS = 20000;

/* =========================================================
   FORMATTERS
========================================================= */

const money = (n: number, currency: string) =>
  formatCurrency(n, {currency}, {maximumFractionDigits: 0});

const money2 = (n: number, currency: string) =>
  formatCurrency(n, {currency}, {minimumFractionDigits: 2, maximumFractionDigits: 2});

const countryNamesJa = new Intl.DisplayNames('ja-JP', {type: 'region'});
const countryNamesZh = new Intl.DisplayNames('zh-TW', {type: 'region'});
const labelsZh: Record<string, string> = {
  CONVENTIONAL: '破碎法', HOT_KNIFE: '熱處理法', GLASS: '玻璃', ALUMINUM: '鋁', COPPER: '銅', EVA: 'EVA',
  BACKSHEET: '背板', SILICON: '矽', SILVER: '銀', JUNCTION_BOX: '接線盒', RESIDUAL: '殘餘物',
  LABOR: '人事費', LABOR_BURDEN: '人事附加費', WORKERS_COMP: '職災保險',
  FACILITY: '場地租金與管理費', ELECTRICITY: '電費', CONSUMABLES: '耗材',
  MAINTENANCE: '維護費', HANDLING: '叉車及搬運費', PACKAGING: '包裝費',
  INSURANCE: '保險與合規費', ADMIN: '設施與行政費', TREATMENT: '二次處理費',
};
const regionsZh: Record<string, string> = {
  'US-CA': '加州', 'US-TX': '德州', 'US-NY': '紐約州', 'US-WA': '華盛頓州', 'JP': '日本',
  'AU-ACT': '首都領地', 'AU-NSW': '新南威爾斯州', 'AU-NT': '北領地', 'AU-QLD': '昆士蘭州',
  'AU-SA': '南澳州', 'AU-TAS': '塔斯馬尼亞州', 'AU-VIC': '維多利亞州', 'AU-WA': '西澳州',
};
const sectionsZh: Record<string, string> = {
  overview: '概覽', operation: '營運條件', 'business-case': '試算結果', 'business-summary': '摘要',
  comparison: '比較', support: '業務支援', solution: '解決方案', 'follow-up': '聯絡我們',
};
const regionsJa: Record<string, string> = {
  'US-AL': 'アラバマ州', 'US-AK': 'アラスカ州', 'US-AZ': 'アリゾナ州', 'US-AR': 'アーカンソー州',
  'US-CA': 'カリフォルニア州', 'US-CO': 'コロラド州', 'US-CT': 'コネチカット州', 'US-DE': 'デラウェア州',
  'US-FL': 'フロリダ州', 'US-GA': 'ジョージア州', 'US-HI': 'ハワイ州', 'US-ID': 'アイダホ州',
  'US-IL': 'イリノイ州', 'US-IN': 'インディアナ州', 'US-IA': 'アイオワ州', 'US-KS': 'カンザス州',
  'US-KY': 'ケンタッキー州', 'US-LA': 'ルイジアナ州', 'US-ME': 'メイン州', 'US-MD': 'メリーランド州',
  'US-MA': 'マサチューセッツ州', 'US-MI': 'ミシガン州', 'US-MN': 'ミネソタ州', 'US-MS': 'ミシシッピ州',
  'US-MO': 'ミズーリ州', 'US-MT': 'モンタナ州', 'US-NE': 'ネブラスカ州', 'US-NV': 'ネバダ州',
  'US-NH': 'ニューハンプシャー州', 'US-NJ': 'ニュージャージー州', 'US-NM': 'ニューメキシコ州', 'US-NY': 'ニューヨーク州',
  'US-NC': 'ノースカロライナ州', 'US-ND': 'ノースダコタ州', 'US-OH': 'オハイオ州', 'US-OK': 'オクラホマ州',
  'US-OR': 'オレゴン州', 'US-PA': 'ペンシルベニア州', 'US-RI': 'ロードアイランド州', 'US-SC': 'サウスカロライナ州',
  'US-SD': 'サウスダコタ州', 'US-TN': 'テネシー州', 'US-TX': 'テキサス州', 'US-UT': 'ユタ州',
  'US-VT': 'バーモント州', 'US-VA': 'バージニア州', 'US-WA': 'ワシントン州', 'US-WV': 'ウェストバージニア州',
  'US-WI': 'ウィスコンシン州', 'US-WY': 'ワイオミング州',
  'CA-AB': 'アルバータ州', 'CA-BC': 'ブリティッシュコロンビア州', 'CA-MB': 'マニトバ州', 'CA-NB': 'ニューブランズウィック州',
  'CA-NL': 'ニューファンドランド・ラブラドール州', 'CA-NS': 'ノバスコシア州', 'CA-ON': 'オンタリオ州',
  'CA-PE': 'プリンスエドワードアイランド州', 'CA-QC': 'ケベック州', 'CA-SK': 'サスカチュワン州',
  'CA-NT': 'ノースウエスト準州', 'CA-NU': 'ヌナブト準州', 'CA-YT': 'ユーコン準州',
  'AU-ACT': '首都特別地域', 'AU-NSW': 'ニューサウスウェールズ州', 'AU-NT': 'ノーザンテリトリー',
  'AU-QLD': 'クイーンズランド州', 'AU-SA': '南オーストラリア州', 'AU-TAS': 'タスマニア州',
  'AU-VIC': 'ビクトリア州', 'AU-WA': '西オーストラリア州',
};
const labelsJa: Record<string, string> = {
  CONVENTIONAL: '破砕法', HOT_KNIFE: '熱処理法',
  GLASS: 'ガラス', ALUMINUM: 'アルミニウム', COPPER: '銅', EVA: 'EVA',
  BACKSHEET: 'バックシート', SILICON: 'シリコン', SILVER: '銀', JUNCTION_BOX: 'ジャンクションボックス', RESIDUAL: '残さ',
  LABOR: '人件費', LABOR_BURDEN: '人件費の付随費用', WORKERS_COMP: '労災補償費',
  FACILITY: '施設費・賃料・共益費', ELECTRICITY: '電力費', CONSUMABLES: '消耗品費',
  MAINTENANCE: '保守費', HANDLING: 'フォークリフト・荷役費', PACKAGING: '梱包費',
  INSURANCE: '保険・法令対応費', ADMIN: '施設の光熱費・管理費', TREATMENT: '二次処理費',
};

const sections = [
  ['overview', 'Overview', '概要'],
  ['operation', 'Operation', '運転条件'],
  ['business-case', 'Results', '試算結果'],
  ['business-summary', 'Summary', '概要'],
  ['comparison', 'Comparison', '比較'],
  ['support', 'Support', '事業支援'],
  ['solution', 'Solution', 'ソリューション'],
  ['follow-up', 'Follow up', 'お問い合わせ'],
] as const;

/* =========================================================
   HELPERS
========================================================= */

function normalizeRate(value: any) {
  const n = Number(value || 0);
  return n > 1 ? n / 100 : n;
}

function toArray(value: any): any[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).map(
      ([key, item]: [string, any]) => {
        if (item && typeof item === 'object') {
          return {
            code:
              item.code ||
              item.materialCode ||
              item.parameterCode ||
              key,
            ...item,
          };
        }

        return {
          code: key,
          name: key,
          value: Number(item || 0),
        };
      }
    );
  }

  return [];
}

function materialKey(x: any) {
  return (
    x?.code ||
    x?.materialCode ||
    x?.material_code ||
    x?.name ||
    x?.material ||
    ''
  );
}

function materialName(x: any, fallback: string) {
  return (
    x?.name ||
    x?.material ||
    x?.materialName ||
    x?.material_name ||
    fallback
  );
}

function materialRevenueValue(x: any) {
  return Number(
    x?.revenue ??
      x?.materialRevenue ??
      x?.saleableRevenue ??
      x?.annualRevenue ??
      x?.annualMaterialRevenue ??
      x?.recoveredMaterialRevenue ??
      x?.value ??
      0
  );
}

function opexKey(x: any) {
  return (
    x?.code ||
    x?.parameterCode ||
    x?.parameter ||
    x?.name ||
    ''
  );
}

function opexName(x: any, fallback: string) {
  return (
    x?.label ||
    x?.name ||
    x?.parameter ||
    x?.opexParameter ||
    fallback
  );
}

function opexValue(x: any) {
  return Math.abs(
    Number(
      x?.value ??
        x?.annualCost ??
        x?.annual_cost ??
        x?.cost ??
        0
    )
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function Page({sourceLabel, locale = 'en-US', initialRegion, requestedMarket, initialMonthlyVolume}: {
  sourceLabel: string;
  locale?: OurSolutionLocale;
  initialRegion?: string;
  initialMonthlyVolume?: string;
  requestedMarket?: PublicSolutionMarket;
}) {
  const japanese = locale === 'ja-JP';
  const chinese = locale === 'zh-TW';
  const localized = chinese || japanese;
  const copy: Record<string, string> = chinese ? chineseCopy : japanese ? japaneseCopy : {};
  const t = (english: string) => copy[english] ?? english;
  const text = (en: string, ja: string, zh: string) => chinese ? zh : japanese ? ja : en;
  const number = (n: number, digits = 0) => new Intl.NumberFormat(locale, {
    maximumFractionDigits: digits, minimumFractionDigits: digits,
  }).format(Number(n || 0));
  const localizedLabel = (code: string, fallback: string) => (chinese ? labelsZh : japanese ? labelsJa : {})[code] ?? fallback;
  const solutionLabel = (code: string, name: string) => localizedLabel(code, defaultSolutionLabel(code, name));
  const countryLabel = (name: string, code?: string) => localized && code ? (chinese ? countryNamesZh : countryNamesJa).of(code) ?? name : name;
  const [currentSource,setCurrentSource]=useState(sourceLabel);
  const [data, setData] = useState<any>(null);

  const [region, setRegion] = useState('');
  const [country, setCountry] = useState('');
  const monthlyVolume = initialMonthlyVolume && /^\d+$/.test(initialMonthlyVolume) ? Number(initialMonthlyVolume) : NaN;
  const transferredPanels = Number.isSafeInteger(monthlyVolume) && monthlyVolume > 0 ? monthlyVolume : undefined;
  const [panels, setPanels] = useState(transferredPanels ?? 5000);
  const [fee, setFee] = useState(0.2);
  const [activeSection, setActiveSection] = useState('overview');

  const primary = 'PVCIRCULATOR';

  const [compare, setCompare] =
    useState('CONVENTIONAL');

  const [result, setResult] =
    useState<any>(null);

  const [busy, setBusy] =
    useState(false);

  const [msg, setMsg] =
    useState('');

  const [materialOpen, setMaterialOpen] =
    useState(false);

  const [opexOpen, setOpexOpen] =
    useState(false);

  // Only the latest Calculate request may update the page. Changing an input
  // cancels an in-flight request so a slow or stale response cannot leave the
  // button stuck on CALCULATING… or show results for a different region.
  const calcSeq = useRef(0);
  const calcAbort = useRef<AbortController | null>(null);

  function invalidateCalc() {
    calcSeq.current += 1;
    calcAbort.current?.abort();
    calcAbort.current = null;
    setBusy(false);
    setResult(null);
  }

  useEffect(() => () => calcAbort.current?.abort(), []);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActiveSection(visible.target.id);
    }, { rootMargin: '-30% 0px -50% 0px' });
    for (const [id] of sections) {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    }
    return () => observer.disconnect();
  }, [Boolean(result)]);

  /* =======================================================
     LOAD MASTER DATA
  ======================================================= */

  useEffect(() => {
    fetch('/api/calculator-data/')
      .then((r) => {
        if (!r.ok) throw Error('Calculator data unavailable');
        return r.json();
      })
      .then((d) => {
        setData(d);
        if(d.source)setCurrentSource(d.source);

        const regions: Region[] = d.regions ?? [];
        const selected = initialBusinessCaseRegion(regions, requestedMarket, initialRegion);
        setRegion(selected?.code ?? '');
        setCountry(selected?.country ?? '');
        if (transferredPanels === undefined && selected?.code === 'JP' && d.japan) setPanels(d.japan.defaultPanels);

        const compareSolutions =
          d.solutions?.filter(
            (x: any) =>
              x.code !== 'PVCIRCULATOR' &&
              x.active !== false
          ) || [];

        if (
          compareSolutions.length &&
          !compareSolutions.some(
            (x: any) =>
              x.code === 'CONVENTIONAL'
          )
        ) {
          setCompare(
            compareSolutions[0].code
          );
        }
      })
      .catch(() => {
        setMsg(
          'Unable to load calculator data.'
        );
      });
  }, [initialRegion, requestedMarket, transferredPanels]);

  /* =======================================================
     MASTER DATA LOOKUPS
  ======================================================= */

  const reg = useMemo(
    () =>
      data?.regions?.find(
        (x: any) =>
          x.code === region
      ),
    [data, region]
  );
  const regionalSolutions = region === 'JP' ? data?.japan?.solutions : data?.solutions;

  const countries = useMemo<string[]>(() => {
    const regions = (data?.regions || []).filter(
      (x: any) => x.active !== false
    );
    const countryNames: string[] = regions
      .map((x: any) => String(x.country || "").trim())
      .filter((name: string) => name.length > 0);
    return [...new Set<string>(countryNames)].sort((a, b) => a.localeCompare(b));
  }, [data]);

  const countryRegions = useMemo(() =>
    (data?.regions || []).filter((x: any) =>
      x.active !== false && x.country === country
    ).sort((a: any, b: any) => String(a.region).localeCompare(String(b.region))),
    [data, country]
  );

  function changeCountry(nextCountry: string) {
    setCountry(nextCountry);
    const nextRegion = (data?.regions || []).find((x: any) =>
      x.country === nextCountry && x.active !== false
    );
    setRegion(nextRegion?.code || '');
    if (nextRegion?.defaultFee != null) setFee(Number(nextRegion.defaultFee));
    if (transferredPanels === undefined) {
      if (nextRegion?.code === 'JP') setPanels(data.japan.defaultPanels);
      else if (region === 'JP') setPanels(5000);
    }
    invalidateCalc();
  }

  function changeRegion(nextCode: string) {
    setRegion(nextCode);
    const next = (data?.regions || []).find((x: any) => x.code === nextCode);
    if (next?.defaultFee != null) setFee(Number(next.defaultFee));
    invalidateCalc();
  }

  const pvSolution = useMemo(
    () =>
      regionalSolutions?.find(
        (x: any) =>
          x.code === primary
      ),
    [regionalSolutions]
  );

  useEffect(() => {
    if (reg?.defaultFee != null) {
      setFee(
        Number(reg.defaultFee)
      );
    }
  }, [region, reg?.defaultFee]);

  /* =======================================================
     PROCESSING SCHEDULE
  ======================================================= */

  // Use the selected country's SharePoint OPEX assumptions.
  // Support both the raw SharePoint field names and normalized API rows.
  const scheduleParameters = useMemo(() => {
    const countryCode = String(reg?.countryCode || '').trim().toUpperCase();
    const rows = (data?.opex || []).filter((row: any) =>
      String(row.countryCode ?? row['Country Code'] ?? '').trim().toUpperCase() === countryCode &&
      row.active !== false && row.Active !== false &&
      String(row.active ?? row.Active ?? 'true').toLowerCase() !== 'false'
    );

    function readParameter(suffix: string, description: string): number | null {
      const row = rows.find((item: any) => {
        const code = String(
          item.parameterCode ?? item['OPEX Parameter Code'] ?? item.Title ?? item.code ?? item.parameter ?? ''
        ).trim().toUpperCase();
        const label = String(item.parameter ?? item['OPEX Parameter'] ?? '').trim().toLowerCase();
        return code === suffix || code === `${countryCode}-${suffix}` || label === description;
      });
      if (!row) return null;
      const raw = row.value ?? row.Value;
      if (raw === null || raw === undefined || raw === '') return null;
      const value = Number(String(raw).replace(/,/g, ''));
      return Number.isFinite(value) && value > 0 ? value : null;
    }

    return {
      days: readParameter('OPERATING_DAYS_MONTH', 'operating days'),
      hours: readParameter('OPERATING_HOURS_DAY', 'operating hours'),
    };
  }, [data?.opex, reg?.countryCode]);

  const operatingDays = scheduleParameters.days;
  const standardHours = scheduleParameters.hours;
  const pvCapacity = Number(pvSolution?.capacity || 0);
  const scheduleReady = operatingDays !== null && standardHours !== null && pvCapacity > 0;

  const requiredHoursPerDay =
    scheduleReady && panels > 0
      ? panels / operatingDays! / pvCapacity
      : 0;

  const nominalMonthlyCapacity = scheduleReady
    ? pvCapacity * operatingDays! * standardHours!
    : 0;

  const capacityUtilization = nominalMonthlyCapacity > 0
    ? panels / nominalMonthlyCapacity
    : 0;

  const scheduleExceeded = scheduleReady && requiredHoursPerDay > standardHours!;
  const equipmentCapacityExceeded = scheduleReady && requiredHoursPerDay > 24;
  const progressWidth = Math.min(Math.max(capacityUtilization * 100, 0), 100);

  /* =======================================================
     CALCULATE
  ======================================================= */

  async function calc() {
    calcAbort.current?.abort();
    const seq = ++calcSeq.current;
    const controller = new AbortController();
    calcAbort.current = controller;
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, CALCULATE_TIMEOUT_MS);
    const current = () => seq === calcSeq.current;
    setBusy(true);
    setResult(null);
    setMsg('');
    setMaterialOpen(false);
    setOpexOpen(false);

    try {
      const r = await fetch(
        '/api/calculate/',
        {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            regionCode: region,
            panelsPerMonth: panels,
            processingFee: fee,
            solutionCodes: [
              primary,
              compare,
            ],
          }),
        }
      );

      const j = await r.json();
      if (!current()) return;

      if (!r.ok) {
        setMsg(
          localized ? 'Calculation failed' : j.error || 'Calculation failed'
        );
        return;
      }

      setResult(j.result);
      if(j.source)setCurrentSource(j.source);

      setTimeout(() => {
        document
          .getElementById(
            'business-case'
          )
          ?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
      }, 150);
    } catch {
      if (!current()) return;
      setMsg(
        timedOut ? 'Calculation timed out. Please try again.' : 'Calculation failed.'
      );
    } finally {
      clearTimeout(timer);
      if (current()) {
        calcAbort.current = null;
        setBusy(false);
      }
    }
  }

  /* =======================================================
     FOLLOW UP
  ======================================================= */

  async function save(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!result) return;

    const fd =
      new FormData(
        e.currentTarget
      );

    try {
      const r = await fetch(
        '/api/follow-up',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            result,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            name: fd.get('name'),
            email:
              fd.get('email'),
            company:
              fd.get('company'),
            customerCountry:
              fd.get('country'),
            intent:
              fd.get('intent'),
          }),
        }
      );

      const j = await r.json();

      setMsg(
        r.ok
          ? j.emailStatus === 'accepted'
            ? chinese ? `試算已儲存（編號：${j.calculationId}）。請查閱信箱與垃圾郵件。` : japanese ? `試算結果を保存しました（受付番号：${j.calculationId}）。メールの受信箱と迷惑メールフォルダーをご確認ください。` : `Business case saved: ${j.calculationId}. Email submitted for delivery; please check your inbox and spam folder.`
            : j.emailStatus === 'failed'
              ? chinese ? `試算已儲存，但郵件未送出。聯絡時請提供編號 ${j.calculationId}。` : japanese ? `試算結果を保存しましたが、メールを送信できませんでした。受付番号 ${j.calculationId} を添えてお問い合わせください。` : `Business case saved: ${j.calculationId}, but email could not be sent. Please contact us with this reference.`
              : chinese ? `試算已儲存。自動郵件尚未設定，聯絡時請提供編號 ${j.calculationId}。` : japanese ? `試算結果を保存しました。自動メールは未設定です。受付番号 ${j.calculationId} を添えてお問い合わせください。` : `Business case saved: ${j.calculationId}. Automatic email is not configured yet; please contact us with this reference.`
          : localized ? 'Save failed' : j.error || 'Save failed'
      );
    } catch {
      setMsg(
        'Unable to save business case.'
      );
    }
  }

  /* =======================================================
     RESULT LOOKUPS
  ======================================================= */

  const pvResult =
    result?.solutions?.find(
      (s: any) =>
        s.code ===
        'PVCIRCULATOR'
    ) ||
    result?.solutions?.[0];

  const compareResult =
    result?.solutions?.find(
      (s: any) =>
        s.code === compare
    ) ||
    result?.solutions?.[1];

  const currency =
    result?.region?.currency ||
    reg?.currency ||
    'USD';

  /* =======================================================
     BUSINESS CASE
  ======================================================= */

  const processingAdvantage =
    (pvResult?.processingRevenue || 0) -
    (compareResult?.processingRevenue || 0);

  const materialAdvantage =
    (pvResult?.materialRevenue || 0) -
    (compareResult?.materialRevenue || 0);

  const pvTotalRevenue =
    (pvResult?.processingRevenue || 0) +
    (pvResult?.materialRevenue || 0);

  const compareTotalRevenue =
    (compareResult?.processingRevenue || 0) +
    (compareResult?.materialRevenue || 0);

  const totalRevenueAdvantage =
    pvTotalRevenue -
    compareTotalRevenue;

  const opexAdvantage =
    (compareResult?.annualOpex || 0) -
    (pvResult?.annualOpex || 0);

  const ebitdaAdvantage =
    result?.comparison
      ?.ebitdaAdvantage ??
    (pvResult?.annualEbitda || 0) -
      (compareResult?.annualEbitda || 0);
  const exactEbitdaAdvantage = money(ebitdaAdvantage, currency);
  const showEbitdaInManYen = japanese && currency === 'JPY' && Math.abs(ebitdaAdvantage) >= 10_000;

  const opexReduction =
    result?.comparison
      ?.opexReduction ??
    (compareResult?.annualOpex > 0
      ? (compareResult.annualOpex -
          (pvResult?.annualOpex || 0)) /
        compareResult.annualOpex
      : 0);

  const annualPanels =
    Number(panels || 0) * 12;

  const additionalMaterialValuePerPanel =
    annualPanels > 0
      ? materialAdvantage /
        annualPanels
      : 0;

  const residualReduction =
    compareResult?.residualMetricTons >
    0
      ? (compareResult.residualMetricTons -
          (pvResult?.residualMetricTons ||
            0)) /
        compareResult.residualMetricTons
      : 0;

  const pvOpexPerPanel =
    annualPanels > 0
      ? (pvResult?.annualOpex || 0) /
        annualPanels
      : 0;

  const compareOpexPerPanel =
    annualPanels > 0
      ? (compareResult?.annualOpex ||
          0) /
        annualPanels
      : 0;

  const pvRecovery =
    pvResult?.materialRecoveryRate ??
    pvResult?.recoveryRate ??
    null;

  const compareRecovery =
    compareResult?.materialRecoveryRate ??
    compareResult?.recoveryRate ??
    null;

  /* =======================================================
     MATERIAL DETAILS
  ======================================================= */

  const pvMaterials =
    toArray(
      pvResult?.materials ??
      pvResult?.materialDetail ??
      pvResult?.materialDetails ??
      pvResult?.materialBreakdown
    );

  const compareMaterials =
    toArray(
      compareResult?.materials ??
      compareResult?.materialDetail ??
      compareResult?.materialDetails ??
      compareResult?.materialBreakdown
    );

  const materialCodes =
    Array.from(
      new Set([
        ...pvMaterials.map(
          (x: any) =>
            materialKey(x)
        ),
        ...compareMaterials.map(
          (x: any) =>
            materialKey(x)
        ),
      ])
    ).filter(Boolean);

  /* =======================================================
     OPEX DETAILS
  ======================================================= */

  const pvOpex =
    toArray(
      pvResult?.opexDetail ??
      pvResult?.opexDetails ??
      pvResult?.opexBreakdown ??
      pvResult?.opex
    );

  const compareOpex =
    toArray(
      compareResult?.opexDetail ??
      compareResult?.opexDetails ??
      compareResult?.opexBreakdown ??
      compareResult?.opex
    );

  const opexCodes =
    Array.from(
      new Set([
        ...pvOpex.map(
          (x: any) =>
            opexKey(x)
        ),
        ...compareOpex.map(
          (x: any) =>
            opexKey(x)
        ),
      ])
    ).filter(Boolean);

  /* =======================================================
     RENDER
  ======================================================= */

  const selectedSource = region === 'JP' ? data?.japan?.source ?? currentSource : currentSource === data?.japan?.source ? data.source : currentSource;
  const sourceVersion = selectedSource.match(/^Published master v(\d+)$/)?.[1];
  const source = chinese
    ? sourceVersion ? `已發布的主資料 v${sourceVersion}` : selectedSource === 'Built-in fallback' ? '內建基準資料' : selectedSource === 'Japan Our Solution parameters' ? '日本解決方案參數' : selectedSource
    : japanese
    ? sourceVersion ? `公開済みマスターデータ v${sourceVersion}` : selectedSource === 'Built-in fallback' ? '内蔵の基準データ' : selectedSource === 'Japan Our Solution parameters' ? '日本向けソリューションの設定値' : selectedSource
    : selectedSource;
  const selectedMarket = (reg && businessCaseMarketForCountry(reg.countryCode))
    ?? requestedMarket ?? businessCaseMarketForCountry(initialRegion?.split('-')[0] ?? '')
    ?? (japanese ? 'JP' : 'US');
  const languageQuery = `?market=${selectedMarket}${reg ? `&region=${encodeURIComponent(region)}` : ''}`;
  const marketUnavailable = Boolean(requestedMarket && data && !data.regions?.some(
    (item: Region) => businessCaseMarketForCountry(item.countryCode) === requestedMarket,
  ));
  const lightNavigation = !['overview', 'business-summary', 'follow-up'].includes(activeSection);
  const methodologyHref = `${localizedPublicPath(locale, '/business-case/methodology/')}?region=${encodeURIComponent(region)}`;

  return (
    <div className={`pv-review bc-shell${lightNavigation ? ' pv-light-nav' : ''}`} data-section={activeSection}>
      <a className="pv-skip" href="#operation">{text('Skip to operating inputs', '運転条件の入力へスキップ', '跳至營運條件')}</a>
      <PublicHeader locale={locale} solid={lightNavigation} solutionMarket={selectedMarket} marketPath="/business-case/" languagePath="/business-case/" languageQuery={languageQuery} assistantTechnologyAnchor="#solution" />
      <nav className="pv-dots" aria-label={text('Business Case sections', '事業収支シミュレーターのセクション', '營運試算章節')}>
        {sections.filter(([id]) => result || ['overview', 'operation', 'follow-up'].includes(id)).map(([id, en, ja]) => (
          <a key={id} href={`#${id}`} aria-current={activeSection === id ? 'step' : undefined}><i /><span>{chinese ? sectionsZh[id] : japanese ? ja : en}</span></a>
        ))}
      </nav>
      <main className="site">

      {/* HERO */}

      <section id="overview" className="hero">

        <video
          className="heroVideo"
          autoPlay
          muted
          loop
          playsInline
        >
          <source
            src="/videos/pv-circulator-operation.mp4"
            type="video/mp4"
          />
        </video>

        <div className="pageShell heroContent">

          <p className="eyebrow">
            {t("PV CIRCULATOR® / BUSINESS CASE")}
          </p>

          <h1>
            {text('What if you treat PV', '太陽光パネルを', '自行回收太陽能板，')}
            <br />
            {text('in-house?', '自社で処理したら？', '營運成本是多少？')}
          </h1>

          <p className="heroLede">
            {t("Enter your monthly panel volume. In 60 seconds, see your annual EBITDA, payback period and the value you’re leaving in conventional recycling.")}
          </p>

        </div>

      </section>

      {/* YOUR OPERATION */}

      <section id="operation" className="section operationSection">
        <div className="pageShell">

          <div className="sectionIntro">

            <p className="sectionEyebrow">
              {t("YOUR OPERATION")}
            </p>

            <h2>
              {t("Start with your operation.")}
            </h2>
            <p className="bc-source" role="status">{source}</p>
            {marketUnavailable && <p className="bc-source" role="status">{text(
              'Calculator data for this market is currently unavailable. Choose another country to continue.',
              'この市場の試算データは現在ご利用いただけません。別の国を選択してください。',
              '目前無法載入此市場的試算資料。請選擇其他國家繼續。',
            )}</p>}

          </div>

          <div className="operationTopRow">
            <label className="field">
              <span className="fieldLabel">{t("Country")}</span>
              <select value={country} onChange={(e) => changeCountry(e.target.value)}>
                {!country && <option value="" disabled>{text("Choose a country", "国を選択", "選擇國家")}</option>}
                {countries.map((name: string) => (
                  <option key={name} value={name}>{countryLabel(name, data?.regions?.find((item: Region) => item.country === name)?.countryCode)}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="fieldLabel">{t("Operating region")}</span>
              <select disabled={!country || countryRegions.length === 1 && countryRegions[0].region === country} value={region} onChange={(e) => changeRegion(e.target.value)}>
                {countryRegions.map((x: any) => (
                  <option key={x.code} value={x.code}>{localized ? (chinese ? regionsZh : regionsJa)[x.code] ?? (x.region === x.country ? countryLabel(x.country, x.countryCode) : x.region) : x.region}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="fieldLabel">{t("Panels / month")}</span>
              <input
                type="number"
                min="0"
                step={transferredPanels !== undefined ? '1' : region === 'JP' ? '0.01' : '1000'}
                value={panels}
                aria-label={t("Panels per month")}
                onChange={(e) => {
                  const next = e.target.valueAsNumber;
                  if (Number.isFinite(next)) {
                    setPanels(Math.max(0, next));
                    invalidateCalc();
                  }
                }}
              />
            </label>
          </div>

          <div className="operationBottomRow">
            <label className="field">
              <span className="fieldLabel">{t("Processing / tipping fee")}
                {reg?.feeUnit && <small>{reg.feeUnit}</small>}
              </span>
              <input type="number" min="0" step="any" value={fee}
                onChange={(e) => { setFee(Number(e.target.value)); invalidateCalc(); }} />
            </label>
            <label className="field">
              <span className="fieldLabel">{t("Compare PV Circulator with")}</span>
              <select value={compare} onChange={(e) => { setCompare(e.target.value); invalidateCalc(); }}>
                {regionalSolutions?.filter((x: any) =>
                  x.code !== 'PVCIRCULATOR' && x.active !== false
                ).map((x: any) => (
                  <option key={x.code} value={x.code}>{solutionLabel(x.code, x.name)}</option>
                ))}
              </select>
            </label>
            <button className="calculateButton" onClick={calc} disabled={busy || !reg}>
              <span>{busy ? t("CALCULATING…") : t("CALCULATE BUSINESS CASE")}</span>
              {!busy && <span>→</span>}
            </button>
          </div>

          {/* SCHEDULE */}

          <div className="schedule">
            <p className="scheduleLabel">{t("REQUIRED PROCESSING SCHEDULE")}</p>

            <div className="scheduleMain">
              <strong>
                {!scheduleReady
                  ? t("Operating schedule unavailable")
                  : equipmentCapacityExceeded
                    ? t("Additional equipment required")
                    : scheduleExceeded
                      ? t("Exceeds standard shift capacity")
                      : t("Within standard shift capacity")}
              </strong>
              {scheduleReady && (
                <span>{number(requiredHoursPerDay, 1)} {' '}{t("processing hours/day")}</span>
              )}
            </div>

            <div className="scheduleTrack" role="progressbar"
              aria-label={t("Single-shift capacity utilization")}
              aria-valuenow={scheduleReady ? Math.round(capacityUtilization * 100) : 0}
              aria-valuemin={0} aria-valuemax={100}>
              <div
                className={`scheduleProgress${equipmentCapacityExceeded ? ' scheduleProgressCritical' : scheduleExceeded ? ' scheduleProgressWarning' : ''}`}
                style={{ width: `${progressWidth}%` }}
              />
            </div>

            <div className="scheduleInsight">
              {scheduleReady ? (
                chinese ? <p>依所選營運地區，每月運轉 <strong>{number(operatingDays!, 2)} 天</strong>，每條線每小時可處理 <strong>{number(pvCapacity)} 片</strong>。標準班次每日 {number(standardHours!, 1)} 小時。
                  每月處理 {number(panels)} 片時，每日需要 {number(requiredHoursPerDay, 1)} 小時。{equipmentCapacityExceeded ? '超過單條線每日 24 小時上限，需增加設備。' : scheduleExceeded ? '請延長運轉時間或增加班次。' : '可於標準班次內完成。'}
                </p> : japanese ? <p>
                  選択した国の稼働日数は月間 <strong>{number(operatingDays!, 2)} 日</strong>、1ラインの処理能力は <strong>毎時 {number(pvCapacity)} 枚</strong> です。標準シフトは1日 {number(standardHours!, 1)} 時間です。
                  月間 {number(panels)} 枚の処理には、1日 {number(requiredHoursPerDay, 1)} 時間が必要です。
                  {equipmentCapacityExceeded
                    ? '1日の上限である24時間を超えるため、設備を追加する必要があります。'
                    : scheduleExceeded ? '稼働時間を延ばすか、シフトを追加してください。' : '標準シフト内で処理できます。'}
                </p> : <p>
                  Based on <strong>{number(operatingDays!, 2)} operating days/month</strong> in the selected country
                  and <strong>{number(pvCapacity)} panels/hour</strong> per line.
                  {' '}A standard shift is {number(standardHours!, 1)} hours/day.
                  {' '}{equipmentCapacityExceeded
                    ? `At ${number(panels)} panels/month, one line would require ${number(requiredHoursPerDay, 1)} hours/day—more than the 24-hour daily limit. Additional equipment is required.`
                    : scheduleExceeded
                      ? `At ${number(panels)} panels/month, ${number(requiredHoursPerDay, 1)} hours/day are required. Extend operating hours or add shifts to meet demand.`
                      : `At ${number(panels)} panels/month, ${number(requiredHoursPerDay, 1)} hours/day are required, within the standard shift.`}
                </p>
              ) : (
                <p>{t("Operating days or hours are missing from the selected country's SharePoint OPEX parameters. Verify OPERATING_DAYS_MONTH and OPERATING_HOURS_DAY.")}</p>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* RESULTS */}

      {result &&
        pvResult &&
        compareResult && (
          <>

            {/* BUSINESS CASE */}

            <section
              className="section businessSection"
              id="business-case"
            >
              <div className="pageShell">

                <div className="businessIntro">

                  <p className="sectionEyebrow">
                    {t("BUSINESS CASE")}
                  </p>

                  <h2>
                    {text('See where the economics', '試算結果の', '看懂營運收支')}
                    <br />
                    {text('come from.', '内訳を確認する。', '如何計算。')}
                  </h2>

                  <p className="sectionDescription">
                    {t("Annualized results using the same panel volume and recycling fee for both approaches.")}
                  </p>

                  <a
                    className="methodologyLink"
                    href={methodologyHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t("Read the Business Case calculation methodology (opens in a new tab)")}
                  >
                    {t("HOW WE CALCULATE THE BUSINESS CASE")}{' '} <span aria-hidden="true">↗</span>
                  </a>

                </div>

                <div className="businessTableWrap">

                  <table className="businessTable">

                    <thead>
                      <tr>

                        <th>
                          {t("Annual Business Case")}
                        </th>

                        <th>
                          {solutionLabel(compareResult.code, compareResult.name)}
                        </th>

                        <th>
                          PV Circulator
                        </th>

                        <th>
                          {t("PV Advantage")}
                        </th>

                      </tr>
                    </thead>

                    <tbody>

                      <tr>
                        <td>
                          {t("Processing revenue")}
                        </td>

                        <td>
                          {money(
                            compareResult.processingRevenue,
                            currency
                          )}
                        </td>

                        <td>
                          {money(
                            pvResult.processingRevenue,
                            currency
                          )}
                        </td>

                        <td>
                          {money(
                            processingAdvantage,
                            currency
                          )}
                        </td>
                      </tr>

                      {/* MATERIAL REVENUE */}

                      <tr>
                        <td>
                          <button
                            type="button"
                            className="tableExpandButton"
                            onClick={() =>
                              setMaterialOpen(
                                (v) => !v
                              )
                            }
                          >
                            <span className="tableExpandIcon">
                              {materialOpen
                                ? '−'
                                : '+'}
                            </span>

                            {t("Material revenue")}
                          </button>
                        </td>

                        <td>
                          {money(
                            compareResult.materialRevenue,
                            currency
                          )}
                        </td>

                        <td>
                          {money(
                            pvResult.materialRevenue,
                            currency
                          )}
                        </td>

                        <td className="positive">
                          {materialAdvantage >
                          0
                            ? '+'
                            : ''}

                          {money(
                            materialAdvantage,
                            currency
                          )}
                        </td>
                      </tr>

                      {materialOpen &&
                        materialCodes.map(
                          (code: any) => {
                            const p =
                              pvMaterials.find(
                                (x: any) =>
                                  materialKey(x) ===
                                  code
                              ) || {};

                            const c =
                              compareMaterials.find(
                                (x: any) =>
                                  materialKey(x) ===
                                  code
                              ) || {};

                            const pvValue =
                              materialRevenueValue(
                                p
                              );

                            const compareValue =
                              materialRevenueValue(
                                c
                              );

                            const advantage =
                              pvValue -
                              compareValue;

                            const label =
                              materialName(
                                p,
                                materialName(
                                  c,
                                  String(code)
                                )
                              );

                            return (
                              <tr
                                className="detailRow"
                                key={String(code)}
                              >
                                <td className="materialDetailName">
                                  {localizedLabel(String(code), label)}
                                </td>

                                <td>
                                  {money(
                                    compareValue,
                                    currency
                                  )}
                                </td>

                                <td>
                                  {money(
                                    pvValue,
                                    currency
                                  )}
                                </td>

                                <td
                                  className={
                                    advantage >= 0
                                      ? 'positive'
                                      : 'negative'
                                  }
                                >
                                  {advantage > 0
                                    ? '+'
                                    : ''}

                                  {money(
                                    advantage,
                                    currency
                                  )}
                                </td>
                              </tr>
                            );
                          }
                        )}

                      <tr className="strongRow">
                        <td>
                          {t("Total revenue")}
                        </td>

                        <td>
                          {money(
                            compareTotalRevenue,
                            currency
                          )}
                        </td>

                        <td>
                          {money(
                            pvTotalRevenue,
                            currency
                          )}
                        </td>

                        <td className="positive">
                          {totalRevenueAdvantage >
                          0
                            ? '+'
                            : ''}

                          {money(
                            totalRevenueAdvantage,
                            currency
                          )}
                        </td>
                      </tr>

                      {/* OPEX */}

                      <tr>
                        <td>
                          <button
                            type="button"
                            className="tableExpandButton"
                            onClick={() =>
                              setOpexOpen(
                                (v) => !v
                              )
                            }
                          >
                            <span className="tableExpandIcon">
                              {opexOpen
                                ? '−'
                                : '+'}
                            </span>

                            {t("OPEX")}
                          </button>
                        </td>

                        <td className="negative">
                          -
                          {money(
                            Math.abs(
                              compareResult.annualOpex
                            ),
                            currency
                          )}
                        </td>

                        <td className="negative">
                          -
                          {money(
                            Math.abs(
                              pvResult.annualOpex
                            ),
                            currency
                          )}
                        </td>

                        <td className="positive">
                          {opexAdvantage >
                          0
                            ? '+'
                            : ''}

                          {money(
                            opexAdvantage,
                            currency
                          )}
                        </td>
                      </tr>

                      {opexOpen &&
                        opexCodes.map(
                          (code: any) => {
                            const p =
                              pvOpex.find(
                                (x: any) =>
                                  opexKey(x) ===
                                  code
                              ) || {};

                            const c =
                              compareOpex.find(
                                (x: any) =>
                                  opexKey(x) ===
                                  code
                              ) || {};

                            const pvValue =
                              opexValue(p);

                            const compareValue =
                              opexValue(c);

                            const saving =
                              compareValue -
                              pvValue;

                            const label =
                              opexName(
                                p,
                                opexName(
                                  c,
                                  String(code)
                                )
                              );

                            return (
                              <tr
                                className="detailRow"
                                key={String(code)}
                              >
                                <td className="opexDetailName">
                                  {localizedLabel(String(code), label)}
                                </td>

                                <td className="negative">
                                  -
                                  {money(
                                    compareValue,
                                    currency
                                  )}
                                </td>

                                <td className="negative">
                                  -
                                  {money(
                                    pvValue,
                                    currency
                                  )}
                                </td>

                                <td
                                  className={
                                    saving >= 0
                                      ? 'positive'
                                      : 'negative'
                                  }
                                >
                                  {saving > 0
                                    ? '+'
                                    : ''}

                                  {money(
                                    saving,
                                    currency
                                  )}
                                </td>
                              </tr>
                            );
                          }
                        )}

                      <tr className="ebitdaRow">
                        <td>
                          {t("EBITDA / annual contribution")}
                        </td>

                        <td>
                          {money(
                            compareResult.annualEbitda,
                            currency
                          )}
                        </td>

                        <td>
                          {money(
                            pvResult.annualEbitda,
                            currency
                          )}
                        </td>

                        <td className="positive">
                          {ebitdaAdvantage >
                          0
                            ? '+'
                            : ''}

                          {money(
                            ebitdaAdvantage,
                            currency
                          )}
                        </td>
                      </tr>

                    </tbody>

                  </table>

                </div>

              </div>
            </section>

            {/* BUSINESS CASE SUMMARY — STANDALONE SECTION */}
            <section id="business-summary" className="section businessSummarySection">
              <div className="pageShell">
                <div className="decisionSummary">
                  <p className="sectionEyebrow light">{t("BUSINESS CASE SUMMARY")}</p>
                  <h2>
                    {chinese ? `年度 EBITDA：${money(pvResult.annualEbitda, currency)}` : japanese ? `年間 EBITDA：${money(pvResult.annualEbitda, currency)}` : `${money(pvResult.annualEbitda, currency)} in annual EBITDA.`}
                    <br />
                    {t("See what your recycling operation could achieve.")}
                  </h2>
                  <p className="summaryLead">{chinese ? <>
                    每月處理 {number(panels)} 片時，PV Circulator 與{solutionLabel(compareResult.code, compareResult.name)}的<strong>年度 EBITDA 差額為 {money(ebitdaAdvantage, currency)}</strong>。
                  </> : japanese ? <>
                    月間 {number(panels)} 枚を処理した場合、{solutionLabel(compareResult.code, compareResult.name)}に対する PV Circulator の<strong>年間 EBITDA 差額は {money(ebitdaAdvantage, currency)}</strong>です。
                  </> : <>
                    At {number(panels)} panels/month, PV Circulator delivers an estimated{' '}
                    <strong>{money(ebitdaAdvantage, currency)} more annual EBITDA</strong>{' '}
                    than {solutionLabel(compareResult.code, compareResult.name)}—turning cleaner recovery into stronger economics.
                  </>}</p>
                  {pvResult.simplePaybackYears > 0 && (
                    <p className="summaryPayback">
                      {t("Estimated standalone simple payback:")}{' '}
                      <strong>{number(pvResult.simplePaybackYears, 1)}{localized ? ' 年' : ' years'}</strong>{localized ? '。' : '.'}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* COMPARISON */}

            <section id="comparison" className="section comparisonSection">
              <div className="pageShell">

                <div className="comparisonIntro">

                  <p className="sectionEyebrow light">
                    {t("COMPARISON")}
                  </p>

                  <h2>
                    {text('PV Circulator vs. ', 'PV Circulator と', 'PV Circulator 與')}{solutionLabel(compareResult.code, compareResult.name)}{text('.', 'の比較', '的比較')}
                  </h2>

                  <p className="sectionDescription lightText">
                    {t("Compare annual economics, operating cost and recovered material value on the same processing basis.")}
                  </p>

                </div>

                <div className="comparisonKpis">

                  <div className="comparisonKpi">
                    <span>
                      {t("Annual EBITDA Advantage")}
                    </span>

                    <strong>
                      {showEbitdaInManYen ? `約 ${number(ebitdaAdvantage / 10_000)}万円` : exactEbitdaAdvantage}
                    </strong>

                    <small>
                      {showEbitdaInManYen ? `円単位：${exactEbitdaAdvantage}` : t("additional annual EBITDA")}
                    </small>
                  </div>

                  <div className="comparisonKpi">
                    <span>
                      {t("Operating Cost Reduction")}
                    </span>

                    <strong>
                      {number(
                        normalizeRate(
                          opexReduction
                        ) * 100
                      )}
                      %
                    </strong>

                    <small>
                      {t("vs.")}{' '} {solutionLabel(compareResult.code, compareResult.name)}
                    </small>
                  </div>

                  <div className="comparisonKpi">
                    <span>
                      {t("Additional Material Value")}
                    </span>

                    <strong>
                      {money2(
                        additionalMaterialValuePerPanel,
                        currency
                      )}
                    </strong>

                    <small>
                      {t("per processed panel")}
                    </small>
                  </div>

                  <div className="comparisonKpi">
                    <span>
                      {t("Residual Reduction")}
                    </span>

                    <strong>
                      {number(
                        normalizeRate(
                          residualReduction
                        ) * 100
                      )}
                      %
                    </strong>

                    <small>
                      {t("requiring secondary treatment")}
                    </small>
                  </div>

                </div>

                <div className="solutionCompare">

                  {/* PV */}

                  <article className="solutionCard solutionPrimary">

                    <div className="solutionCardTop">

                      <p className="solutionLabel">
                        PV CIRCULATOR®
                      </p>

                      <h3>
                      {text('Layer-by-layer separation.', '層ごとに分離する。', '逐層分離。')}
                        <br />
                      {text('Preserve more value.', '回収価値を高める。', '保留更多材料價值。')}
                      </h3>

                    </div>

                    <div className="solutionMetrics">

                      <div>
                        <span>
                          {t("Material recovery rate")}
                        </span>

                        <strong>
                          {pvRecovery != null
                            ? `${number(
                                normalizeRate(
                                  pvRecovery
                                ) * 100,
                                1
                              )}%`
                            : '—'}
                        </strong>
                      </div>

                      <div>
                        <span>
                          {t("Residual / mixed fraction")}
                        </span>

                        <strong>
                          {number(
                            pvResult.residualMetricTons,
                            1
                          )}{' '}
                          {t("t / yr")}
                        </strong>
                      </div>

                      <div>
                        <span>
                          {t("OPEX / panel")}
                        </span>

                        <strong>
                          {money2(
                            pvOpexPerPanel,
                            currency
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          {t("Annual EBITDA")}
                        </span>

                        <strong>
                          {money(
                            pvResult.annualEbitda,
                            currency
                          )}
                        </strong>
                      </div>

                    </div>

                  </article>

                  {/* COMPARE */}

                  <article className="solutionCard solutionCompareCard">

                    <div className="solutionCardTop">

                      <p className="solutionLabel">
                        {solutionLabel(compareResult.code, compareResult.name)}
                      </p>

                      <h3>
                      {text('Compare the same volume.', '同じ処理枚数で、', '以相同的處理量，')}
                        <br />
                      {text('See the economic difference.', '収支の違いを確認する。', '比較營運收支。')}
                      </h3>

                    </div>

                    <div className="solutionMetrics">

                      <div>
                        <span>
                          {t("Material recovery rate")}
                        </span>

                        <strong>
                          {compareRecovery != null
                            ? `${number(
                                normalizeRate(
                                  compareRecovery
                                ) * 100,
                                1
                              )}%`
                            : '—'}
                        </strong>
                      </div>

                      <div>
                        <span>
                          {t("Residual / mixed fraction")}
                        </span>

                        <strong>
                          {number(
                            compareResult.residualMetricTons,
                            1
                          )}{' '}
                          {t("t / yr")}
                        </strong>
                      </div>

                      <div>
                        <span>
                          {t("OPEX / panel")}
                        </span>

                        <strong>
                          {money2(
                            compareOpexPerPanel,
                            currency
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          {t("Annual EBITDA")}
                        </span>

                        <strong>
                          {money(
                            compareResult.annualEbitda,
                            currency
                          )}
                        </strong>
                      </div>

                    </div>

                  </article>

                </div>


              </div>
            </section>

            {/* BEYOND PROCESSING */}

            <section id="support" className="section beyondSection">
              <div className="pageShell">

                <div className="sectionIntro">
                  <p className="sectionEyebrow">{t("BEYOND PROCESSING")}</p>
                  <h2>{text('More than recycling equipment.', 'リサイクル設備の導入から、', '從導入回收設備，')}<br />{text('Build a business that works.', '採算の取れる事業づくりまで。', '到建立可獲利的營運模式。')}</h2>
                  <p className="sectionDescription">
                    {t("From feedstock development and flexible deployment to material offtake, upcycling and traceability, PV Circonomy helps recyclers build an economically viable PV recycling business.")}
                  </p>
                </div>

                <div className="beyondGrid">
                  <article>
                    <span>{t("FEEDSTOCK")}</span>
                    <h3>{t("Secure your feedstock.")}</h3>
                    <p>
                      {t("Access PV recycling opportunities through PV Circonomy's industry network and strategic partnerships to support a reliable processing pipeline.")}
                    </p>
                  </article>

                  <article>
                    <span>{t("DEPLOYABILITY")}</span>
                    <h3>{t("Deploy where it matters.")}</h3>
                    <p>
                      {t("Modular systems support on-site and near-site recycling, reducing transport costs.")}
                    </p>
                  </article>

                  <article>
                    <span>{t("MATERIAL VALUE")}</span>
                    <h3>{t("Recover more. Earn more.")}</h3>
                    <p>
                      {t("Preserve material quality through layer-by-layer separation, enabling higher recovery rates and greater revenue potential from recovered materials.")}
                    </p>
                  </article>

                  <article>
                    <span>{t("OFFTAKE")}</span>
                    <h3>{t("Move recovered materials.")}</h3>
                    <p>
                      {t("Downstream support helps create practical outlets for recovered material streams.")}
                    </p>
                  </article>

                  <article>
                    <span>{t("MATERIAL UPCYCLING")}</span>
                    <h3>{t("From materials to products.")}</h3>
                    <p>
                      {t("Unlock new revenue opportunities with PV Circonomy's material upcycling solutions—transforming recovered resources into marketable, value-added products.")}
                    </p>
                  </article>

                  <article>
                    <span>{t("TRACEABILITY")}</span>
                    <h3>{t("Make your value measurable.")}</h3>
                    <p>
                      {t("Digital traceability documents material recovery, supports lifecycle reporting, and helps demonstrate the environmental value of your recycling operation.")}
                    </p>
                  </article>
                </div>

                <div className="operationSupport">
                  <div>
                    <span>{t("FROM EQUIPMENT TO BUSINESS")}</span>
                    <h3>{text('Your recycling business.', 'リサイクル事業を、', '推進您的回收業務。')}<br />{text('Our expertise behind it.', '専門知識で支援します。', '我們提供專業支援。')}</h3>
                  </div>
                  <p>
                    {t("From equipment deployment and operator training to feedstock development, material offtake, upcycling, and traceability, PV Circonomy helps you build an economically viable PV recycling operation.")}
                  </p>
                </div>
              </div>
            </section>

            {/* SOLUTION */}

            <section id="solution" className="section solutionSection">
              <div className="pageShell">

                <div className="sectionIntro">

                  <p className="sectionEyebrow">
                    {t("SOLUTION")}
                  </p>

                  <h2>
                    {t("Explore the PV Circulator® solution.")}
                  </h2>

                  <p className="sectionDescription">
                    {t("Review the full PV Circulator solution, system configuration and lifecycle support.")}
                  </p>

                </div>

                <div className="brochureActions">

                  <a
                    className="buttonDark"
                    href="/2026_PV_Circulator_Solution_Brochure.pdf"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("OPEN FULL-SCREEN BROCHURE")}
                    <span>→</span>
                  </a>

                  <a
                    className="buttonText"
                    href="/2026_PV_Circulator_Solution_Brochure.pdf"
                    download
                  >
                    {t("SAVE PDF")}
                  </a>

                </div>

                <div className="brochureFrame">
                  <iframe
                    src="/2026_PV_Circulator_Solution_Brochure.pdf"
                    title={t("2026 PV Circulator Solution Brochure")}
                  />
                </div>

              </div>
            </section>

          </>
        )}

            {/* FOLLOW UP */}

            <section id="follow-up" className="followSection">
              <div className="pageShell">

                <div className="followIntro">

                  <p className="sectionEyebrow light">
                    {t("FOLLOW UP")}
                  </p>

                  <h2>
                    {t("Take the next step.")}
                  </h2>

                  <p>
                    {t("Receive your business case and brochure, or connect with our team to discuss equipment, recycling services or your project.")}
                  </p>

                </div>

                <form
                  className="followForm"
                  onSubmit={save}
                >

                  <div className="followGrid">

                    <label>
                      <span>{t("Name")}</span>
                      <input
                        name="name"
                        placeholder={t("Your name")}
                        required
                      />
                    </label>

                    <label>
                      <span>
                        {t("Business email")}
                      </span>
                      <input
                        name="email"
                        type="email"
                        placeholder="name@company.com"
                        required
                      />
                    </label>

                    <label>
                      <span>{t("Company")}</span>
                      <input
                        name="company"
                        placeholder={t("Company")}
                      />
                    </label>

                    <label>
                      <span>
                        {t("Country / region")}
                      </span>
                      <input
                        name="country"
                        placeholder={t("Country / region")}
                      />
                    </label>

                  </div>

                  <label className="followFull">

                    <span>
                      {t("What would you like to explore?")}
                    </span>

                    <select
                      name="intent"
                      defaultValue="Email Summary"
                    >
                      <option value="Email Summary">
                        {t("Receive My Business Case")}
                      </option>

                      <option value="Download PDF">
                        {t("Receive Business Case + Brochure")}
                      </option>

                      <option value="Request Meeting">
                        {t("Schedule a Meeting")}
                      </option>

                      <option value="Request Quote">
                        {t("Request a Quotation")}
                      </option>

                      <option value="Purchase Interest">
                        {t("Discuss Purchase")}
                      </option>
                    </select>

                  </label>

                  <p className="formDisclaimer">
                    {t("By submitting, you agree that PV Circonomy may use the information provided to send this business-case result and follow up regarding PV recycling solutions. Calculations are illustrative and are not a quotation or guarantee.")}
                  </p>

                  {!result && <p className="formDisclaimer">{t("Calculate your business case above to enable submission.")}</p>}
                  <button
                    className="followSubmit"
                    type="submit"
                    disabled={!result}
                  >
                    {t("SUBMIT & SEND MY BUSINESS CASE")}
                    <span>→</span>
                  </button>

                </form>

              </div>
            </section>

      {/* MESSAGE */}

      {msg && (
        <button
          className="toast"
          onClick={() =>
            setMsg('')
          }
        >
          {t(msg)}
        </button>
      )}

      {/* FOOTER */}

      <footer>
        <div className="pageShell footerInner">

          <div>
            <span>PV Circonomy</span>
            <span>PV Circulator®</span>
            <span>
              {t("Business Case Calculator")}
            </span>
          </div>

          <span>
            © 2026 PV Circonomy
          </span>

        </div>
      </footer>

      </main>
    </div>
  );
}
