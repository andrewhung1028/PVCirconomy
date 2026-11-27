"use client";

import { useSearchParams } from "next/navigation";

export function useTransferredVolume() {
  const value = Number(useSearchParams().get("panelsPerMonth"));
  return Number.isSafeInteger(value) && value > 0 && value <= 1e9 ? value : undefined;
}
