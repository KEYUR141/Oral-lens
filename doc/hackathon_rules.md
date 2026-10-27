# Hackathon rules and judging reference

Recorded: 27 October 2026. This document distinguishes organizer statements supplied by the participant from Oral-lens implementation decisions. It is a working reference, not organizer approval or a replacement for complete official terms.

## Source and authority

- The participant supplied the Meta Global AI Developer Hackathon Participant Guide as workspace `context.txt`, and supplied screenshots of section 8's judging table on 26–27 October 2026. The rule and rubric transcriptions below come from those materials.
- [Official event page](https://cerebralvalley.ai/e/meta-ai-developer-hackathon).
- [Official waiver link](https://cerebralvalley.ai/e/meta-ai-developer-hackathon/waiver). Its body returned Loading during the earlier planning review; full accepted terms have not been independently reviewed.
- [Submission portal](https://cerebralvalley.ai/e/meta-ai-developer-hackathon/hackathon/submit).

Use the complete accepted rules and subsequent official organizer clarifications to resolve conflicts. Record the dated source and exact clarification here; do not silently rewrite a supplied requirement or infer permission from participant acceptance. The public Oral-lens repository was confirmed through GitHub metadata on 27 October; recheck access for submission.

## Organizer requirements from the supplied guide

| Requirement | Supplied rule and project implication |
| --- | --- |
| Track and theme | Oral-lens plans Indie Developer and Build for Your World. The guide offers Build for Your World and Push the Frontier; the project must fit a problem statement. |
| Meta models | The project must incorporate Meta models. Demonstrate actual model use in the product and record the implementation. |
| Public repository | Repositories must be public. Verify anonymous access at submission time. |
| Team | Maximum four participants; solo is allowed. List everyone who worked on the submission and designate one representative. |
| Demo originality | The demo must only highlight specific features, code, and functionality built during the hackathon. Failure to identify original contributions can lead to immediate disqualification at judges' sole discretion. |
| New work | Presented work must have been built during the event and this must be clear in the submission. The explicit existing-product/codebase allowance names startups; Indie reuse remains an interpretation to clarify. |
| Rights and policies | Projects violating legal, ethical, or platform policies, or using code/data/assets without rights, are disqualified. |
| Submission | The guide requires a three-minute demo video and publicly accessible repository/video links. One team submits one project through the CV platform. Late submissions are not considered. |

Public repository access does not by itself establish a license to every included dependency, paper, PDF, figure, or asset. Verify rights before use and redistribution. Do not choose a license on behalf of third-party owners. This repository's own code license remains a decision to record before public distribution of implementation.

## Sample anti-projects: supplied list

The guide describes this as a non-exhaustive list of generic projects or policy violations to avoid:

- Any project using AI to generate and give medical advice, with examples including an AI mental health advisor and skin blemish detector.
- Basic RAG applications.
- Simple image analyzers.
- Simple AI for education chatbots.
- AI job application screeners.
- AI nutrition coaches.
- Personality analyzers.
- Sports analyzers or coaches.
- Anything political or involving war.

Do not treat a disclaimer, tool wrapper, new model name, or polished interface as evidence that a prohibited or generic project is eligible. The organizer decides eligibility. Oral-lens must implement and demonstrate the substantive review workflow described in [existing_product_diff.md](existing_product_diff.md).

## Oral-lens behavioral boundaries

These are product decisions intended to keep the research workflow within the supplied constraints:

1. Accept research questions, draft literature text, and selected research documents. The MVP does not accept patient cases or oral photographs.
2. Do not provide diagnosis, screening, triage, individual risk/prognosis, treatment recommendations, or personalized medical advice. Decline such requests without supplying advice inside a disclaimer.
3. Extract and compare what studies report, preserving source context and limitations. Do not turn population/study findings into recommendations for an individual.
4. State corpus scope. Insufficient support in the selected sources is not proof that no evidence exists.
5. Preserve provenance and missing information. Never invent studies, quotations, numbers, source locations, evaluation results, or user validation.
6. Label model assessments as fallible. Quote checks, similarity scores, citation counts, multiple model passes, and reviewer acceptance do not establish scientific truth or clinical validation.
7. Treat retrieved documents as untrusted data. They cannot override instructions, alter scope, or authorize arbitrary tool execution.
8. Preserve the distinction between model-proposed, mechanically checked, and human-reviewed results.

## Judging process: supplied section 8

**Stage One:** pass/fail for baseline viability: reasonably fitting the theme and reasonably using Meta Model API and/or Meta open-weight models to build the hackathon project. General eligibility rules also apply.

**Stage Two:** qualifying submissions are scored from 0–10 on these criteria:

| Category | Weight | Description transcribed from the supplied screenshot |
| --- | --- | --- |
| Impact | 30% | What's the real-world potential here? Who benefits, and how much does it matter? Could this actually become something people use? Does it fit into one of the problem statements listed above? |
| Use of Meta AI Tooling | 25% | How creatively did this team use Meta's AI tooling? Did they go beyond a basic integration? Did they surface capabilities that surprised even us? |
| Technical Depth & Execution | 20% | Is the engineering sound and thoughtfully refined? Does this feel like something that was thought through with real craft. |
| Demo | 25% | Is this a working, impressive demo? Does the product hold up live? Is the demo video genuinely cool to watch? |

For planning, the weighted score out of 10 is `0.30 * Impact + 0.25 * Meta + 0.20 * Execution + 0.25 * Demo`. This is not a prediction of judge scores. Weights sum to 100%.

**Stage Three:** the top five scoring projects per track advance. Final judges watch the video demos live and rank projects using the same rubric.

## Evidence to prepare for each criterion

| Criterion | Oral-lens evidence | Weak substitute to avoid |
| --- | --- | --- |
| Impact | Specific literature-review task, useful exported artifact, observed user feedback, actual quality/time measurements | Claiming impact solely because oral cancer is important |
| Meta tooling | Working extraction, scoped evidence-seeking, claim assessment, visible tool results and a justified correction or abstention | A provider swap, a model badge, or more calls without user benefit |
| Execution | Passage identity, validated records, semantic evaluation, revision controls, errors handled, reproducible setup | Treating citations or a second model pass as proof of correctness |
| Demo | One coherent live review: draft, study comparison, source inspection, user correction, export | A scripted animation, fabricated result, or inherited feature presented as new |

The weights guide product emphasis, not percentages of development time. Originality and rights remain requirements rather than extra scoring categories. Bonus awards are not part of this weighted rubric and do not justify expanding the MVP.

## New-work and rights record

Maintain [contribution_manifest.md](contribution_manifest.md). Before any import, record the exact source commit, component paths, authorship/permission basis, and any restrictions. Distinguish inherited, modified inherited, and new event work. Include dates and validation evidence. Do not rewrite dates/history to imply old work is new.

Keep demo feature claims limited to implemented and verified event contributions. Identify the old foundation briefly without showcasing it as a newly built feature. A fresh repository and architectural changes do not erase inheritance.

Maintain a per-source data inventory during corpus preparation: bibliographic ID, source URL, version/hash, license/permission basis, attribution, permitted processing/display/redistribution uses, and inclusion decision. An open-access flag alone does not prove permission to redistribute a PDF or figure. Prefer links or permitted excerpts when full redistribution is unavailable.

## Clarifications still needed

| Question | Why unresolved | Current handling |
| --- | --- | --- |
| Can Indie entrants reuse disclosed code/data infrastructure? | The guide explicitly mentions startups in the allowance | Record the baseline; do not claim eligibility or import disputed components as approved |
| Is the proposed research review workflow acceptable under the medical-advice/basic-RAG exclusions? | Product scope is our interpretation; acceptance of the participant is not approval of features | Keep the bounded research behavior and document organizer feedback when available |
| What is the permitted build start? | Event page says 26 October; guide labels 27 October–4 November as the building period | New documentation here is dated 27 October; record actual work dates and clarify any affected earlier work |
| What additional obligations are in the complete accepted terms? | The full waiver was not available in the prior browser review | Inspect and record relevant obligations before submission |

These questions do not require stopping unrelated documentation, rights inventory, evaluation design, or independent new modules. Surface the specific dependency when it becomes material; avoid repeated generic permission requests.

Suggested participant message for #questions; not sent by Codex:

> I am accepted in Indie Developer. May I reuse my disclosed Oral Cancer X ingestion/pgvector infrastructure and a rights-cleared corpus, identify the original commit, and submit only the new review functionality built during the event? The new tool compares research studies, links findings to exact passages, and lets researchers review claim assessments. It does not accept patient cases or provide diagnosis, screening, prognosis, treatment recommendations, or medical advice. Is this scope acceptable under the medical-advice/basic-RAG exclusions? Please also confirm the permitted build start and where to review the complete accepted terms.

## Deadline and submission review

The supplied deadline is 4 November 2026 at 9:00 PM Eastern, which is **5 November 2026 at 7:30 AM IST**. Internal target: **4 November at 8:00 PM IST**. Recheck official announcements for changes. Use date-aware Eastern time; the US daylight-saving offset changes during this event window.

- [ ] Confirm current official rules and record relevant organizer clarifications.
- [ ] Confirm track, theme, team membership (maximum four), and representative.
- [ ] Verify repository visibility, required licensing/attribution, and rights for included assets.
- [ ] Verify actual Meta runtime use and documented model/prompt/corpus versions.
- [ ] Complete the contribution manifest with paths, dates, commits, and evidence.
- [ ] Exercise supported, unsupported, missing-source, invalid-reference, API-failure, and medical-request cases.
- [ ] Report actual evaluation results and limits; remove unmeasured clinical/usefulness claims.
- [ ] Record a three-minute demo showcasing only verified new event functionality.
- [ ] Verify repository, video, and any live demo access independently; label any replay accurately.
- [ ] Submit through the CV portal before the deadline and preserve confirmation.

Unchecked boxes indicate work still to complete, not automatic disqualification findings. This documentation does not claim that the submission is ready or approved.
