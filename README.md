# Biological Anthropology - Osteometry Automation

A local, browser-based prototype for biological anthropology osteometry automation, currently focused on osteometric sex estimation. The app has independent **Femur**, **Humerus**, and **Mandible** workspaces.

- **Femur:** Bass, Spradley, Kanz and automated summary.
- **Humerus:** shared measurements, Bass reference table, the Spradley discriminant score from the source workbook and an automatic review summary.
- **Mandible:** shared measurements and the FD1–FD5 model selector. Exact workbook functions are implemented for FD1, FD2, FD3 and FD5, including logistic p and sex estimation; FD4 is explicitly flagged as unavailable because the source workbook does not contain its equation.

## Run locally

Open `index.html` in a desktop browser. No build step, server, npm dependencies, or GitHub token is required.

## Current behavior

- Site and Context selection, with context-specific specimen records.
- Skeletal-element sidebar to switch between Femur, Humerus and Mandible.
- Independent specimen records for each skeletal element, with site/context scoping.
- Separate measurement inputs, results and summary views for each skeletal element.
- Shared specimen identity and measurement values between method tabs.
- Kanz model selection and a dynamic measurement requirement matrix.
- Automatically populated Femur summary table.
- Dark-mode UI.
- Local browser storage and JSON backup / restore (including Humerus and Mandible records).

## Research-data and validation notes

**Prototype only.** Exact numerical regression checks have been run against source-sheet examples, but this is **not a scientifically validated analysis tool**. The source Humerus labels are manually entered and include a positive Spradley score labeled Female; the required score interpretation and Bass decision rules must be validated before automating Humerus sex classification. The FD4 Mandible formula is missing from the original workbook and is therefore intentionally not computed. See `SOURCE_MAPPING.md`.

Specimen data is held in **browser localStorage**. It is not synced to GitHub or a central database. Use the in-app backup feature before clearing browser data or switching devices.

The repository contains **synthetic demonstration specimens**, not the source research records. The original research workbook and its private link are not included. Do not commit real study data, personal information, credential files, or raw private workbooks into this public repository.

## Deploy

This project currently consists of one static file (`index.html`). It can be hosted by any static hosting service, including GitHub Pages, after reviewing the privacy and validation notes above. Hosting does not provide server-side storage or syncing.