import type { MouPolicy } from "./mou-policy";
import type { EquipmentBaseVariant, EquipmentVariant } from "./equipment-configurations";
import type { OurSolutionLocale, PublicSolutionMarket } from "./our-solution/market";

export const equipmentMouSigningLocales = {
  US: "en-US",
  CA: "en-US",
  AU: "en-US",
  UK: "en-US",
  EU: "en-US",
  JP: "ja-JP",
} as const satisfies Record<PublicSolutionMarket, OurSolutionLocale>;

export const otherSitePowerSupply = "Other site power supply";

export { equipmentVariants, type EquipmentBaseVariant, type EquipmentVariant } from "./equipment-configurations";
export const polymerOfftakeOptions = ["Not yet determined", "Self-managed", "Offtake inquiry"] as const;
export type PolymerOfftake = typeof polymerOfftakeOptions[number];
export const equipmentMouValidityDays = 180;

export const equipmentProjectStages = ["Not yet determined", "Initial feasibility", "Planning a new facility", "Expanding an operation"] as const;
export type EquipmentProjectStage = typeof equipmentProjectStages[number];

export const equipmentInquiryMaterials = ["Glass", "Silicon", "Silver"] as const;
export const equipmentInquiryNotesLimit = 2000;
type InquiryMaterial = typeof equipmentInquiryMaterials[number];

export type EquipmentMouInput = {
  configuration: EquipmentVariant;
  baseConfiguration?: EquipmentBaseVariant;
  polymerOfftake?: PolymerOfftake;
  installationSite?: string;
  sitePowerSupply?: string;
  targetStart?: string;
  targetAssessment?: string;
  projectStage?: EquipmentProjectStage;
  installationMarket: PublicSolutionMarket;
  pageMarket: PublicSolutionMarket;
  locale: OurSolutionLocale;
  lines: number;
  customization?: string;
  panelTechnology?: "Crystalline silicon";
  panelCondition?: "Not yet determined" | "Mostly intact" | "Mostly damaged" | "Mixed";
  materialRequirements?: { material: InquiryMaterial; minimumPurity: number | null }[];
  installationEnvironment?: "Not yet determined" | "Indoor" | "Outdoor";
  floorArea?: { value: number; unit: "m2" | "ft2" };
  interfaceLanguage?: "English" | "Japanese";
  compressedAir?: "Not yet determined" | "Available" | "Not available";
  siteNetwork?: "Not yet determined" | "Wired Ethernet" | "Wi-Fi" | "Wired Ethernet and Wi-Fi" | "Not available";
  installationNotes?: string;
  panelsPerMonth: number | null;
  dailyHours: number | null;
  recyclingFee: number | null;
};

export type EquipmentMou = {
  currency: string;
  msrpPerLine: number | null;
  msrpTotal: number | null;
  investment: number | null;
  annualEbitda: number | null;
  paybackYears: number | null;
  capacityExceeded: boolean;
};

export type EquipmentMouContact = { name: string; company: string; jobTitle: string; email: string; address?: string; phone?: string };

export type EquipmentMouAgent = { company: string; address?: string; representative?: string; title?: string; email?: string };

export type EquipmentMouSpecifications = {
  ratedThroughput: number;
  standardCells: number;
  energyPerPanel: string;
  compressedAirLpm: number;
  compressedAirBar: number;
  installedKw: number;
  footprint: string;
  moduleLength: string;
  moduleWidth: string;
  moduleWeight: string;
  frameThickness: string;
  glassThickness: string;
};

export type EquipmentMouTerms = {
  seller: string;
  agentCandidates: string[];
  agent: EquipmentMouAgent | null;
  governingLaw: string;
  policy?: MouPolicy;
  specifications?: EquipmentMouSpecifications;
};

export function equipmentMouHasSalesAgent(terms: Pick<EquipmentMouTerms, "agent" | "agentCandidates">) {
  return Boolean(terms.agent || terms.agentCandidates?.length);
}

export type EquipmentMouReview = {
  input: EquipmentMouInput;
  contact: EquipmentMouContact;
  mou: EquipmentMou;
  terms: EquipmentMouTerms;
  token: { id: string; expires: number; signature: string } | null;
};
