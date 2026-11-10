# Kisumu Health Intelligence

Kisumu Health Intelligence is an AI-enabled decision-support prototype for the County Department of Health, Kisumu County, Kenya. It turns routine facility and community health data into early alerts and supply forecasts, while building on existing systems such as eCHIS, KenyaEMR and KHIS rather than replacing them.

## Purpose

The solution supports county-level public health leadership with three AI-enabled use cases:

1. Disease signal detection: flag unusual weekly case counts for verification by public health teams.
2. Commodity forecasting: forecast demand and stockout risk for essential medicines.
3. Service coverage gaps: show which community units fall short of coverage targets so outreach can be directed.

## Target users and role model

- County Health Manager: full access across all data
- Sub-County Officer: access to their sub-county only
- Facility In-charge: access to their facility only
- Admin: user and system configuration management

Roles are stored in a separate `user_roles` table with row-level security, not on the profile table.

## Scope

### 1. Overview page
- KPI cards for facilities reporting this week, data completeness, timeliness, open alerts and stockout risk
- 7-sub-county map of Kisumu County with alert shading
- latest alerts list
- last synced timestamp
- CSV export on every table or dashboard view
- skeleton loading states

### 2. Disease Signals
- Weekly trend chart by sub-county for malaria, diarrhoeal disease, acute respiratory infection, suspected measles and suspected cholera
- Expected range band using rolling baseline logic
- Alert flagging where counts exceed baseline thresholds
- Plain-language explanation of why a signal was flagged
- Workflow states: Unverified, Under investigation, Confirmed or Dismissed
- Officer assignment, notes and audit trail

### 3. Commodity Forecast
- Products: artemether-lumefantrine (AL), amoxicillin DT, ORS, zinc and malaria RDTs
- Show stock on hand, monthly consumption, 3-month forecast, confidence band, months of stock left and risk status
- Redistribution suggestions only, with human approval required

### 4. Service Coverage
- Coverage against target by sub-county for household visits, antenatal care (4+ visits), skilled birth attendance and full immunisation
- Households, community units and CHPs per sub-county
- Priority gaps at community-unit cluster level, with a plain-language reason and a suggested action
- Review states: Unreviewed, Outreach planned or Resolved, with sub-county team approval required

### 5. Data Quality
- Completeness, timeliness and validation issues by facility and source system
- Facilities that failed to report

### 6. Pilot M&E
- Timeliness, completeness, alert verification time, forecast error (MAPE), weekly active users
- Indicators compared with baseline

### 7. Data & Governance
- Connected sources with last-sync times
- Role permissions and access log
- Data minimisation notes
- AI output provenance and human confirmation requirement

## Synthetic demo data

This prototype uses clearly labelled synthetic demo data, with aggregated data only and no patient-level identifiers.

The demo includes:
- 261 facilities, including 138 government-owned facilities
- 280 community units
- 2,998 CHPs
- 7 sub-counties: Kisumu Central, Kisumu East, Kisumu West, Seme, Nyakach, Nyando and Muhoroni
- 2 years of weekly data with seasonality
- Planted events including diarrhoeal disease spikes and stockout risk clusters to ensure alerts appear in the demo

## AI and analytics methods

The prototype uses transparent, explainable methods:
- Rolling baseline with z-score for disease signals
- Seasonal naive or Holt-Winters for demand forecasting
- Plain-language summaries generated from the numbers shown only, without inventing facts

## Design approach

- Calm, government-grade visual design using deep teal and navy tones
- Clear typography and generous whitespace
- WCAG AA contrast orientation
- Responsive interface for low-bandwidth conditions
- English-first interface, structured to support later Swahili localisation

## Privacy and safety

The design is shaped by Kenya’s Data Protection Act (2019) and Digital Health Act (2023), without claiming full compliance. The prototype makes clear that:
- data is aggregated
- AI output is labelled and logged
- human confirmation is required before any action
- there is no patient-level identifier use in the demo

## Current status

This repository currently contains the first build stage requested by the client:
- app shell and navigation
- synthetic data layer
- Overview page only
- working CSV export button for the overview dashboard

The remaining pages are intentionally deferred until review of this first page.

## Run locally

```bash
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal.
