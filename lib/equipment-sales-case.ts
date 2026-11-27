import type { EquipmentMouInput } from "./equipment-mou";
import { mouWording } from "./equipment-mou-articles";

export function equipmentCaseNumber(id: string) {
  return "PV-" + id.toUpperCase();
}

export function equipmentSalesNextStep(input: EquipmentMouInput, locale = input.locale) {
  const wording = mouWording(locale);
  if (input.installationMarket === "JP") return wording(
    "Your local sales agent will follow up on standard purchase pricing and a formal equipment quotation.",
    "日本當地代理商將與您聯絡，說明標準採購價格並提供正式設備報價。",
    "日本の販売代理店が標準購入の価格についてご連絡し、設備の正式見積書をご案内します。");
  if (input.purchaseOption === "Trial-based PO (TBP)") return wording(
    "Our equipment team will confirm trial availability and issue a TBP quotation with the deposit, fees and trial duration. Both parties confirm the quotation in writing before signing the contract.",
    "設備團隊將確認試用名額，並提供載明押金、費用與試用期間的 TBP 正式報價。雙方書面確認報價後再簽約。",
    "設備担当者が試用枠を確認し、保証金、費用、試用期間を記載した TBP 正式見積書を発行します。双方が書面で確認した後、契約に進みます。");
  return wording(
    "Our equipment team will follow up on your configuration and prepare a standard purchase quotation for contract review.",
    "設備團隊將與您確認配置，提供標準採購正式報價，以便審閱合約。",
    "設備担当者が構成を確認し、契約の検討に向けて標準購入の正式見積書をご案内します。");
}

export function equipmentCaseLabel(locale: EquipmentMouInput["locale"]) {
  return mouWording(locale)("Sales case number", "業務案件編號", "商談番号");
}
