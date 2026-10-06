"""Independent XML checks of the redesigned Excel copy and extracted fictional graph."""
import hashlib,json,unittest,zipfile,collections
from pathlib import Path
import xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
NS={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main','c':'http://schemas.openxmlformats.org/drawingml/2006/chart'}
DATA=json.loads((ROOT/'data/workbook.json').read_text(encoding='utf8'))
BOOK=ROOT/'data/Revenue_Integrity_Interview_Atlas_Visual.xlsx'
def col(index):
 result=''
 while index:
  index,m=divmod(index-1,26);result=chr(65+m)+result
 return result
def read_book():
 with zipfile.ZipFile(BOOK) as z:
  assert z.testzip() is None
  strings=[''.join(n.itertext()) for n in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('s:si',NS)]
  names=[s.get('name') for s in ET.fromstring(z.read('xl/workbook.xml')).findall('s:sheets/s:sheet',NS)]
  sheets={};formulas={}
  for i,name in enumerate(names,1):
   values={};fx={}
   for cell in ET.fromstring(z.read(f'xl/worksheets/sheet{i}.xml')).findall('.//s:row/s:c',NS):
    raw=cell.find('s:v',NS);f=cell.find('s:f',NS)
    if f is not None:fx[cell.get('r')]=f.text
    if cell.get('t')=='s':v=strings[int(raw.text)]
    elif cell.get('t')=='inlineStr':v=''.join(cell.find('s:is',NS).itertext())
    elif raw is None or raw.text is None:v=''
    elif cell.get('t') in ('str','e'):v=raw.text
    elif cell.get('t')=='b':v=raw.text=='1'
    else:v=float(raw.text)
    values[cell.get('r')]=v
   sheets[name]=values;formulas[name]=fx
  return sheets,formulas,z.namelist()
class VisualTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):cls.sheets,cls.formulas,cls.files=read_book()
 def test_every_original_cell_preserved(self):
  self.assertEqual(list(self.sheets),['Overview','Reader','Network',*[s['name'] for s in DATA['sheets']]])
  count=0
  for spec in DATA['sheets']:
   expected=dict(spec['outside_cells'])
   expected.update({col(i)+str(6):v for i,v in enumerate(spec['headers'],1)})
   for r,values in enumerate(spec['rows'],7):expected.update({col(c)+str(r):v for c,v in enumerate(values,1)})
   for address,value in expected.items():
    self.assertEqual(self.sheets[spec['name']].get(address,''),value,(spec['name'],address));count+=1
  print('Original source cells compared:',count)
 def test_native_features_and_no_formula_errors(self):
  with zipfile.ZipFile(BOOK) as z:
   charts=[n for n in z.namelist() if '/charts/chart' in n and n.endswith('.xml')]
   self.assertEqual(len(charts),3)
   for file in charts:
    tree=ET.fromstring(z.read(file));refs=tree.findall('.//c:f',NS)
    self.assertTrue(refs);self.assertTrue(all('Overview!' in r.text.replace("'",'') for r in refs))
   self.assertEqual(len([n for n in z.namelist() if n.startswith('xl/tables/') and n.endswith('.xml')]),6)
   reader=ET.fromstring(z.read('xl/worksheets/sheet2.xml'))
   self.assertEqual(len(reader.findall('s:dataValidations/s:dataValidation',NS)),2)
   drawing=z.read('xl/drawings/drawing2.xml').decode()
   self.assertIn('xdr:pic',drawing);self.assertIn('xl/media/image.png',z.namelist())
   self.assertEqual(hashlib.sha256(z.read('xl/media/image.png')).hexdigest(),hashlib.sha256((ROOT/'graphify-out/network.png').read_bytes()).hexdigest())
  for name,values in self.sheets.items():
   for addr,value in values.items():self.assertNotIn(value if isinstance(value,str) else '',['#REF!','#DIV/0!','#VALUE!','#NAME?','#N/A','#NUM!','#NULL!','#SPILL!','#CALC!'],(name,addr))
 def test_cached_summary_and_reader(self):
  o=self.sheets['Overview'];self.assertEqual(sum(o[f'C{r}'] for r in range(9,19)),66)
  self.assertEqual(sum(o[f'D{r}'] for r in range(25,38)),1248)
  self.assertEqual(sum(v for r in range(65,144) if isinstance(v:=o.get(f'C{r}'),(int,float))),539)
  self.assertEqual(sum(o[f'D{r}'] for r in range(65,144)),709)
  interviews=next(s['rows'] for s in DATA['sheets'] if s['name']=='Interviews')
  self.assertEqual(self.sheets['Reader']['B17'],interviews[0][8]);self.assertEqual(self.sheets['Reader']['B12'],interviews[0][7])
  self.assertIn('MATCH',self.formulas['Reader']['B17']);self.assertEqual(len(self.formulas['Interviews']),990)
 def test_exact_graph(self):
  people=next(s['rows'] for s in DATA['sheets'] if s['name']=='Personas');names={r[1] for r in people}
  graph=json.loads((ROOT/'graphify-out/graph.json').read_text(encoding='utf8'))
  node_names={n['id']:n['label'] for n in graph['nodes']};self.assertEqual(set(node_names.values()),names)
  expected=collections.Counter((r[1],line.split(': ',1)[0],line.split(': ',1)[1],f'Personas!J{row}') for row,r in enumerate(people,7) for line in r[9].split('\n') if line)
  links=graph['links'];self.assertEqual(len(links),146)
  actual=collections.Counter((node_names[e['source']],node_names[e['target']],e['description'],e['source_location']) for e in links)
  self.assertEqual(actual,expected)
  self.assertTrue(all(e['confidence']=='EXTRACTED' and e['confidence_score']==1 for e in links))
if __name__=='__main__':unittest.main(verbosity=2)
