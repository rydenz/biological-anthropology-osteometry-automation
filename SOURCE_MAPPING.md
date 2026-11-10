# Workbook method mapping and scientific validation notes

Source: the owner's private Excel workbook, `Sex estimation RMIL Tomb 3.xlsx`, read-only on 2026-11-10. The private workbook and original specimen records are **not** included in this public repository.

## Workbook sheets

| Source sheet | Prototype module | Status |
|---|---|---|
| ` Femur Bass` | Femur / Bass | Existing prototype |
| `Femur Spradley` | Femur / Spradley | Existing prototype |
| `Femur Kanz` | Femur / Kanz | Existing prototype |
| `Femur` | Femur / Summary | Existing prototype |
| `Humerus Bass` | Humerus / Bass | Reference table imported; final sex decision rule needs verification |
| `Humerus Spradley` | Humerus / Spradley | Discriminant score implemented; sex cutoff/direction needs verification |
| `Humerus` | Humerus / Summary | Generated summary; sex classification remains under review |
| `Mandible` | Mandible / FD 1–5 | FD 1, 2, 3, 5 implemented; FD 4 formula missing |

## Humerus

Canonical measurement keys are scoped to one Humerus specimen, identified by Individual + Number in a given Site/Context.

| Key | Name | Used by |
|---|---|---|
| 1 | Maximal length | Spradley |
| 9a | Maximum diameter of head (transverse) | Bass; Spradley head diameter mapping to confirm |
| 10a | Maximum vertical diameter of head | Bass; Spradley |
| 5 | Maximum diameter midshaft | Spradley |
| 6 | Minimum diameter midshaft | Reference input table |
| 4 | Epicondylar breadth | Bass; reference input table |

Humerus Spradley score from the left-side worksheet: `0.04008 × D + 0.4011 × E + 0.26862 × F + 0.62205 × G − 59.6723`. In the prototype, D→1, E→9a, F→10a, G→5. This numeric mapping must be checked against the lab's measurement protocol before research use.

Bass worksheet reference values:

| Variable | Female | Male |
|---|---:|---:|
| Head vertical (10a) | 42.67 | 48.76 |
| Head transverse (9a) | 36.98 | 44.66 |
| Epicondylar breadth (4) | 56.76 | 63.89 |

The source workbook has manual sex classifications and no formulas implementing a combined Bass classification. Its Spradley sheet also shows a **positive score labeled Female**. Therefore, the prototype calculates and displays the score/references but does **not** infer sex automatically for Humerus.

## Mandible

Nine source measurement columns, stored once per specimen and shared across available functions:

`D` Ramus length; `E` Coronoid height; `F` Chin width; `G` Chin height; `H` Condyle width; `I` Bi-gonial breadth; `J` Symphysis height; `K` Antegonial notch area; `L` Body height P1–P2.

The Excel `Number` column in the formula examples identifies FD 1–5; it is **not** the specimen's inscribed bone ID.

- **FD 1** (`Mandible!N3`): `59.59 − 0.30D − 0.24E − 0.15F − 0.25I − 0.27J − 0.04K`.
- **FD 2** (`Mandible!N4`): `33.20 − 0.32D − 0.29E − 0.36H − 0.03K`.
- **FD 3** (`Mandible!N5`): `18.89 − 0.19F + 0.15G − 0.55J`.
- **FD 4** (`Mandible!N6`): a cached score is present, but **no equation** is stored in the original workbook. Disabled for calculation.
- **FD 5** (`Mandible!N7`): `11.22 − 0.36L`.

Probability p: `1/(1+EXP(−score))` (explicit in `Mandible!O3`, consistent with other provided cached p values). Sign of source sample classifications: score below zero→Male; above zero→Female. These directions remain subject to scientific source verification.

## Regression checks

The implementation was evaluated against cached numerical outputs from the private workbook without copying original specimen data to the repository:

| Check | Source cell | Expected score | Result |
|---|---|---:|---|
| Humerus Spradley | Humerus Spradley!H2 | 0.9828529 | Pass |
| Mandible FD 1 | Mandible!N3 | -3.1307 | Pass |
| Mandible FD 2 | Mandible!N4 | 1.4175 | Pass |
| Mandible FD 3 | Mandible!N5 | -0.4883 | Pass |
| Mandible FD 5 | Mandible!N7 | -0.1416 | Pass |

**Next scientific review:** Obtain the original methodological references, the Humerus Bass combination rules and the Humerus Spradley score threshold/direction; confirm the Humerus cross-sheet measurement mapping; recover Mandible FD 4 equation; then independently validate sex-classification results before research use.
