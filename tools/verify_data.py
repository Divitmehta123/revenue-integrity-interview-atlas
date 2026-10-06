"""Independent checks of exact workbook content, archive coverage, and release safety."""
import hashlib
import json
import re
import unittest
import zipfile
from collections import Counter, defaultdict
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
NS = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
EXPECTED_HASH = "49647106a3513aae0ff53f7c70f230e29a3dabd2cfc751f7de02df569e64815e"
DATA = json.loads((ROOT / "data/workbook.json").read_text(encoding="utf-8"))
SHEETS = {s["name"]: s for s in DATA["sheets"]}


def col_name(index):
    result = ""
    while index:
        index, mod = divmod(index - 1, 26)
        result = chr(65 + mod) + result
    return result


class PreservationTests(unittest.TestCase):
    def test_original_workbook_bytes(self):
        digest = hashlib.sha256((ROOT / "data" / DATA["workbook_name"]).read_bytes()).hexdigest()
        self.assertEqual(digest, EXPECTED_HASH)
        self.assertEqual(DATA["workbook_sha256"], EXPECTED_HASH)

    def test_every_populated_cell_independently(self):
        with zipfile.ZipFile(ROOT / "data" / DATA["workbook_name"]) as archive:
            shared = ["".join(n.itertext()) for n in ET.fromstring(archive.read("xl/sharedStrings.xml")).findall("s:si", NS)]
            for number, sheet in enumerate(DATA["sheets"], 1):
                actual = {}
                for cell in ET.fromstring(archive.read(f"xl/worksheets/sheet{number}.xml")).findall(".//s:row/s:c", NS):
                    raw = cell.find("s:v", NS)
                    self.assertIsNone(cell.find("s:f", NS))
                    if cell.get("t") == "s":
                        value = shared[int(raw.text)]
                    elif cell.get("t") == "inlineStr":
                        value = "".join(cell.find("s:is", NS).itertext())
                    elif raw is None or raw.text is None:
                        continue
                    elif cell.get("t") in ("str", "e"):
                        value = raw.text
                    elif cell.get("t") == "b":
                        value = raw.text == "1"
                    else:
                        value = float(raw.text)
                    if value != "":
                        actual[cell.get("r")] = value
                rebuilt = {k: v for k, v in sheet["outside_cells"].items() if v != ""}
                for col, value in enumerate(sheet["headers"], 1):
                    if value != "":
                        rebuilt[f"{col_name(col)}6"] = value
                for row, values in enumerate(sheet["rows"], sheet["first_data_row"]):
                    for col, value in enumerate(values, 1):
                        if value != "":
                            rebuilt[f"{col_name(col)}{row}"] = value
                self.assertEqual(rebuilt, actual, sheet["name"])

    def test_json_and_offline_script_are_identical(self):
        wrapper = (ROOT / "data/workbook.js").read_text(encoding="utf-8")
        self.assertTrue(wrapper.startswith("window.INTERVIEW_WORKBOOK = "))
        self.assertEqual(json.loads(wrapper.split(" = ", 1)[1].strip().removesuffix(";")), DATA)

    def test_all_interviews_and_verdicts(self):
        self.assertEqual([len(s["rows"]) for s in DATA["sheets"]], [66, 990, 66, 1394, 2688])
        self.assertEqual([len(s["headers"]) for s in DATA["sheets"]], [15, 17, 14, 10, 8])
        counts = Counter((row[0], row[4]) for row in SHEETS["Interviews"]["rows"])
        for agent in range(66):
            self.assertEqual(counts[(agent, "Initial")], 12)
            self.assertEqual(counts[(agent, "Follow-up")], 3)
        self.assertEqual({r[0] for r in SHEETS["Verdicts"]["rows"]}, set(range(66)))
        self.assertEqual({r[0] for r in SHEETS["Personas"]["rows"]}, set(range(66)))

    def test_complete_source_and_prompt_parts(self):
        sources = defaultdict(list)
        for row in SHEETS["Sources"]["rows"]:
            sources[row[0]].append(row)
        brief = [key for key in sources if key.startswith("BRIEF-")]
        self.assertEqual(len(sources) - len(brief), 1248)
        self.assertEqual(len(brief), 45)
        for key, rows in sources.items():
            self.assertEqual(sorted(r[1] for r in rows), list(range(1, len(rows) + 1)), key)
            self.assertTrue(all(r[2:8] == rows[0][2:8] and r[9] == rows[0][9] for r in rows), key)
        messages = defaultdict(list)
        calls = defaultdict(list)
        for row in SHEETS["Prompts"]["rows"]:
            (messages if row[1] == "Message text" else calls)[row[0]].append(row)
        self.assertEqual(len(calls), 132)
        for key, rows in messages.items():
            self.assertEqual(sorted(r[5] for r in rows), list(range(1, len(rows) + 1)), key)
        for rows in calls.values():
            self.assertEqual(sorted(r[5] for r in rows), list(range(1, len(rows) + 1)))
            for row in rows:
                self.assertIn(row[6], messages)

    def test_scope_notes_and_literal_rendering(self):
        self.assertTrue(all(SHEETS["Verdicts"]["outside_cells"].get(f"Q{n}") for n in range(2, 15)))
        app = (ROOT / "app.js").read_text(encoding="utf-8")
        self.assertIn("escape(source.text)", app.replace("exact(source.text)", "escape(source.text)"))
        self.assertIn("escape(messages.get(r[6]))", app)
        self.assertNotIn("fetch(", app)
        self.assertNotIn("localStorage", app)
        self.assertNotIn("eval(", app)

    def test_release_has_no_credentials_or_local_paths(self):
        # Split dangerous prefixes so this verifier does not flag its own patterns.
        patterns = [r"\bA" + r"Q\.[A-Za-z0-9_-]{40,}", r"sk-" + r"or-v1-[0-9a-f]{64}",
                    r"Authorization" + r": Bearer [^\s]+", r"[A-Za-z]:\\Users\\"]
        for path in ROOT.rglob("*"):
            if any(part in (".git", "__pycache__", "node_modules") for part in path.parts):
                continue
            if path.is_file() and path.suffix.lower() in (".json", ".js", ".html", ".css", ".md", ".yml", ".svg"):
                text = path.read_text(encoding="utf-8")
                for pattern in patterns:
                    self.assertIsNone(re.search(pattern, text, re.I), f"Sensitive content in {path.relative_to(ROOT)}")


if __name__ == "__main__":
    unittest.main(verbosity=2)
