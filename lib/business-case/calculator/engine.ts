import type {
  CalcInput,
  MasterData,
  Material,
  Solution,
} from '../types';

/* =========================================================
   CONSTANTS
========================================================= */

const KG_PER_LB = 0.45359237;
const LB_PER_METRIC_TON = 2204.6226218;
const SHORT_TON_PER_METRIC_TON = 1.10231131;

/* =========================================================
   HELPERS
========================================================= */

const OPEX_ALIASES: Record<string, string[]> = {
  LABOR_BURDEN_PCT: ['LABOR_BURDEN'],
  WORKERS_COMP_PCT: ['WORKERS_COMP'],
  HANDLING_ANNUAL: ['HANDLING_YEAR'],
  INSURANCE_ANNUAL: ['INSURANCE_YEAR'],
  ADMIN_ANNUAL: ['ADMIN_YEAR'],
};

function requiredOpex(arr: any[], key: string, countryCode: string): number {
  const accepted = [key, ...(OPEX_ALIASES[key] ?? [])];
  const row = arr.find((x) => accepted.includes(String(x.parameter ?? '').trim().toUpperCase()));
  if (!row || row.value === null || row.value === undefined || row.value === '' || !Number.isFinite(Number(row.value))) {
    throw new Error(`Missing or invalid OPEX parameter: ${key} (${countryCode})`);
  }
  const value = Number(row.value);
  if (value < 0) throw new Error(`Negative OPEX parameter: ${key} (${countryCode})`);
  return value;
}

function benchmarkLocal(
  material: Material,
  fxLocalPerUSD: number
) {
  if (material.benchmarkPrice == null) {
    return 0;
  }

  /*
    If benchmark price is in USD,
    convert it into the operating-region currency.

    If benchmark price is already in another currency,
    keep it as-is.
  */
  return material.currency === 'USD'
    ? material.benchmarkPrice * fxLocalPerUSD
    : material.benchmarkPrice;
}

/* =========================================================
   MAIN CALCULATOR
========================================================= */

