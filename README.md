# Biological Anthropology - Osteometry Automation

A local, browser-based prototype for biological anthropology osteometry automation, currently focused on osteometric sex estimation. Current implementation covers the femur with Bass, Spradley, and Kanz methods, plus an automated femur summary.

## Run locally

Open `index.html` in a desktop browser. No build step, server, npm dependencies, or GitHub token is required.

## Current behavior

- Site and Tomb / Context selection, with context-specific specimen records.
- Shared specimen identity and measurement values between method tabs.
- Kanz model selection and a dynamic measurement requirement matrix.
- Automatically populated Femur summary table.
- Dark-mode UI.
- Local browser storage and JSON backup / restore.

## Research-data and validation notes

**Prototype only.** Before research use, independently validate every formula, cutoff, and transformation against the source spreadsheet and reference methods. Do not treat the prototype as a validated diagnostic or scientific instrument.

Specimen data is held in **browser localStorage**. It is not synced to GitHub or a central database. Use the in-app backup feature before clearing browser data or switching devices.

The repository contains **synthetic demonstration specimens**, not the source research records. The original research workbook and its private link are not included. Do not commit real study data, personal information, credential files, or raw private workbooks into this public repository.

## Deploy

This project currently consists of one static file (`index.html`). It can be hosted by any static hosting service, including GitHub Pages, after reviewing the privacy and validation notes above. Hosting does not provide server-side storage or syncing.