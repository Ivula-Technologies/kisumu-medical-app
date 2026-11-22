# Kisumu Mental Health Linkage

A prototype for the **AI-Enabled Mental Health Intelligence, Early Identification, Diagnosis Support, Referral and Linkage to Care** concept of the Adventist Community Development Organization (ACDO), West Kenya, with the Kisumu County Department of Health.

This build focuses on **specific objective (c), strengthening referral and linkage to care**, delivered through **component 3: intelligent referral, emergency escalation and linkage to care**. It targets the informal settlements of Obunga, Nyalenda A and B, Manyatta A and B, Manyatta Arabs, Kaloleni, Kondele and Bandani.

All data is synthetic. Every person is fictional and identified only by a pseudonymous ID. Facility names, services, capacity and travel times are illustrative.

## What component 3 asks for, and where it is

| Component 3 function | In the app |
|---|---|
| Structured electronic referral records | **New referral** creates the record from the screening: scores, urgency, consent and a pseudonymous ID |
| Identify the right facility and provider | Destinations ranked by service, open slots, travel time from the settlement and waiting time (**Directory**) |
| Notify receiving facilities and health workers | Role-aware notifications in the top bar |
| Appointment scheduling and reminders | Book, move and rebook appointments; reminders due in **Follow-up** |
| Acceptance and completion tracking | Each referral moves through Referred, Accepted, Scheduled, Attended and Feedback sent, against its timeframe (**Referrals**) |
| Feedback to referring facilities and CHPs | The receiving clinician sends the outcome back and closes the loop |
| Alerts for missed appointments | Missed visits go to a CHP tracing worklist |
| Priority risk escalation | A positive PHQ-9 item 9 or any red flag opens the **Escalations** path: phone the on-call clinician. These cases never enter the referral queue |

## How decisions are made

- **Rules, not the model, decide.** Risk tier, service and destination come from fixed, testable rules in `src/services/referralProtocol.ts`.
- **Screening thresholds** follow common published cut-offs (PHQ-9, GAD-7, AUDIT-C with sex-specific thresholds). They are placeholders until the County Mental Health Technical Team validates them against the 2024 National Clinical Guidelines.
- **Timeframes** are urgent within 3 days and routine within 14 days, also placeholders for the county to confirm. Emergency escalations target a clinician response within 30 minutes.
- **The AI only drafts.** The language model (gpt-oss-120b on Groq Cloud) drafts referral notes for the receiving clinician and a weekly linkage brief for the county coordinator, from pseudonymised or aggregated fields. Every output is labelled for review. It never handles emergencies.

## Roles

A role switch in the top bar stands in for sign-in, so the demo can show each side of a referral:

- **County coordinator:** the whole pathway, pseudonymised; redirects declined referrals and follows up stalled ones.
- **Lumumba clinician:** referrals to Lumumba Sub-County Hospital; accepts, books, records attendance and sends feedback.
- **CHP, Obunga:** their own referrals; screens, refers, raises emergencies and traces missed visits.

## Pages

Overview, Escalations, New referral, Referrals, Follow-up, Directory, Pilot M&E (concept note indicators, most calculated live) and Data & Governance.

## Run locally

```bash
npm install
npm run dev
```

Open the address Vite prints. Add `?view=landing` for the public page. Changes are saved in your browser; use **Reset demo data** in the sidebar to start again.

## Before any real use

- Complete a Data Protection Impact Assessment.
- Replace the demo role switch with sign-in and enforced role-based access.
- Validate thresholds, timeframes and the referral directory with the county.
- Confirm on-call and crisis numbers. The app shows placeholders.
- Move the Groq API key out of the source code and into a server-side environment variable.
