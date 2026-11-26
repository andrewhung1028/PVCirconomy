import { defaultMouPolicy } from "./mou-policy";
import { marketNames } from "./our-solution/market";
import { equipmentMouSigningLocales, otherSitePowerSupply, type EquipmentMouInput, type EquipmentMouTerms } from "./equipment-mou";

type Wording = readonly [english: string, chinese: string, japanese: string];

export type EquipmentMouArticle = {
  number: number;
  title: string;
  items: string[][];
  introduction?: string;
  table?: [label: string, value: string][];
  note?: string;
};

export function mouWording(locale: EquipmentMouInput["locale"]) {
  return (en: string, zh: string, ja: string) => locale === "zh-TW" ? zh : locale === "ja-JP" ? ja : en;
}

export function equipmentMouGoverningLaw(input: EquipmentMouInput) {
  const w = mouWording(input.locale);
  if (input.installationMarket === "JP") {
    return w("Governing law. This Article is governed by the laws of Japan.",
      "準據法。本條以日本法律為準據法。",
      "準拠法。本条は日本法に準拠します。");
  }
  if (input.installationMarket === "EU") {
    return w("Governing law. This Article is governed by the law of the EU member state where the proposed installation site is located, together with applicable EU law.",
      "準據法。本條以擬議安裝場址所在歐盟會員國之法律及適用之歐盟法為準據法。",
      "準拠法。本条は、設置予定地が所在するEU加盟国の法令および適用されるEU法に準拠します。");
  }
  const market = marketNames[input.locale][input.installationMarket];
  return w(`Governing law. This Article is governed by the laws in force at the proposed installation site (${market}), including applicable national, federal, state or provincial law.`,
    `準據法。本條以${market}擬議安裝場址適用之法律為準據法，包括適用之國家、聯邦、州或省法律。`,
    `準拠法。本条は、${market}の設置予定地に適用される国、連邦、州または省の法令に準拠します。`);
}