export function calculateBusinessCase(
  data: MasterData,
  input: CalcInput
) {
  /* =======================================================
     OPERATING REGION
  ======================================================= */

  const region = data.regions.find(
    (x) => x.code === input.regionCode
  );

  if (!region) {
    throw new Error('Operating region not found');
  }

  /* =======================================================
     FX
  ======================================================= */

  const fxRow = data.fx.find(
    (x) =>
      x.currency === region.currency &&
      x.active
  );

  const fx =
    fxRow?.localPerUSD || 1;

  const fxDate =
    fxRow?.effectiveDate || '';

  /* =======================================================
     COUNTRY OPEX PARAMETERS
  ======================================================= */

  const op = data.opex.filter(
    (x) =>
      x.countryCode === region.countryCode &&
      x.active
  );

  const countryCode = region.countryCode;
  const days = requiredOpex(op, 'OPERATING_DAYS_MONTH', countryCode);
  const hours = requiredOpex(op, 'OPERATING_HOURS_DAY', countryCode);
  if (days <= 0 || hours <= 0) {
    throw new Error(`Operating days and hours must be positive (${countryCode})`);
  }
  const burden = requiredOpex(op, 'LABOR_BURDEN_PCT', countryCode);
  const wc = requiredOpex(op, 'WORKERS_COMP_PCT', countryCode);
  const handling = requiredOpex(op, 'HANDLING_ANNUAL', countryCode);
  const packaging = requiredOpex(op, 'PACKAGING_PANEL', countryCode);
  const insurance = requiredOpex(op, 'INSURANCE_ANNUAL', countryCode);
  const admin = requiredOpex(op, 'ADMIN_ANNUAL', countryCode);

  /* =======================================================
     INPUT BASIS
  ======================================================= */

  const panelWeightLb =
    input.panelWeightLb || 44.09;

  const annualPanels =
    input.panelsPerMonth * 12;

  const inputMetricTons =
    annualPanels *
    panelWeightLb *
    KG_PER_LB /
    1000;

  /* =======================================================
     PROCESSING / TIPPING REVENUE
  ======================================================= */

  const feeUnit =
    String(region.feeUnit || '').toLowerCase();

  const feeWeight =
    feeUnit.includes('/kg')
      ? panelWeightLb * KG_PER_LB
      : panelWeightLb;

  const processingRevenue =
    annualPanels *
    feeWeight *
    input.processingFee;

  /* =======================================================
     CALCULATE ONE SOLUTION
  ======================================================= */

  const calc = (solution: Solution) => {
    const rules =
      data.recovery.filter(
        (r) =>
          r.solutionCode === solution.code &&
          r.active
      );

    let materialRevenue = 0;
    let residualMetricTons = 0;
    let recoveredMetricTons = 0;

    const materialRows: any[] = [];
    const incomplete: string[] = [];

    /* =====================================================
       MATERIAL RECOVERY + MATERIAL REVENUE
    ===================================================== */

    for (
      const material of
      data.materials.filter(
        (x) => x.active
      )
    ) {
      const rule = rules.find(
        (x) =>
          x.materialCode === material.code
      );

      /*
        Input quantity of this material
        based on default module composition.
      */

      const totalMetricTons =
        inputMetricTons *
        material.composition;

      /* ---------------------------------------------------
         MISSING RECOVERY ASSUMPTION
      --------------------------------------------------- */

      if (
        !rule ||
        rule.recoveryRate == null
      ) {
        if (
          material.code !== 'RESIDUAL'
        ) {
          incomplete.push(
            material.code
          );
        }

        /*
          Conservative treatment:
          material with no recovery assumption
          is treated as residual.
        */

        residualMetricTons +=
          totalMetricTons;

        materialRows.push({
          code:
            material.code,

          materialCode:
            material.code,

          name:
            (material as any).name ||
            material.code,

          material:
            (material as any).name ||
            material.code,

          composition:
            material.composition,

          inputT:
            totalMetricTons,

          inputMetricTons:
            totalMetricTons,

          recoveryRate:
            null,

          recoveredT:
            0,

          recoveredMetricTons:
            0,

          unrecoveredMetricTons:
            totalMetricTons,

          realization:
            null,

          saleable:
            false,

          benchmarkPrice:
            material.benchmarkPrice,

          benchmarkPriceLocal:
            benchmarkLocal(
              material,
              fx
            ),

          priceUnit:
            material.priceUnit,

          /*
            Both fields are returned intentionally.
            revenue is used by page.tsx.
            revenueLocal is retained for compatibility.
          */

          revenue:
            0,

          revenueLocal:
            0,

          incomplete:
            true,
        });

        continue;
      }

      /* ---------------------------------------------------
         RECOVERY
      --------------------------------------------------- */

      const recoveryRate =
        Number(
          rule.recoveryRate || 0
        );

      const recoveredT =
        totalMetricTons *
        recoveryRate;

      const unrecoveredT =
        totalMetricTons -
        recoveredT;

      recoveredMetricTons +=
        recoveredT;

      residualMetricTons +=
        unrecoveredT;

      /* ---------------------------------------------------
         MATERIAL REVENUE
      --------------------------------------------------- */

      const realization =
        rule.realization == null
          ? null
          : Number(
              rule.realization
            );

      const benchmarkPriceLocal =
        benchmarkLocal(
          material,
          fx
        );

      let revenue = 0;

      if (
        rule.saleable &&
        realization != null &&
        material.benchmarkPrice != null
      ) {
        const priceUnit =
          String(
            material.priceUnit || ''
          ).toLowerCase();

        /*
          Junction Box and any other /lb benchmark:
          metric tonnes → pounds → price/lb.
        */

        if (
          priceUnit.includes('/lb')
        ) {
          revenue =
            recoveredT *
            LB_PER_METRIC_TON *
            benchmarkPriceLocal *
            realization;
        } else {
          /*
            Default material benchmark:
            price / metric tonne.
          */

          revenue =
            recoveredT *
            benchmarkPriceLocal *
            realization;
        }
      }

      materialRevenue +=
        revenue;

      /* ---------------------------------------------------
         MATERIAL DETAIL ROW
      --------------------------------------------------- */

      materialRows.push({
        code:
          material.code,

        materialCode:
          material.code,

        name:
          (material as any).name ||
          material.code,

        material:
          (material as any).name ||
          material.code,

        composition:
          material.composition,

        inputT:
          totalMetricTons,

        inputMetricTons:
          totalMetricTons,

        recoveryRate,

        recoveredT,

        recoveredMetricTons:
          recoveredT,

        unrecoveredMetricTons:
          unrecoveredT,

        realization,

        saleable:
          rule.saleable,

        benchmarkPrice:
          material.benchmarkPrice,

        benchmarkPriceLocal,

        priceUnit:
          material.priceUnit,

        /*
          IMPORTANT:
          page.tsx reads revenue.
        */

        revenue,

        /*
          Retained for compatibility.
        */

        revenueLocal:
          revenue,

        incomplete:
          false,
      });
    }

    /* =====================================================
       CAPACITY-CONSTRAINED FULL-SHIFT MODEL
       One line supports up to three complete shifts/day.
       Shift and line counts are calculated per solution.
    ===================================================== */

    const capacityPerShift = solution.capacity * hours * days;
    if (!Number.isFinite(capacityPerShift) || capacityPerShift <= 0) {
      throw new Error(`Invalid processing capacity for ${solution.code}`);
    }

    const requiredShifts = Math.max(1, Math.ceil(input.panelsPerMonth / capacityPerShift));
    const shiftsPerLineLimit = 3;
    const equipmentLines = Math.max(1, Math.ceil(requiredShifts / shiftsPerLineLimit));
    const shiftsPerLine = Array.from({ length: equipmentLines }, (_, i) =>
      Math.min(shiftsPerLineLimit, Math.max(0, requiredShifts - i * shiftsPerLineLimit))
    );
    const requiredProcessingHoursPerDay =
      input.panelsPerMonth / (solution.capacity * days);

    /* =====================================================
       LABOR — full 8-hour (or local standard) shifts
    ===================================================== */

    const labor =
      solution.operators *
      region.hourlyWage *
      hours *
      days *
      12 *
      requiredShifts;

    const laborBurden =
      labor *
      burden;

    const workersComp =
      labor *
      wc;

    /* =====================================================
       FACILITY
    ===================================================== */

    const facility =
      solution.spaceSqFt *
      equipmentLines *
      (
        region.baseRent +
        region.cam
      );

    /* =====================================================
       ELECTRICITY
    ===================================================== */

    const electricity =
      annualPanels *
      solution.kwhPerPanel *
      region.electricityPrice;

    /* =====================================================
       CONSUMABLES
       Solution master is USD/panel
    ===================================================== */

    const consumables =
      annualPanels *
      solution.consumablesUSDPerPanel *
      fx;

    /* =====================================================
       MAINTENANCE
       CAPEX USD × maintenance %
    ===================================================== */

    const maintenance =
      solution.capexUSD *
      equipmentLines *
      solution.maintenanceRate *
      fx;

    /* =====================================================
       SECONDARY TREATMENT
    ===================================================== */

    const landfillUnit =
      String(
        region.landfillUnit || ''
      ).toLowerCase();

    const treatment =
      landfillUnit.includes('short')
        ? residualMetricTons *
          SHORT_TON_PER_METRIC_TON *
          region.landfillCost
        : residualMetricTons *
          region.landfillCost;

    /* =====================================================
       OTHER OPEX
    ===================================================== */

    const packagingCost =
      annualPanels *
      packaging;

    /* =====================================================
       TOTAL OPEX
    ===================================================== */

    const totalOpex =
      labor +
      laborBurden +
      workersComp +
      facility +
      electricity +
      consumables +
      maintenance +
      handling +
      packagingCost +
      insurance +
      admin +
      treatment;

    /* =====================================================
       REVENUE + EBITDA
    ===================================================== */

    const annualRevenue =
      processingRevenue +
      materialRevenue;

    const annualEbitda =
      annualRevenue -
      totalOpex;

    /* =====================================================
       CAPEX + PAYBACK
    ===================================================== */

    const capexLocal =
      solution.capexUSD *
      equipmentLines *
      fx;

    const simplePaybackYears =
      annualEbitda > 0
        ? capexLocal /
          annualEbitda
        : null;

    /* =====================================================
       OVERALL MATERIAL RECOVERY RATE
    ===================================================== */

    const recoveryRate =
      inputMetricTons > 0
        ? recoveredMetricTons /
          inputMetricTons
        : 0;

    /* =====================================================
       OPEX DETAIL
       Used by expandable OPEX rows in page.tsx
    ===================================================== */

    const opexDetail = [
      {
        code: 'LABOR',
        name: 'LABOR',
        value: labor,
      },

      {
        code: 'LABOR_BURDEN',
        name: 'LABOR BURDEN',
        value: laborBurden,
      },

      {
        code: 'WORKERS_COMP',
        name: "WORKERS' COMPENSATION",
        value: workersComp,
      },

      {
        code: 'FACILITY',
        name: 'FACILITY / RENT / CAM',
        value: facility,
      },

      {
        code: 'ELECTRICITY',
        name: 'ELECTRICITY',
        value: electricity,
      },

      {
        code: 'CONSUMABLES',
        name: 'CONSUMABLES',
        value: consumables,
      },

      {
        code: 'MAINTENANCE',
        name: 'MAINTENANCE',
        value: maintenance,
      },

      {
        code: 'HANDLING',
        name: 'FORKLIFT / HANDLING',
        value: handling,
      },

      {
        code: 'PACKAGING',
        name: 'PACKAGING / BAGS / PALLETS',
        value: packagingCost,
      },

      {
        code: 'INSURANCE',
        name: 'INSURANCE & COMPLIANCE',
        value: insurance,
      },

      {
        code: 'ADMIN',
        name: 'FACILITY UTILITIES / ADMIN',
        value: admin,
      },

      {
        code: 'TREATMENT',
        name: 'SECONDARY TREATMENT',
        value: treatment,
      },
    ];

    /* =====================================================
       RETURN SOLUTION RESULT
    ===================================================== */

    return {
      code:
        solution.code,

      name:
        solution.name,

      processingRevenue,

      materialRevenue,

      annualRevenue,

      annualOpex:
        totalOpex,

      annualEbitda,

      capexLocal,

      // Capacity assumptions for the customer-facing business case.
      equipmentLines,
      requiredShifts,
      shiftsPerLine,
      requiredProcessingHoursPerDay,
      operatingDaysPerMonth: days,
      operatingHoursPerShift: hours,
      nominalCapacityPerShift: capacityPerShift,

      simplePaybackYears,

      residualMetricTons,

      /*
        Keep both names for compatibility
        with current page.tsx.
      */

      recoveryRate,

      materialRecoveryRate:
        recoveryRate,

      incompleteMaterials:
        incomplete,

      /*
        Expandable Material Revenue detail.
      */

      materials:
        materialRows,

      materialDetail:
        materialRows,

      /*
        Expandable OPEX detail.
      */

      opexDetail,

      /*
        Original object structure retained
        for backwards compatibility.
      */

      opex: {
        labor,
        laborBurden,
        workersComp,
        facility,
        electricity,
        consumables,
        maintenance,
        handling,
        packaging:
          packagingCost,
        insurance,
        admin,
        treatment,
      },
    };
  };

  /* =======================================================
     CALCULATE SELECTED SOLUTIONS
  ======================================================= */

  const solutions =
    input.solutionCodes
      .map((code) =>
        data.solutions.find(
          (x) =>
            x.code === code &&
            x.active
        )
      )
      .filter(Boolean)
      .map((x) =>
        calc(x!)
      );

  /*
    Current UI always sends:
    [PVCIRCULATOR, Compare With]
  */

  const primary =
    solutions[0];

  const compare =
    solutions[1];

  /* =======================================================
     COMPARISON
  ======================================================= */

  const comparison =
    primary && compare
      ? {
          ebitdaAdvantage:
            primary.annualEbitda -
            compare.annualEbitda,

          opexReduction:
            compare.annualOpex
              ? (
                  compare.annualOpex -
                  primary.annualOpex
                ) /
                compare.annualOpex
              : 0,

          residualReduction:
            compare.residualMetricTons
              ? 1 -
                primary.residualMetricTons /
                  compare.residualMetricTons
              : 0,
        }
      : null;

  /* =======================================================
     FINAL RESULT
  ======================================================= */

  return {
    input: {
      ...input,

      panelWeightLb,

      annualPanels,

      operatingDaysPerMonth: days,
      operatingHoursPerDay: hours,

      inputMetricTons,
    },

    region,

    fx: {
      localPerUSD:
        fx,

      effectiveDate:
        fxDate,
    },

    solutions,

    comparison,
  };
}
