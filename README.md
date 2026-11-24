# Kisumu Mental Health Linkage

Powered by **Ivula Technologies**.

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
| Priority risk escalation | An acute ASQ or any psychiatric emergency opens an emergency phone escalation; a non-acute ASQ opens a same-day safety check (**Escalations**). Neither enters the referral queue |

## How decisions are made

- **Rules, not the model, decide.** Risk tier, service and destination come from fixed, testable rules in `src/services/referralProtocol.ts`.
- **The rules follow Kenya's National Clinical Guidelines for Management of Common Mental Disorders (2024)** wherever the guidelines specify one:
  - Suicide risk uses the **ASQ** (Annex 6). Yes to question 5 is acute: an emergency phone escalation. Yes to any of questions 1–4, or refusing to answer, is non-acute: a same-day safety check by a clinician. A positive PHQ-9 item 9 prompts the ASQ.
  - Substance use uses **CAGE-AID** (Annex 4). One yes is a positive screen.
  - **GAD-7** bands follow Annex 5. Mild depression and anxiety go to counselling first, as the guidelines recommend psychotherapy for mild cases.
  - Psychiatric emergencies follow section 3.9. Children showing neglect or abuse are linked to the Children's Office (3.7). Perinatal women are prompted for EPDS timing and infanticide risk assessment (3.10).
  - **Referral and linkage** follows section 4: the referrer phones the receiving provider, then calls again after the appointment to confirm the person arrived.
  - After a suicide crisis, the person is followed up daily at first, then weekly, for at least two months (3.9).
- **Placeholders remain where the guidelines are silent:** PHQ-9 cut-offs (the guidelines use PHQ-9 but do not print them), urgency tiers, timeframes (urgent within 3 days, routine within 14), the 30-minute emergency response target and on-call numbers. These need County Mental Health Technical Team sign-off. The Data & Governance page lists every rule with its source.
- **The AI only drafts.** The language model drafts referral notes and a weekly linkage brief from pseudonymised or aggregated fields. Every output is labelled for review. It never handles emergencies.

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

## AI key

The browser never holds an API key. All AI requests go to the server function `api/chat.ts`, which accepts requests only from this site, limits request size and rate, and allows only the approved models.

The server uses the `GROQ_API_KEY` environment variable if it is set, and otherwise the project's original key, which is kept in `api/chat.ts`.

- **On Vercel:** to use a different key, add `GROQ_API_KEY` under Project settings → Environment Variables, then redeploy.
- **On your own computer:** run `npm run dev`. To use a different key, create `.env.local` containing `GROQ_API_KEY=your-key`. Git ignores this file.

**Security note:** the original key is in this public repository, so anyone can read and use it. Replace it with a key set in the server environment, and revoke the original, before the app handles real data.

## Before any real use

- Complete a Data Protection Impact Assessment.
- Replace the demo role switch with sign-in and enforced role-based access.
- Validate thresholds, timeframes and the referral directory with the county.
- Confirm on-call and crisis numbers. The app shows placeholders.
- Replace and revoke the original Groq key, which is published in this repository.
