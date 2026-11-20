#!/usr/bin/env python3
"""Lee el índice de la construcción de Apymeco y actualiza data/construccion.json.
Si la página falla o cambia de formato, no toca nada (el portal sigue con el último valor)."""
import json, re, sys, urllib.request, datetime, pathlib

URL = "https://www.apymeco.com.ar/indice.php"
OUT = pathlib.Path(__file__).resolve().parent.parent / "data" / "construccion.json"

def num(s):  # "2.534.060,94" -> 2534060.94
    return float(s.replace(".", "").replace(",", "."))

req = urllib.request.Request(URL, headers={"User-Agent": "Mozilla/5.0"})
html = urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "replace")
rows = re.findall(
    r"<tr>\s*<td>\s*([A-ZÁÉ]{3}/\d{2})\s*</td>\s*<td>\s*\$\s*([\d.,]+)\s*</td>\s*<td>\s*([\d.,]+)\s*</td>\s*<td>\s*([\d.,]+)\s*%",
    html)
if not rows:
    sys.exit("No pude leer la tabla de Apymeco: no se modifica nada.")
serie = [{"mes": m, "valorM2": num(v), "indice": num(i), "variacion": num(p)} for m, v, i, p in rows]
nuevo = {"fuente": URL, "actualizado": datetime.date.today().isoformat(),
         "mes": serie[0]["mes"], "valorM2": serie[0]["valorM2"], "serie": serie}
try:
    viejo = json.loads(OUT.read_text(encoding="utf-8"))
except Exception:
    viejo = {}
if viejo.get("serie") == serie:
    print("Sin cambios:", nuevo["mes"]); sys.exit(0)
OUT.parent.mkdir(exist_ok=True)
OUT.write_text(json.dumps(nuevo, ensure_ascii=False, indent=1), encoding="utf-8")
print("Actualizado:", nuevo["mes"], nuevo["valorM2"])