export function equipmentMouArticles(input: EquipmentMouInput, terms: EquipmentMouTerms) {
  const policy = terms.policy ?? defaultMouPolicy;
  const w = (...wording: Wording) => mouWording(input.locale)(...wording);
  const japan = input.installationMarket === "JP";
  const { governingLaw } = terms;
  const market = marketNames[input.locale][input.installationMarket];
  const sitePower = input.sitePowerSupply === otherSitePowerSupply
    ? w("other specification", "其他供電規格", "その他の電源仕様")
    : input.sitePowerSupply ? `${input.sitePowerSupply} · ${w("three-phase", "三相", "三相")}` : null;
  const article = (
    number: number,
    title: Wording,
    items: (string | string[])[],
    presentation?: Pick<EquipmentMouArticle, "introduction" | "table">,
  ): EquipmentMouArticle => ({
    ...presentation,
    number,
    title: w(`Article ${number} · ${title[0]}`, `第 ${number} 條　${title[1]}`, `第 ${number} 条　${title[2]}`),
    items: items.map(item => typeof item === "string" ? [item] : item),
  });
  const configuration = input.configuration === "plus" ? input.baseConfiguration : input.configuration;
  const specifications = {
    economic: ["65", "18,175 × 5,883"],
    basic: ["85", "21,340 × 5,883"],
    premium: ["100", "24,100 × 5,883"],
  } as const;
  const spec = configuration ? specifications[configuration] : null;
  const published = terms.specifications;
  const publishedOverview = published && [
    w(
      `PV Circulator uses dry, room-temperature mechanical layer separation without heat treatment, chemicals or process water. The configured line is rated at ${published.ratedThroughput} modules/min using a standard ${published.standardCells}-cell module. Electricity use: ${published.energyPerPanel}. Compressed air: ${published.compressedAirLpm} L/min at ${published.compressedAirBar} bar.`,
      `PV Circulator 採常溫乾式逐層機械分離，製程無須熱處理、化學藥劑或用水。以標準 ${published.standardCells} 片電池模組測試，所選產線額定處理量為每分鐘 ${published.ratedThroughput} 片。單片用電量為 ${published.energyPerPanel.replace("/panel", "／片")}。壓縮空氣需求為 ${published.compressedAirLpm} L／分鐘、${published.compressedAirBar} bar。`,
      `PV Circulatorは常温乾式の機械分離方式で、加熱処理、薬剤、工程用水を使用しません。標準${published.standardCells}セルモジュールの定格処理量は毎分${published.ratedThroughput}枚です。消費電力量は${published.energyPerPanel.replace("/panel", "／枚")}、圧縮空気は${published.compressedAirBar} barで${published.compressedAirLpm} L／分です。`,
    ),
    ...(configuration ? [w(
      `Selected base line: installed power ${published.installedKw} kW and recommended footprint ${published.footprint}. The formal quotation identifies the proposed configuration and options.`,
      `所選基本產線的安裝功率為 ${published.installedKw} kW，建議安裝尺寸為 ${published.footprint}。正式報價會列出擬議配置與加選模組。`,
      `選択した基本ラインの設置電力は${published.installedKw} kW、推奨設置寸法は${published.footprint}です。正式見積書で提案構成と追加モジュールを提示します。`,
    )] : []),
    w(
      `Standard feedstock is intact crystalline-silicon glass–backsheet modules: length ${published.moduleLength}, width ${published.moduleWidth}, frame thickness ${published.frameThickness}, glass thickness ${published.glassThickness} and maximum weight ${published.moduleWeight} per module. Handling of broken or double-glass modules is reviewed separately.`,
      `標準適用完整玻璃－背板矽晶模組，長 ${published.moduleLength}、寬 ${published.moduleWidth}、含框厚度 ${published.frameThickness}、玻璃厚度 ${published.glassThickness}，單片重量上限為 ${published.moduleWeight}。破損模組及雙玻璃模組另行評估。`,
      `標準対象は破損のないガラス・バックシート型結晶シリコンモジュールです。長さ${published.moduleLength}、幅${published.moduleWidth}、枠込み厚さ${published.frameThickness}、ガラス厚${published.glassThickness}、1枚あたり最大重量${published.moduleWeight}。破損品と両面ガラス品は個別に評価します。`,
    ),
  ];

  return [
    article(1, ["Parties and roles", "當事人及角色", "当事者と役割"], []),
    article(2, ["Purpose", "目的", "目的"], [
      w("Party B intends to evaluate the procurement and deployment of PV Circulator for processing retired crystalline-silicon PV modules at the proposed site.",
        "乙方擬評估採購及部署 PV Circulator，於擬議場址處理退役矽晶太陽光電模組。",
        "乙は、設置予定地で使用済み結晶シリコン太陽電池モジュールを処理するため、PV Circulatorの導入を評価します。"),
      ...(japan ? [w(
        "The Japan project assessment takes into account the Act on Promotion of Recycling of Solar Panel Waste, promulgated on June 5, 2026 (Act No. 33 of 2026).",
        "日本專案的評估將考量《太陽電池廃棄物の再資源化等の推進に関する法律》（令和 8 年法律第 33 號，2026 年 6 月 5 日公布）。",
        "日本での案件評価では、太陽電池廃棄物の再資源化等の推進に関する法律（令和8年法律第33号、2026年6月5日公布）を考慮します。")] : [w(
        `During technical assessment, the parties will identify applicable recycling, waste-handling and permitting requirements for the installation site in ${market}.`,
        `技術評估時，各方將依${market}實際安裝場址確認適用的回收、廢棄物處理及許可要求。`,
        `技術評価時に、${market}の実際の設置場所に適用されるリサイクル、廃棄物処理および許認可要件を確認します。`,
      )]),
    ]),
    article(3, ["Equipment overview", "設備概要", "設備概要"], [
      ...(publishedOverview ?? [w("PV Circulator uses dry, room-temperature mechanical layer separation without heat treatment, chemicals or process water. Standard lines are rated at one standard 60-cell module per minute, with electricity use below 1 kWh per module and compressed air of 400 L/min at 8 bar.",
        "PV Circulator 採常溫乾式逐層機械分離，製程無須熱處理、化學藥劑或用水。標準產線額定每分鐘處理一片標準 60 片電池模組，單片用電量低於 1 kWh，壓縮空氣需求為 400 L／分鐘、8 bar。",
        "PV Circulatorは常温乾式の機械分離方式で、加熱処理、薬剤、工程用水を使用しません。標準ラインの定格処理量は標準60セルモジュール1枚／分、消費電力量は1 kWh／枚未満、圧縮空気は8 barで400 L／分です。"),
      ...(spec ? [w(
        `Selected base line: installed power ${spec[0]} kW and recommended footprint ${spec[1]} mm. The formal quotation identifies the proposed configuration and options.`,
        `所選基本產線的安裝功率為 ${spec[0]} kW，建議安裝尺寸為 ${spec[1]} mm。正式報價會列出擬議配置與加選模組。`,
        `選択した基本ラインの設置電力は${spec[0]} kW、推奨設置寸法は${spec[1]} mmです。正式見積書で提案構成と追加モジュールを提示します。`,
      )] : []),
      w("Standard feedstock is intact crystalline-silicon glass–backsheet modules, 1,525–2,500 mm long, 915–1,150 mm wide, 25–50 mm thick with frame, with 3–5 mm glass and up to 50 kg per module. Handling of broken or double-glass modules is reviewed separately.",
        "標準適用完整玻璃－背板矽晶模組，長 1,525–2,500 mm、寬 915–1,150 mm、含框厚度 25–50 mm、玻璃厚度 3–5 mm，每片不超過 50 kg。破損模組及雙玻璃模組另行評估。",
        "標準対象は破損のないガラス・バックシート型結晶シリコンモジュールです。長さ1,525–2,500 mm、幅915–1,150 mm、枠込み厚さ25–50 mm、ガラス厚3–5 mm、重量50 kg以下。破損品と両面ガラス品は個別に評価します。")]),
      sitePower ? w(
        `Site power reported in the inquiry: ${sitePower}. Final equipment electrical requirements will be confirmed during technical assessment.`,
        `詢價填報的場址供電為 ${sitePower}。設備所需電氣規格於技術評估時確認。`,
        `お問い合わせで申告された現場電源は ${sitePower} です。設備に必要な最終電源仕様は技術評価時に確認します。`,
      ) : w(
        `The site power supply in ${market} has yet to be confirmed. Site voltage, frequency and phase will be checked during technical assessment.`,
        `${market}場址的供電尚未確定。電壓、頻率與相別於技術評估時確認。`,
        `${market}の現場電源は未確認です。電圧、周波数、相数は技術評価時に確認します。`,
      ),
    ]),
    article(4, ["Proposed equipment project", "擬議設備採購專案", "設備導入計画"], [], {
      introduction: w("The configuration, quantity, site and schedule are preliminary and may be adjusted after assessment.",
        "下列配置、數量、場址與時程為初步規劃，可依評估結果調整。",
        "以下の構成、台数、設置場所および日程は暫定計画であり、評価結果に応じて調整できます。"),
      table: [
        [
          w("Installation site requirements", "安裝地法規", "設置場所の法令要件"),
          w("During technical assessment, the parties will confirm the machinery safety, electrical safety, occupational safety and permitting requirements applicable to the actual installation site.",
            "各方將於技術評估時，依實際安裝場址確認適用的機械安全、電氣安全、職業安全及許可要求。",
            "技術評価の際、各当事者は実際の設置場所に適用される機械安全、電気安全、労働安全および許認可の要件を確認します。"),
        ],
        [
          w("Equipment conformity and verification", "設備符合性與驗證", "設備の適合性と検証"),
          w("Party A will confirm which declarations of conformity, certifications or test documents it can provide for the proposed equipment configuration and the requirements at the installation site. The formal quotation will specify the applicable models, the scope of coverage and any required on-site inspections.",
            "甲方將依擬選設備配置及安裝地要求，確認可提供的符合性聲明、認證或測試文件，並於正式報價中列明適用型號、涵蓋範圍及所需的現場檢驗。",
            "甲は、提案する設備構成と設置場所の要件に基づき、提供可能な適合宣言書、認証書類または試験文書を確認します。正式見積書には、対象機種、適用範囲および必要な現地検査を明記します。"),
        ],
      ],
    }),
    article(5, ["Technical assessment and responsibilities", "技術評估及分工", "技術評価と役割分担"], [
      w("Party B shall provide the information needed for technical assessment, including the types, specifications, quantities and sources of the modules to be processed, estimated annual throughput, the installation site, space planning and utility conditions.",
        "乙方應供技術評估所需的資料，包括擬處理模組的種類、規格、數量及來源、預計年處理量、設置場址、空間規劃及公用設施條件。",
        "乙は、処理対象モジュールの種類、仕様、数量および調達元、年間処理予定量、設置場所、スペース計画ならびにユーティリティ条件など、技術評価に必要な資料を提供します。"),
      w("Party A and Party B will review module suitability, equipment configuration and utility needs in accordance with Article 6. Party A will provide the technical documentation needed from the inquiry stage through after-sales service.",
        "甲方將依第 6 條所列確認事項，與乙方確認模組適用性、設備配置及公用設施需求，並提供從詢價至售後階段所需之技術資料。",
        "甲は、第6条の確認事項に沿って乙とモジュールの適合性、設備構成およびユーティリティ要件を確認し、問い合わせからアフターサービスまでの各段階で必要な技術資料を提供します。"),
    ]),
    article(6, ["Matters to confirm from inquiry to purchase", "詢價至採購之確認事項", "問い合わせから購入までの確認事項"], [
      w("Inquiry stage: Types, specifications, quantities and sources of the modules to be processed, estimated annual throughput, and installation site and utility conditions.",
        "詢價階段：處理模組之種類、規格、數量及來源；預計年處理量；設置場址及公用設施條件。",
        "問い合わせ段階：処理対象モジュールの種類、仕様、数量および調達元、年間処理予定量、設置場所およびユーティリティ条件。"),
      w("Quotation stage: After the MOU is confirmed, a quotation will be provided based on the equipment configuration and quantity. Confirm the price, currency and terms for installation, training, warranty, delivery and payment.",
        "報價階段：將於確認 MOU 後，依設備配置及台數提供相對應報價；並確認價格、幣別、安裝、訓練、保固、交貨與付款條件。",
        "見積もり段階：MOU確認後、設備構成および台数に応じた見積書を提示します。価格、通貨ならびに設置、研修、保証、納入および支払いの条件を確認します。"),
      w("Contract stage: After both parties confirm the quotation in writing, Party A provides detailed specifications and drawings. As needed, both parties check site preparation, access routes, load-bearing capacity, power supply and utility conditions, and installation responsibilities.",
        "契約階段：雙方書面確認報價後，甲方提供詳細規格與圖面。雙方視需要核對場地準備、動線、載重、供電與公共設施條件，以及安裝分工。",
        "契約段階：甲乙双方が見積書を書面で確認した後、甲は詳細仕様書および図面を提供します。両者は必要に応じて、現場準備、搬入動線、耐荷重、電源およびユーティリティ条件、ならびに設置作業の役割分担を確認します。"),
      w("Equipment handover stage: Acceptance criteria and procedures, and operator training.",
        "交機階段：驗收標準及程序；教育訓練。",
        "設備引渡し段階：検収基準と手順、および操作研修。"),
      w("After-sales stage: Warranty scope and duration, spare parts and repair services, and technical support and offtake services for recovered materials.",
        "售後階段：保固範圍及期間；備品及維修服務；回收材料之去化技術支持與處理服務（Offtake）。",
        "アフターサービス段階：保証の範囲と期間、予備品と修理サービス、ならびに回収材料の引き取りに関する技術支援および引き取りサービス（Offtake）。"),
    ], {
      introduction: w("The parties will discuss the following matters in subsequent negotiations and set them out in the formal contract:",
        "下列事項由各方於後續協商，並於正式契約中約定：",
        "以下の事項は各当事者が今後協議し、正式契約に定めます。"),
    }),
    article(7, ["Effect, amendments and ending evaluation", "效力、變更及停止評估", "効力、変更及び評価の終了"], [
      w("Except for Article 8, this MOU records only the parties’ intentions to cooperate and consider procurement and is non-binding. No party is obliged to buy or sell before execution of a formal contract.",
        "除第八條外，本備忘錄僅表達各方之合作及採購意向，不具法律拘束力。正式契約簽訂前，任何一方均無採購或銷售之義務。",
        "第8条を除き、本覚書は各当事者の協力及び購入の意向を示すものであり、法的拘束力を有しません。正式契約の締結前は、いずれの当事者も購入または販売の義務を負いません。"),
      w("Any amendment to this MOU requires the written agreement of all parties.",
        "本備忘錄之變更，應經各方書面同意。",
        "本覚書の変更には、全当事者の書面による同意を要します。"),
      w("Any party may stop the evaluation by written notice to the other parties. No party is liable to pay compensation for doing so.",
        "任何一方得以書面通知其他各方停止評估，任何一方均不因此負賠償責任。",
        "いずれの当事者も、他の当事者に書面で通知して評価を終了でき、いずれの当事者もこれによる賠償責任を負いません。"),
      w(`This MOU ends at the earliest of the following: expiry of ${policy.validityDays} days after all parties have signed (or of any extension agreed in writing by all parties), written notice by any party ending the evaluation under this Article, or entry into force of the formal purchase contract. Once that contract takes effect, it governs procurement and performance. Obligations under Article 8 that survive termination remain in effect as provided there.`,
        `本備忘錄於下列任一情形最先發生時終止：各方完成簽署後屆滿 ${policy.validityDays} 日（經各方書面同意延長者，依延長後期限）、任一方依本條書面通知停止評估，或正式採購契約生效。正式採購契約生效後，採購及履約事項依該契約辦理。第 8 條約定於終止後繼續有效之義務，仍依其約定辦理。`,
        `本覚書は、全当事者による署名完了から${policy.validityDays}日が経過した時（全当事者が書面で延長に合意した場合は延長後の期間満了時）、いずれかの当事者が本条に従い評価の終了を書面で通知した時、または正式な売買契約が発効した時のうち、最も早い時点で終了します。正式な売買契約の発効後、購入および履行に関する事項は同契約に従います。第8条により終了後も存続する義務は、同条に従って引き続き効力を有します。`),
    ]),
    article(8, ["Confidentiality, exclusivity, publicity, governing law, costs and term", "保密、排他性、公開、準據法、費用與期限", "秘密保持、非独占、公表、準拠法、費用及び期間"], [
      [w("This Article is intended to be legally binding.", "本條具有法律約束力。", "本条は法的拘束力を有します。"),
      w("Confidentiality. Protect non-public commercial or technical information marked confidential or reasonably understood as confidential, and use it only for assessment, communication and quotation for this project. Disclose it only with the provider’s written consent or, on a need-to-know basis, to staff, professional advisers and authorized representatives subject to comparable confidentiality duties.",
        "保密。妥善保管已標示或依情況可合理判斷為機密的非公開商業或技術資料，僅供本案評估、聯絡及報價使用。除經提供方書面同意外，僅得向有知悉必要且負有相當保密義務的員工、專業顧問及授權代表揭露。",
        "秘密保持。秘密と表示された、または状況から合理的に秘密と判断される非公開の営業・技術情報を適切に管理し、本案件の評価、連絡及び見積もりに限り使用します。開示元の書面同意がある場合、または相当の守秘義務を負い知る必要のある従業員、専門家及び権限を付与された代表者に限り開示できます。"),
      w("This duty excludes information lawfully public, lawfully held before disclosure, lawfully received from an authorized third party, or independently developed. Legally compelled disclosure is limited to what is required. Notify the provider where permitted.",
        "已合法公開、接收前合法持有、由有權第三方合法提供或獨立開發的資訊，不受保密義務限制。依法須揭露時，以法令要求範圍為限，並於法律允許時通知提供方。",
        "適法に公知となった情報、開示前から適法に保有していた情報、権限のある第三者から適法に受領した情報、または独自に開発した情報は対象外です。法令による開示は必要な範囲に限り、許される場合は開示元へ通知します。")],
      w("Non-exclusivity. Each party may engage with other parties while observing confidentiality.", "非排他。各方得與其他對象接洽、評估或交易，並遵守保密義務。", "非独占。各当事者は守秘義務を守りながら、他の相手方と交渉、評価または取引を行えます。"),
      w("Publicity. Public references to this MOU or its contents require the other parties’ prior written consent.", "公開。對外提及本意向書或其內容，須事先取得其他各方書面同意。", "公表。本覚書またはその内容の公表には、他の全当事者の事前の書面同意を要します。"),
      governingLaw,
      w("Costs. Each party bears its own evaluation costs. Any service charge payable by another party requires prior written agreement.", "費用。各方自行負擔評估費用。如需由他方負擔服務費用，應在服務開始前另以書面約定。", "費用。各当事者は評価費用を各自負担します。他の当事者が負担するサービス費用は、開始前に書面で合意します。"),
      w(`Term. This MOU takes effect on completion of signing under Article 9. The evaluation period is ${policy.validityDays} days, subject to earlier termination under Article 7 or written extension by all parties. Confidentiality survives expiry or early termination for ${terms.policy ? `${policy.confidentialityYears} ${policy.confidentialityYears === 1 ? "year" : "years"}` : "three years"}.`,
        `期限。本意向書自依第 9 條完成簽署之日起生效，評估期為 ${policy.validityDays} 日。依第 7 條得提前終止，或經各方書面同意延長。期滿或提前終止後，保密義務繼續有效${terms.policy ? policy.confidentialityYears : "三"}年。`,
        `期間。本覚書は、第9条に基づく署名完了日から効力を生じ、評価期間は${policy.validityDays}日とします。第7条に基づく早期終了または全当事者の書面による延長が可能です。秘密保持義務は満了または中途終了後${policy.confidentialityYears}年間存続します。`),
    ]),
    article(9, ["Copies and signatures", "文件及簽署", "文書及び署名"], [
      equipmentMouSigningLocales[input.pageMarket] === "ja-JP"
        ? w("This MOU is signed in Japanese.", "本意向書以日文版簽署。", "本覚書は日本語版で締結します。")
        : w("This MOU is signed in English.", "本意向書以英文版簽署。", "本覚書は英語版で締結します。"),
      w("Party B confirms the MOU electronically. When Party A issues the MOU through the system and the signed copy is accepted for dispatch to Party B’s email address, both parties are deemed to have signed. The electronic copy has the same effect as a signed original.",
        "乙方透過系統確認簽署本意向書。甲方透過系統出具本意向書，且簽署副本已受理寄送至乙方電子郵件信箱時，即視為甲、乙雙方均已完成簽署。電子副本與簽署正本具有同等效力。",
        "乙はシステム上で本覚書への署名を確認します。甲がシステムを通じて本覚書を発行し、署名済みの写しを乙のメールアドレス宛てに送信する手続きが受理された時点で、甲乙双方の署名が完了したものとします。電子写しは署名済み原本と同等の効力を有します。"),
    ]),
  ];
}
