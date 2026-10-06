"""Losslessly extract saved workbook content for the static reader (stdlib only)."""
import argparse
import hashlib
import json
import posixpath
import re
import shutil
import zipfile
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
NS = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"


def col_number(label):
    result = 0
    for letter in label:
        result = result * 26 + ord(letter) - 64
    return result


def col_label(number):
    result = ""
    while number:
        number, rem = divmod(number - 1, 26)
        result = chr(65 + rem) + result
    return result


def extract(path):
    with zipfile.ZipFile(path) as archive:
        shared = []
        if "xl/sharedStrings.xml" in archive.namelist():
            shared = ["".join(node.itertext()) for node in ET.fromstring(
                archive.read("xl/sharedStrings.xml")).findall("s:si", NS)]
        relations = {r.attrib["Id"]: r.attrib["Target"] for r in ET.fromstring(
            archive.read("xl/_rels/workbook.xml.rels"))}
        sheets = []
        for sheet in ET.fromstring(archive.read("xl/workbook.xml")).findall("s:sheets/s:sheet", NS):
            target = relations[sheet.attrib[f"{{{REL}}}id"]]
            target = target.lstrip("/") if target.startswith("/") else "xl/" + target
            tree = ET.fromstring(archive.read(target))
            cells = {}
            for cell in tree.findall(".//s:sheetData/s:row/s:c", NS):
                if cell.find("s:f", NS) is not None:
                    raise ValueError("This literal-text corpus must not contain formulas")
                kind = cell.get("t")
                raw = cell.find("s:v", NS)
                if kind == "s":
                    value = shared[int(raw.text)]
                elif kind == "inlineStr":
                    value = "".join(cell.find("s:is", NS).itertext())
                elif raw is None or raw.text is None:
                    continue
                elif kind in ("str", "e"):
                    value = raw.text
                elif kind == "b":
                    value = raw.text == "1"
                else:
                    value = float(raw.text)
                    if value.is_integer():
                        value = int(value)
                cells[cell.attrib["r"]] = value
            # Read the native table boundary; scope notes outside it remain separate.
            part = tree.find("s:tableParts/s:tablePart", NS)
            sheet_rel_path = posixpath.join(posixpath.dirname(target), "_rels", posixpath.basename(target) + ".rels")
            sheet_rels = {r.attrib["Id"]: r.attrib["Target"] for r in ET.fromstring(archive.read(sheet_rel_path))}
            table_target = sheet_rels[part.attrib[f"{{{REL}}}id"]]
            table_path = table_target.lstrip("/") if table_target.startswith("/") else posixpath.normpath(posixpath.join(posixpath.dirname(target), table_target))
            table_ref = ET.fromstring(archive.read(table_path)).attrib["ref"]
            start, end = table_ref.split(":")
            assert start == "A6", table_ref
            width = col_number(re.match(r"[A-Z]+", end)[0])
            last = int(re.search(r"\d+$", end)[0])
            headers = [cells.get(f"{col_label(col)}6", "") for col in range(1, width + 1)]
            rows = [[cells.get(f"{col_label(col)}{row}", "") for col in range(1, width + 1)]
                    for row in range(7, last + 1)]
            outside = {ref: value for ref, value in cells.items()
                       if not (6 <= int(re.search(r"\d+$", ref)[0]) <= last
                               and col_number(re.match(r"[A-Z]+", ref)[0]) <= width)}
            sheets.append({"name": sheet.attrib["name"], "table_ref": table_ref, "headers": headers,
                           "first_data_row": 7, "rows": rows, "outside_cells": outside})
    return {"schema_version": 1, "workbook_name": path.name,
            "workbook_sha256": hashlib.sha256(path.read_bytes()).hexdigest(), "sheets": sheets}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("workbook", type=Path, nargs="?", default=ROOT / "data/Revenue_Integrity_66_Agent_Interviews.xlsx")
    args = parser.parse_args()
    data = extract(args.workbook)
    serialized = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    for pattern in (r"\bAQ\.[A-Za-z0-9_-]{40,}", r"sk-or-v1-[0-9a-f]{64}",
                    r"Authorization: Bearer", r"x-goog-api-key", r"[A-Za-z]:\\Users\\"):
        if re.search(pattern, serialized, re.I):
            raise ValueError("Publication blocked: credential or private-path pattern detected")
    (ROOT / "data").mkdir(exist_ok=True)
    destination = ROOT / "data" / data["workbook_name"]
    if args.workbook.resolve() != destination.resolve():
        shutil.copyfile(args.workbook, destination)
    (ROOT / "data/workbook.json").write_text(serialized + "\n", encoding="utf-8")
    # Script wrapper enables direct file:// use without a server. Escape script delimiters.
    (ROOT / "data/workbook.js").write_text("window.INTERVIEW_WORKBOOK = " + serialized.replace("<", "\\u003c")
                                          + ";\n", encoding="utf-8")
    manifest = {"workbook_sha256": data["workbook_sha256"],
                "sheets": {s["name"]: {"rows": len(s["rows"]), "columns": len(s["headers"])} for s in data["sheets"]}}
    (ROOT / "data/manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
