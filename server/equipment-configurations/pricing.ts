import { equipmentVariants } from "../../lib/equipment-configurations";
import { equipmentPriceModules, type EquipmentModulePrices } from "../../lib/equipment-module-pricing";

export function configuredEquipmentMarkets() {
  return JSON.parse(process.env.PVCIRCULATOR_MOU_MARKETS || "{}");
}

// Commercial module prices are supplied by the equipment workbook and stored in the database.
export const initialEquipmentModulePrices = Object.fromEntries(
  equipmentPriceModules.map(([module]) => [
    module, Object.fromEntries(equipmentVariants.map(variant => [variant, null])),
  ]),
) as EquipmentModulePrices;
