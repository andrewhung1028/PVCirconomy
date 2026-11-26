import type { OurSolutionLocale } from "../../lib/our-solution/market";

const regulationUrl = "https://www.law.cornell.edu/regulations/california/22-CCR-66273.73";
const source = "22 CCR § 66273.73";

const californiaCopy = {
  "en-US": {
    title: "California.",
    body: "Since 1 January 2021, hazardous end-of-life PV modules may be managed as universal waste under 22 CCR Chapter 23. Handlers that dismantle or treat these modules must notify DTSC and report annually. The universal waste authorizations under §§ 66273.72(a)(1) and 66273.73(c)(3), (d)(2)(A) exclude methods that use chemicals (including water) or external heat. Treatment using those methods is subject to applicable hazardous waste requirements.",
  },
  "ja-JP": {
    title: "カリフォルニア州。",
    body: "2021年1月1日より、有害な使用済み太陽光モジュールは、州規則集第22編第23章に基づきユニバーサル廃棄物として管理できます。解体・処理を行う取扱事業者は、DTSCへの届出と年次報告が必要です。同編第66273.72条(a)(1)および第66273.73条(c)(3)、(d)(2)(A)による解体・処理の認可は、化学薬品（水を含む）や外部加熱を用いる方法には適用されません。これらの方法による処理には、該当する有害廃棄物規則が適用されます。",
  },
  "zh-TW": {
    title: "加州。",
    body: "自 2021 年 1 月 1 日起，依加州法規第 22 編第 23 章，屬於有害廢棄物的退役太陽能模組可按通用廢棄物管理。進行拆解或處理的業者須向 DTSC 提交通知及年度報告。依第 66273.72(a)(1) 及第 66273.73(c)(3)、(d)(2)(A) 條，通用廢棄物的拆解與處理授權禁止使用化學品（含水）或外部加熱。採用這些方法處理時，須遵守適用的有害廢棄物規定。",
  },
} satisfies Record<OurSolutionLocale, { title: string; body: string }>;

export function californiaPvRule(locale: OurSolutionLocale) {
  const { title, body } = californiaCopy[locale];
  return [title, body, regulationUrl, source] as const;
}
