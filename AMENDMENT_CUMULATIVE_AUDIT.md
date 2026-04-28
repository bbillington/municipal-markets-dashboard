# Amendment Cumulative-vs-Increment Audit (2026-04-28)

## What this is

Same data quality bug as the Mary's Creek $21.5M issue surfaced in v2.49 —
M&C extractions captured a contract amendment's **cumulative revised total**
instead of the **increment** that the amendment actually adds.

The corresponding agenda extraction usually got the increment right
(agendas list "$X to an Engineering Agreement with..." which is the
increment), so for many of these we already have the correct row from
the agenda PDF and the M&C row is a phantom.

Brent's amendment policy (set in v2.49): **each amendment is its own
row using INCREMENT, not cumulative total.**

## Scale

- **24 phantom rows** all in Fort Worth
- **$39.4M of phantom contract value** inflating market-share / Halff-share
  numbers and category totals
- All from M&C PDFs whose agenda twin already records the correct
  increment

## Top phantoms by inflation

| Date       | Consultant            | Inc (correct) | M&C Cum (wrong) | Phantom $ | Project                                    |
|------------|-----------------------|--------------:|----------------:|----------:|--------------------------------------------|
| 2025-01-28 | Brown and Caldwell    |      $654,588 |      $9,348,067 | +$8.69M   | Emerging Contaminants PFAS Treatment       |
| 2025-12-09 | AECOM Technical Svcs  |      $256,935 |      $4,440,306 | +$4.18M   | Butler Place Access & Development Plan     |
| 2024-06-11 | Hazen and Sawyer      |      $276,828 |      $3,665,774 | +$3.39M   | Village Creek WRF Digester Improvements    |
| 2024-04-09 | HDR Engineering       |      $382,936 |      $3,434,404 | +$3.05M   | Avondale Haslet — Willow Creek to John Day |
| 2025-12-09 | **Halff Associates**  |      $271,420 |      $3,143,174 | +$2.87M   | WJ Boaz Road Widening                      |
| 2025-12-09 | TranSystems           |      $201,740 |      $2,880,290 | +$2.68M   | General On-Call Transportation Planning    |
| 2024-11-12 | Kimley-Horn           |       $64,140 |      $1,703,144 | +$1.64M   | Westside III GST + Westside IV/V Pump      |
| 2025-08-26 | Freese and Nichols    |       $20,316 |      $1,629,850 | +$1.61M   | Village Creek WRF Grit Facility            |
| 2024-08-27 | BGE, Inc.             |      $385,460 |      $1,980,740 | +$1.60M   | Big Fossil Creek Collector Parallel Ph IVA |
| 2025-10-21 | AECOM                 |      $988,821 |      $2,509,574 | +$1.52M   | Meacham Boulevard Phase 2                  |
| 2025-10-21 | AECOM                 |      $109,697 |      $1,392,318 | +$1.28M   | 16-24 Inch Cast Iron Water Main (East)     |
| 2024-06-11 | Kimley-Horn           |      $155,870 |      $1,287,870 | +$1.13M   | NW Loop 820 / Marine Creek Intersection    |
| 2025-09-30 | **Halff Associates**  |    $1,000,000 |      $2,000,000 | +$1.00M   | Linwood & West 7th Flood Mitigation        |
| 2024-08-13 | **Halff Associates**  |      $200,000 |      $1,100,000 | +$0.90M   | Drainage and Floodplain Review Services    |
| 2025-06-24 | James DeOtte Eng      |      $124,511 |        $891,008 | +$0.77M   | Cunningham Rd Hazardous Road Overtopping   |
| 2025-09-30 | Kimley-Horn           |      $245,849 |        $995,731 | +$0.75M   | WSM-W Water/Sewer Replacement              |
| 2024-12-10 | Freese and Nichols    |      $307,610 |      $1,008,925 | +$0.70M   | 16-42 Inch Cast Iron Water Main Downtown   |
| 2024-03-26 | Shield Engineering    |      $644,000 |      $1,194,840 | +$0.55M   | FW Central City Flood Control Drainage     |
| 2025-09-30 | Kimley-Horn           |    $1,000,000 |      $1,500,000 | +$0.50M   | McCart Berry Flood Mitigation Program      |
| 2024-12-10 | HDR Engineering       |      $183,100 |        $390,600 | +$0.21M   | Chuck Silcox/Lebow/Westhaven/Kingsridge    |
| ...4 more rows under $0.20M each                                                                              |

Note: 3 of these phantoms are Halff projects, so the Halff position in
charts is currently *over-stated* by ~$4.8M.

## Verified manually

- **Brown and Caldwell PFAS (M&C 25-0089)**: PDF text says
  "Amendment No. 3 in the Amount of $654,588.00, for a Revised Contract
  Amount of $9,348,067.00." The M&C extraction captured the revised
  total. Confirmed.
- **McCart Berry (M&C 25-0932)**: PDF text says "Amendment No. 1 in
  the Amount of $1,000,000.00... for a Revised Contract Amount of
  $1,500,000.00." M&C extraction captured the revised total. Confirmed.

## Recommended action

Add a sibling to `scripts/cleanup_agenda_dupes.py` that does the
INVERSE — for amendment rows where:

1. Agenda twin exists on same date, same company, project content sig matches
2. Agenda row notes contain "amendment"
3. M&C row amount is meaningfully larger than agenda row amount (>=20% bigger)

→ Delete the M&C row. Agenda has the correct increment.

Pre-write `.bak.YYYYMMDD`. Call `_rebuild_config(wb)` after deletion
(per the v2.50 lesson — Excel year-tab edits don't propagate to JSON
without a Config rebuild).

## Why this isn't auto-deleted

A $39M data correction shouldn't be a silent bg job — it changes
several charts' headline numbers visibly:
- Total contract value: -$39.4M (~ -3% of dataset)
- Halff total: -$4.8M (-1-2% of Halff line in charts)
- Several consultant rankings will shift

Brent should review this list and bless the deletions before they ship.
