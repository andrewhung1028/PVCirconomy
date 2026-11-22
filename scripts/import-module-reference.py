"""Convert the supplied Numbers reference; requires numbers-parser in a venv.
Usage: python scripts/import-module-reference.py path/to/source.numbers
No production database is modified. Units follow the source workbook (mm, kg, W).
"""
import sys, json, hashlib
from pathlib import Path
from numbers_parser import Document
source=Path(sys.argv[1]); doc=Document(source)
table=next(s for s in doc.sheets if s.name=='Modules').tables[0]
rows=table.rows(values_only=True)
def number(value):
    return round(float(value),4) if isinstance(value,(int,float)) and value>0 else None
result=[]
for index,row in enumerate(rows[1:],2):
    if not row[0] or not row[1]: continue
    result.append(dict(id=f'ref-{index}',manufacturer=str(row[0]),model=str(row[1]),rated_watts=number(row[2]),length_mm=number(row[4]),width_mm=number(row[5]),dimension_source=row[6],verified_weight_kg=number(row[7]),estimated_weight_kg=number(row[8]),weight_method=row[9],source_url=row[11],construction=row[14],dimension_category=row[16],weight_category=row[17]))
out=Path('data/module-reference.json');out.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')))
Path('data/module-reference-meta.json').write_text(json.dumps(dict(source=source.name,sha256=hashlib.sha256(source.read_bytes()).hexdigest(),rowCount=len(result),sourceDate='2026-11-13',units=dict(dimensions='mm',weight='kg',power='W')),indent=2))
print(f'Exported {len(result)} reference rows ({out.stat().st_size} bytes). Estimated and verified data remain separate.')
