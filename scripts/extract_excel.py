"""Extrage datele reale din docs/raport_alocare_2167.xlsx în src/data/seed/excelData.ts.

Foi folosite:
  - Raport EEE (rândurile 13-148): declarațiile lunare pe client / categorie / subcategorie
  - Colectat: cantitățile colectate pe categorie (B = iulie, C = august 2026)
Rulare: npm run seed
"""
import json, re
from pathlib import Path
import openpyxl

ROOT = Path(__file__).resolve().parent.parent
XLSX = ROOT / "docs" / "raport_alocare_2167.xlsx"
OUT = ROOT / "src" / "data" / "seed" / "excelData.ts"

LUNI = {"Ianuarie": 1, "Februarie": 2, "Martie": 3, "Aprilie": 4, "Mai": 5, "Iunie": 6,
        "Iulie": 7, "August": 8, "Septembrie": 9, "Octombrie": 10, "Noiembrie": 11, "Decembrie": 12}
CAT_BY_NAME = {
    "ECRANE, MONITOARE SI ECHIPAMENTE CU ECRANE": "2",
    "LAMPI": "3",
    "ECHIPAMENTE DE MARI DIMENSIUNI": "4",
    "PANOURI FOTOVOLTAICE": "4B",
    "ECHIPAMENTE DE MICI DIMENSIUNI": "5",
    "ECHIP. IT&C MICI": "6",
}

def num(v):
    # repr() al unui float Python dă cea mai scurtă reprezentare zecimală exactă a valorii din Excel
    if v is None:
        return "0"
    if isinstance(v, int):
        return str(v)
    s = repr(float(v))
    return s[:-2] if s.endswith(".0") else s

wb = openpyxl.load_workbook(XLSX, data_only=True)
ws = wb["Raport EEE"]
clients, lines = {}, []
for r in range(13, 149):
    perioada, client, cui, cat, _catname, subcod, subname, buc, kg, ron = [ws.cell(r, c).value for c in range(1, 11)]
    if not client:
        continue
    luna_s, an_s = perioada.split(" ")
    cui = str(cui).strip()
    cid = "cl_" + re.sub(r"\D", "", cui)
    if cid not in clients:
        clients[cid] = {"id": cid, "denumire": client.strip(), "cui": cui, "esteTest": False}
    lines.append({
        "id": f"rl_{r}",
        "clientId": cid,
        "an": int(an_s),
        "luna": LUNI[luna_s],
        "categorie": str(cat).strip(),
        "subcategorieCod": str(subcod).strip(),
        "subcategorie": subname.strip(),
        "bucati": int(buc or 0),
        "greutateKg": num(kg),
        "valoareRon": num(ron),
        "status": "Aprobată",
    })

wc = wb["Colectat"]
collected = []
for r in range(2, 8):
    name = wc.cell(r, 1).value.strip()
    for col, luna in ((2, 7), (3, 8)):
        collected.append({"an": 2026, "luna": luna, "categorie": CAT_BY_NAME[name], "cantitateKg": num(wc.cell(r, col).value)})

header = "// GENERAT AUTOMAT de scripts/extract_excel.py din docs/raport_alocare_2167.xlsx. Nu edita manual.\n"
header += "import type { Client, DeclarationLine, CollectedEntry } from '../types';\n\n"
body = (
    f"export const seedClients: Client[] = {json.dumps(list(clients.values()), ensure_ascii=False, indent=2)};\n\n"
    f"export const seedDeclarationLines: DeclarationLine[] = {json.dumps(lines, ensure_ascii=False, indent=2)};\n\n"
    f"export const seedCollected: CollectedEntry[] = {json.dumps(collected, ensure_ascii=False, indent=2)};\n"
)
OUT.write_text(header + body, encoding="utf-8")
print(f"{len(clients)} clienți, {len(lines)} linii de declarație, {len(collected)} înregistrări colectat -> {OUT.relative_to(ROOT)}")
