"""US PV end-of-life (retirement) mass, IRENA/IEA-PVPS 2016 Weibull model.
F(t) = 1 - exp(-(t/T)^alpha); regular-loss alpha=5.3759, early-loss alpha=2.4928 (IRENA/IEA-PVPS 2016, Table 5, p.30).
T options: 25 / 18 (default) / 15 / 12 years. Same model and installation inputs as phase 2.
Waste in year y from installs in year i: M_i * [F(y-i+1) - F(y-i)]  (installs treated as entering service at start of year i).
"""
import csv, math, json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
hist = {int(r['year']): float(r['cumulative_MW']) for r in csv.DictReader(open(ROOT / 'data/us-pv-installations.csv'))}
years_hist = sorted(hist)
add = {}
prev = 0.0
for y in years_hist:
    add[y] = hist[y] - prev  # year-2000 value = cumulative stock at end-2000 (treated as installed in 2000)
    prev = hist[y]
LAST = years_hist[-1]
flat = hist[LAST] - hist[LAST-1]  # 2025 additions, held constant 2026-2050 (ASSUMPTION)
for y in range(LAST+1, 2051):
    add[y] = flat
# t/MWp by install year: IRENA 2026 p.14: 2024 ~60 t/MWp, 27% lower than 2014; -12% by 2035 vs 2024.
m2014, m2024, m2035 = 60/0.73, 60.0, 60*0.88
def tpm(y):
    if y <= 2014: return m2014
    if y <= 2024: return m2014*(m2024/m2014)**((y-2014)/10)
    if y <= 2035: return m2024*(m2035/m2024)**((y-2024)/11)
    return m2035
F = lambda t,T,a: 0.0 if t <= 0 else 1-math.exp(-(t/T)**a)
A = {'regular':5.3759,'early':2.4928}
Ts = [25,18,15,12]
cols = []
res = {}
for T in Ts:
    for s,a in A.items():
        k=f'{s}_T{T}'; cols.append(k); res[k]={}
        for y in range(2000,2051):
            res[k][y]=sum(add[i]*tpm(i)*(F(y-i+1,T,a)-F(y-i,T,a)) for i in add if i<=y)
with open(ROOT / 'docs/phase2/wave-series.csv','w',newline='') as f:
    w=csv.writer(f)
    w.writerow(['year','cum_capacity_MW','annual_additions_MW','additions_source','t_per_MW_install_year']+[c+'_t' for c in cols])
    cum=0
    for y in range(2000,2051):
        cum+=add[y]
        w.writerow([y,round(cum,1),round(add[y],1),'IRENA statistics' if y<=LAST else f'ASSUMPTION flat = {LAST} additions',round(tpm(y),2)]+[round(res[c][y]) for c in cols])
def cross(k,th):
    for y in range(2000,2051):
        if res[k][y]>=th: return y
    return '>2050'
print('flat additions MW',round(flat,1))
for c in cols:
    cumul=lambda Y: sum(res[c][y] for y in range(2000,Y+1))
    print(c,'100kt:',cross(c,1e5),'500kt:',cross(c,5e5),'1Mt:',cross(c,1e6),'| 2025',round(res[c][2025]/1e3),'kt 2030',round(res[c][2030]/1e3),'kt 2040',round(res[c][2040]/1e3),'kt 2050',round(res[c][2050]/1e3),'kt | cum2016',round(cumul(2016)),'cum2030',round(cumul(2030)),'cum2050',round(cumul(2050)))

output = {'meta': {'unit': 'metric tonnes per year', 'model': 'IRENA/IEA-PVPS 2016 Weibull F(t)=1-exp(-(t/T)^alpha)', 'alpha': A, 'lifetimes': Ts, 'defaultLifetime': 18, 'capacity': 'IRENA statistics USA solar PV MW 2000–2025; post-2025 additions held at the 2025 level; scenario, not a forecast'}, 'years': list(range(2016,2051)), 'crossings': {c: {str(th): cross(c, th) for th in [100000,500000,1000000]} for c in cols}}
output.update({c: [round(res[c][y]) for y in output['years']] for c in cols})
(ROOT / 'data/us-retirement-wave.json').write_text(json.dumps(output, indent=2)+'\n')
