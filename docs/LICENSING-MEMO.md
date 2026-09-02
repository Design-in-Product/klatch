# Licensing memo: the CC BY 4.0 problem

*Written 2026-08-28, during a venture-diligence research pass. Not a decision —
a statement of the problem, the options, and what each costs.*

---

## The short version

Klatch is licensed **CC BY 4.0**. That is a Creative Commons *content* licence
being used for software. It creates four distinct problems, one of which is
irreversible for code already published, and it should be replaced before any
fundraising, contribution drive, or commercialisation attempt.

## The four problems

**1. Creative Commons explicitly recommends against this.** From the CC FAQ,
verbatim: *"we recommend against using Creative Commons licenses for software.
Instead, we strongly encourage you to use one of the very good software licenses
which are already available."* The three reasons they give are exactly the three
that bite here — CC licences *"do not contain specific terms about the
distribution of source code"*; they omit patent language, which is *"important
to software"*; and they are *"currently not compatible with the major software
licenses, so it would be difficult to integrate CC-licensed work with other free
software."*
→ https://creativecommons.org/faq/

**2. No patent grant.** CC BY 4.0's legal code states plainly: *"Patent and
trademark rights are not licensed under this Public License."* Standard OSS
licences either grant patent rights (Apache-2.0) or address them explicitly.
Fedora banned CC0 for code in 2022 over precisely this defect. Any acquirer's
counsel, and any enterprise procurement review, will flag it.
→ https://creativecommons.org/licenses/by/4.0/legalcode.en

**3. It is not an open-source licence, by the definition people use.** No
Creative Commons licence appears on the OSI-approved list. Describing Klatch as
"open source (CC BY 4.0)" is therefore inaccurate on the strict definition —
while still granting away every commercial right. That is the worst of both
positions: it fails procurement checklists that require OSI approval, *and* it
gives competitors everything. GitHub's own API reportedly classifies the repo's
licence as `NOASSERTION`, meaning the platform does not recognise it either —
worth confirming on the repo page.
→ https://opensource.org/licenses

**4. Already-published code cannot be clawed back.** The deed grants the right to
*"copy and redistribute the material in any medium or format for any purpose,
even commercially"* and to *"remix, transform, and build upon the material for
any purpose, even commercially"* — and states that *"The licensor cannot revoke
these freedoms as long as you follow the license terms."* Every version released
to date stays free and commercially reusable forever. Relicensing changes the
future, never the past.
→ https://creativecommons.org/licenses/by/4.0/

## Options, with what each costs

**A. Apache-2.0.** Permissive, OSI-approved, explicit patent grant. Fixes
problems 1–3 and nothing else. Choose this if the goal is legitimacy and
contribution, and monetisation will never depend on the licence. Cheapest,
lowest-friction option. No moat.

**B. AGPL-3.0.** OSI-approved, copyleft, requires network-served derivatives to
publish source. This is what Plausible switched to from MIT in October 2020,
citing *"risks associated with a permissive open source license"* and
corporations *"happy to take advantage"* — and they subsequently reached $1M ARR
with roughly four people. Choose this if a hosted or managed offering is on the
table, since it makes commercial forks unattractive without a commercial licence
from you.

**C. BUSL or FSL (source-available with a change date).** Sentry moved BSD-3 →
BUSL in 2019 and then authored the Functional Source License in November 2023,
after *"funded businesses plagiarizing or copying our work to directly compete."*
Code becomes Apache/MIT after two years. Strongest commercial protection; not
open source, and some contributors will decline on principle.

**D. Do nothing.** Costs nothing today, and forecloses B and C on every
subsequent release the longer it runs.

## What relicensing actually requires

- **A CLA or DCO** before accepting outside contributions, or the right to
  relicense later is gone. There are currently no outside contributors, which
  makes this the cheapest it will ever be — the entire copyright sits with one
  author and two agents working under his direction. **This window closes the
  moment the first external pull request lands.**
- Replacing `LICENSE.md`, the README badge, the site footer, and the per-post
  footers on the blog.
- Accepting that prior releases remain CC BY 4.0. Nothing to be done about that.
- Some community friction if the project ever has a community. Scott Chacon
  (GitButler) on relicensing: *"if a company releases under an OSS license and
  then needs to relicense under something more restrictive in order to make
  their business work, there is an understandable outcry from the community."*
  At zero external contributors, there is nobody to be aggrieved.

## Recommendation

Relicense now, before the first outside contributor arrives, and add a DCO in the
same commit.

**Apache-2.0** if Klatch stays a credibility and portfolio asset — it is honest,
recognised, and removes the diligence flag with no strategic cost.

**AGPL-3.0** if a hosted or team tier is genuinely on the table, since it is the
only option here that preserves that path without being source-available.

The decision that should *not* be made is deferral. Every release under CC BY 4.0
permanently enlarges the body of code that competitors may take commercially, and
the CLA window is open only until someone else contributes.

---

*Sources: [CC FAQ](https://creativecommons.org/faq/) ·
[CC BY 4.0 legal code](https://creativecommons.org/licenses/by/4.0/legalcode.en) ·
[CC BY 4.0 deed](https://creativecommons.org/licenses/by/4.0/) ·
[OSI licence list](https://opensource.org/licenses) ·
[Plausible on relicensing](https://plausible.io/blog/open-source-saas) ·
[Sentry FSL](https://blog.sentry.io/introducing-the-functional-source-license-freedom-without-free-riding) ·
[TechCrunch on fair source](https://techcrunch.com/2024/09/22/some-startups-are-going-fair-source-to-avoid-the-pitfalls-of-open-source-licensing/)*
