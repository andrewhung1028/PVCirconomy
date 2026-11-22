# US retirement wave: selectable lifetime scenarios

Updated 2026-11-22 for Andrew’s 17:34 override. Run `python3 scripts/wave.py` from the website directory; it writes `data/us-retirement-wave.json` and `docs/phase2/wave-series.csv`.

The existing retirement-volume slide is now the line chart; the separate US chart slide is removed. Lifetime options are 25 / 18 / 15 / 12 years, default 18. The wave deck advances every 30 seconds when visible, with the existing focus, navigation-hover and reduced-motion pauses.

| Lifetime | Source label |
| --- | --- |
| 25 | IRENA 2026, 25 years |
| 18 | PV Circonomy conservative assumption (default) |
| 15 | Jean, Woodhouse & Bulović, Joule 2019 (initial life under 15 years) |
| 12 | NREL/TP-6A20-74124 p.8 (repowering every 10–12 years, upper bound) |

These labels identify the basis for choosing a scenario lifetime. The model applies each chosen T to the same early- and regular-loss Weibull curves; it does not reproduce the cited papers’ distinct methods. The 25-year curves remain faint references when another lifetime is selected.

Model: F(t) = 1 − exp(−(t/T)^α). IRENA/IEA-PVPS 2016 shape factors remain 2.4928 (early loss) and 5.3759 (regular loss). T is the model’s lifetime scale parameter; no additional conversion to a statistical mean is applied. Annual mass is the sum of installation-cohort mass × [F(age+1) − F(age)].

Inputs are unchanged: `data/us-pv-installations.csv` preserves the 2000–2025 cumulative capacity column from the existing phase-2 series. Annual additions are differences of cumulative capacity; pre-2000 stock enters as the 2000 cohort. Post-2025 additions remain at 2025’s 34,015.8 MW/year through 2050. No AC-to-DC correction is applied. Mass per MW is 60/0.73 t before 2014, 60 t in 2024 and 52.8 t from 2035, with logarithmic interpolation between anchors (IRENA 2026).

The JSON contains eight annual series for 2016–2050 and first threshold-crossing years computed over 2000–2050 before rounding. The right panel reads those crossings for 100 kt, 500 kt and 1 Mt/year. This is a scenario, not a forecast. Thresholds depend on the lifetime, mass and future-installation assumptions.
