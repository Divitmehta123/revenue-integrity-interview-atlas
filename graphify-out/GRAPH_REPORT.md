# Graph Report - curated saved persona relationships  (2026-10-06)

## Corpus Check
- Corpus is ~3,233 words - fits in a single context window. You may not need a graph.

## Summary
- 66 nodes · 146 edges · 16 communities (12 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token usage: unavailable from the Codex subagent tool (no external provider API called)

## Community Hubs (Navigation)
- External / F06 colleagues
- External / F07 colleagues
- F11 colleagues
- F08 colleagues
- F09 colleagues
- F05 colleagues
- F04 colleagues
- F03 colleagues
- F01 colleagues
- F02 colleagues
- F12 colleagues
- F10 colleagues
- Unconnected persona
- Unconnected persona
- Unconnected persona
- Unconnected persona

## God Nodes (most connected - your core abstractions)
1. `Logan (F07 · Project manager)` - 10 edges
2. `Robin (F04 · Project manager)` - 8 edges
3. `Reese (F06 · Project manager)` - 8 edges
4. `Parker (F11 · Project manager)` - 8 edges
5. `Chris (F02 · Project manager)` - 6 edges
6. `Noor (F03 · Controller/CFO)` - 6 edges
7. `Jamie (F03 · Project manager)` - 6 edges
8. `Nina (F04 · Controller/CFO)` - 6 edges
9. `Leila (F05 · Controller/CFO)` - 6 edges
10. `Cameron (F05 · Project manager)` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Chris (F02 · Project manager)` --assigned_relationship--> `Logan (F07 · Project manager)`  [EXTRACTED]
  relationships.md → relationships.md  _Bridges community 9 → community 1_
- `Robin (F04 · Project manager)` --assigned_relationship--> `Parker (F11 · Project manager)`  [EXTRACTED]
  relationships.md → relationships.md  _Bridges community 6 → community 2_
- `Eva (F05 · Project accountant/billing staff)` --assigned_relationship--> `Imani (F08 · Project accountant/billing staff)`  [EXTRACTED]
  relationships.md → relationships.md  _Bridges community 5 → community 3_

## Communities (16 total, 4 thin omitted)

### Community 0 - "External / F06 colleagues"
Cohesion: 0.32
Nodes (8): Ana (F06 · Project accountant/billing staff), Arjun (F06 · Controller/CFO), Dana (external · Client accounts payable), Ellis (F06 · Principal/owner), Fatima (F06 · Operations/IT leader), Felix (external · Client procurement), Lucia (external · Client-side project manager), Reese (F06 · Project manager)

### Community 1 - "External / F07 colleagues"
Cohesion: 0.32
Nodes (8): Devon (F07 · Principal/owner), Logan (F07 · Project manager), Mila (F07 · Controller/CFO), Oliver (external · Client procurement), Ruth (external · Client-side project manager), Sara (F07 · Project accountant/billing staff), Victor (F07 · Technical architect/engineer), Yara (external · Client accounts payable)

### Community 2 - "F11 colleagues"
Cohesion: 0.60
Nodes (5): Aisha (F11 · Controller/CFO), Amara (F11 · Operations/IT leader), Mei (F11 · Project accountant/billing staff), Parker (F11 · Project manager), Rowan (F11 · Principal/owner)

### Community 3 - "F08 colleagues"
Cohesion: 0.60
Nodes (5): Avery (F08 · Principal/owner), Ben (F08 · Controller/CFO), Chloe (F08 · Operations/IT leader), Imani (F08 · Project accountant/billing staff), Quinn (F08 · Project manager)

### Community 4 - "F09 colleagues"
Cohesion: 0.60
Nodes (5): Blake (F09 · Project manager), Ethan (F09 · Technical architect/engineer), Hana (F09 · Project accountant/billing staff), Riley (F09 · Principal/owner), Theo (F09 · Controller/CFO)

### Community 5 - "F05 colleagues"
Cohesion: 0.60
Nodes (5): Cameron (F05 · Project manager), Drew (F05 · Principal/owner), Eva (F05 · Project accountant/billing staff), Leila (F05 · Controller/CFO), Marcus (F05 · Technical architect/engineer)

### Community 6 - "F04 colleagues"
Cohesion: 0.60
Nodes (5): Casey (F04 · Principal/owner), Grace (F04 · Operations/IT leader), Nina (F04 · Controller/CFO), Omar (F04 · Project accountant/billing staff), Robin (F04 · Project manager)

### Community 7 - "F03 colleagues"
Cohesion: 0.60
Nodes (5): Daniel (F03 · Project accountant/billing staff), Jamie (F03 · Project manager), Nikhil (F03 · Technical architect/engineer), Noor (F03 · Controller/CFO), Taylor (F03 · Principal/owner)

### Community 8 - "F01 colleagues"
Cohesion: 0.67
Nodes (4): Alex (F01 · Principal/owner), Jordan (F01 · Project manager), Morgan (F01 · Project accountant/billing staff), Priya (F01 · Controller/CFO)

### Community 9 - "F02 colleagues"
Cohesion: 0.67
Nodes (4): Chris (F02 · Project manager), Elena (F02 · Controller/CFO), Maya (F02 · Project accountant/billing staff), Sam (F02 · Principal/owner)

### Community 10 - "F12 colleagues"
Cohesion: 0.67
Nodes (4): Hayden (F12 · Project manager), Iris (F12 · Controller/CFO), Sofia (F12 · Project accountant/billing staff), Spencer (F12 · Principal/owner)

### Community 11 - "F10 colleagues"
Cohesion: 0.67
Nodes (4): Jesse (F10 · Principal/owner), Luis (F10 · Project accountant/billing staff), Skyler (F10 · Project manager), Zoe (F10 · Controller/CFO)

## Knowledge Gaps
- **4 isolated node(s):** `Simon (external · Incumbent product leader)`, `Clara (external · Incumbent product leader)`, `Mateo (external · Incumbent product leader)`, `Wren (external · Incumbent product leader)`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 4 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Logan (F07 · Project manager)` connect `External / F07 colleagues` to `F02 colleagues`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `Simon (external · Incumbent product leader)`, `Clara (external · Incumbent product leader)`, `Mateo (external · Incumbent product leader)` to the rest of the system?**
  _4 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Why does `Chris (F02 · Project manager)` connect `F02 colleagues` to `External / F07 colleagues`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `Robin (F04 · Project manager)` connect `F04 colleagues` to `F11 colleagues`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._

## Scope and cost disclosure
This is an audit of a fictional assigned network, not a market report. All 146 directed links and their descriptions were checked against the original workbook cells. Four personas have no assigned links. Semantic extraction ran in a Codex subagent; token usage is not exposed by that tool and is unavailable, not free or zero consumption. No external model-provider API was called. Communities and cohesion use the undirected topology; exported links retain their recorded direction. Community structure describes the assigned graph only; it does not establish agreement, purchasing authority, access or demand.
