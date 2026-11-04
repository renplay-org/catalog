# Fixed tag vocabulary migration report

## Sources and choices

- F95Checker commit: `46a5e42154c8291e40fbcd88b389af70010788a8`.
- Exact tag source: https://github.com/WillyJL/F95Checker/blob/46a5e42154c8291e40fbcd88b389af70010788a8/common/structs.py#L399-L554
- Prefix logic: https://github.com/WillyJL/F95Checker/blob/46a5e42154c8291e40fbcd88b389af70010788a8/common/parser.py#L324-L331
- All 154 mapping entries retained, including technical/asset tags and the upstream unknown entry.
  Numeric ids follow this pinned mapping (school-setting is 108, not the illustrative 547).
- Groups follow the requested four chip categories; all other ids fall back to content.
  Adventure and text-based are play; paranormal and superpowers are story. Mobile-game and
  POV are content, since neither belongs to the specified chip categories.
- All five linked F95 threads fetched successfully without login, using a browser user agent
  and at least three seconds between requests: College Daze (41722), Eternum (93340),
  Once in a Lifetime (37470), Pale Carnations (50281), Ripples (56110).
  Thread metadata is current thread-level metadata, not a claim about each archived release.
- The other five recipes have no F95 link. Existing tags were mapped by hand; no new links
  or content tags were invented. Their summaries are omitted, content is empty, and ongoing
  is an unverified default. No fetches failed.
- Comedy maps to humor; free roam to sandbox; fan game to parody; two protagonists to multiple
  protagonist. Drama, mystery and minigames have no entry in the pinned source and were omitted.
  No synthetic F95 ids were introduced.
- Summaries retain developer wording. College Daze uses its first sentence; Eternum its two
  overview sentences; Once in a Lifetime its first two sentences; Ripples its full two-sentence
  overview. Pale Carnations' overview has no complete safe-for-work premise sentence, so its
  first sentence is cut after “pre-med student” and closed with a period; explicit clauses and
  the remaining adult-focused sentences are omitted rather than publishing them.
- dist/ is ignored by Git, as on main; builds produce it locally and in CI, not in the commit.

## Group assignment for every used id

- **play**: `adventure`, `dating-sim`, `management`, `multiple-endings`, `rpg`, `sandbox`, `text-based`.
- **story**: `horror`, `humor`, `paranormal`, `parody`, `romance`, `school-setting`, `sci-fi`, `superpowers`.
- **art**: `3dcg`, `animated`, `real-porn`.
- **protagonist**: `male-protagonist`, `multiple-protagonist`.
- **content**: `ahegao`, `anal-sex`, `bdsm`, `big-ass`, `big-tits`, `blackmail`, `bukkake`, `cheating`, `corruption`, `cosplay`, `creampie`, `drugs`, `exhibitionism`, `femaledomination`, `footjob`, `graphic-violence`, `groping`, `group-sex`, `handjob`, `harem`, `humiliation`, `incest`, `interracial`, `lactation`, `lesbian`, `maledomination`, `masturbation`, `milf`, `mind-control`, `mobile-game`, `monster`, `monster-girl`, `multiple-penetration`, `oral-sex`, `possession`, `pov`, `pregnancy`, `prostitution`, `rape`, `sex-toys`, `sexual-harassment`, `slave`, `sleep-sex`, `spanking`, `stripping`, `teasing`, `titfuck`, `transformation`, `twins`, `urination`, `vaginal-sex`, `virgin`, `voyeurism`.

## Every recipe

### College Daze (`college-daze`)

- Tags: `male-protagonist`, `paranormal`, `real-porn`, `romance`, `school-setting`, `superpowers`, `text-based`.
- Content: `anal-sex`, `big-ass`, `big-tits`, `blackmail`, `cheating`, `corruption`, `creampie`, `drugs`, `exhibitionism`, `femaledomination`, `footjob`, `groping`, `group-sex`, `handjob`, `harem`, `humiliation`, `incest`, `interracial`, `lactation`, `lesbian`, `maledomination`, `masturbation`, `milf`, `mind-control`, `monster-girl`, `multiple-penetration`, `oral-sex`, `possession`, `pregnancy`, `prostitution`, `rape`, `slave`, `sleep-sex`, `spanking`, `stripping`, `titfuck`, `transformation`, `vaginal-sex`, `virgin`, `voyeurism`.
- State: `ongoing`.
- Summary: Being a freshman in college is rough, but things are about to get a lot easier once you discover wandering lights with the strange ability to alter reality.

### Eternum (`eternum`)

- Tags: `3dcg`, `adventure`, `animated`, `horror`, `humor`, `male-protagonist`, `romance`, `school-setting`, `sci-fi`.
- Content: `ahegao`, `anal-sex`, `big-ass`, `big-tits`, `blackmail`, `cosplay`, `creampie`, `drugs`, `footjob`, `groping`, `group-sex`, `handjob`, `harem`, `maledomination`, `masturbation`, `milf`, `mobile-game`, `monster`, `oral-sex`, `pov`, `prostitution`, `sex-toys`, `sexual-harassment`, `spanking`, `teasing`, `titfuck`, `vaginal-sex`, `virgin`, `voyeurism`.
- State: `ongoing`.
- Summary: You’re moving with your best friend to the city of Kredon, home to some of the best schools and universities in the country, to continue your studies. However, in Kredon, there’s only one thing everyone talks about: ETERNUM—the virtual, hyper-reality MMORPG game released a few years ago that revolutionized the world of technology.

### Harem Hotel (`harem-hotel`)

- Tags: `dating-sim`, `management`, `romance`.
- Content: (empty; no thread linked).
- State: `ongoing` (unverified default; no thread linked).
- Summary: (omitted; no thread linked)

### Hero's Harem Guild (`heros-harem-guild`)

- Tags: `rpg`, `sandbox`, `management`.
- Content: (empty; no thread linked).
- State: `ongoing` (unverified default; no thread linked).
- Summary: (omitted; no thread linked)

### Living With Chainsaw (`living-with-chainsaw`)

- Tags: `romance`, `parody`.
- Content: (empty; no thread linked).
- State: `ongoing` (unverified default; no thread linked).
- Summary: (omitted; no thread linked)

### Moonripple Lake (`moonripple-lake`)

- Tags: `romance`, `humor`, `sandbox`.
- Content: (empty; no thread linked).
- State: `ongoing` (unverified default; no thread linked).
- Summary: (omitted; no thread linked)

### Once in a Lifetime (`once-in-a-lifetime`)

- Tags: `3dcg`, `animated`, `horror`, `humor`, `male-protagonist`, `multiple-endings`, `romance`, `school-setting`.
- Content: `ahegao`, `anal-sex`, `big-ass`, `big-tits`, `cheating`, `cosplay`, `creampie`, `drugs`, `exhibitionism`, `footjob`, `groping`, `group-sex`, `handjob`, `harem`, `incest`, `lesbian`, `masturbation`, `milf`, `mobile-game`, `oral-sex`, `pov`, `pregnancy`, `rape`, `sex-toys`, `spanking`, `teasing`, `vaginal-sex`, `virgin`, `voyeurism`.
- State: `completed`.
- Summary: You live in Mistbury, an apparently normal town where you live an apparently normal life with your family. However, you'll soon discover that this place hides some deep dark secrets and things can heat up very fast...

### Our Red String (`our-red-string`)

- Tags: `romance`, `multiple-protagonist`.
- Content: (empty; no thread linked).
- State: `ongoing` (unverified default; no thread linked).
- Summary: (omitted; no thread linked)

### Pale Carnations (`pale-carnations`)

- Tags: `3dcg`, `animated`, `humor`, `male-protagonist`, `romance`.
- Content: `ahegao`, `anal-sex`, `bdsm`, `big-ass`, `big-tits`, `bukkake`, `cheating`, `creampie`, `drugs`, `exhibitionism`, `femaledomination`, `groping`, `group-sex`, `handjob`, `humiliation`, `lactation`, `lesbian`, `maledomination`, `masturbation`, `milf`, `mobile-game`, `multiple-penetration`, `oral-sex`, `prostitution`, `sex-toys`, `spanking`, `teasing`, `titfuck`, `urination`, `vaginal-sex`, `voyeurism`.
- State: `ongoing`.
- Summary: In Pale Carnations, step into the shoes of a tightly wound pre-med student.

### Ripples (`ripples`)

- Tags: `3dcg`, `adventure`, `animated`, `humor`, `male-protagonist`, `romance`, `school-setting`, `sci-fi`.
- Content: `ahegao`, `anal-sex`, `big-ass`, `big-tits`, `cosplay`, `creampie`, `exhibitionism`, `femaledomination`, `graphic-violence`, `groping`, `group-sex`, `handjob`, `harem`, `incest`, `lesbian`, `maledomination`, `masturbation`, `milf`, `mobile-game`, `oral-sex`, `spanking`, `stripping`, `teasing`, `titfuck`, `twins`, `vaginal-sex`, `virgin`.
- State: `ongoing`.
- Summary: Ripples is a sci-fi visual novel that centers around an 18-year-old in his last year of high school. He reunites with his good friend Darci and sets off to school like any other day, but as the day goes on, he learns new information about his deceased father that has him questioning the truth about his death.

## Schema 2 comparison with main

Baseline: built main at `64bbe3a20f2212a8cc17f1f0dd2c2d4d4e022196` before editing, saving
its index to `/tmp/catalog-main-index.json`. Compared it to the final build. Parsed comparison
asserted identical game counts, ordering, keys and all values except recipe tag labels and
the top-level generated timestamp. Covers, checksums, archives, releases, patches and field
ordering are unchanged. College Daze is HTML and remains absent from schema 2. Harem Hotel
and Hero's Harem Guild are byte-for-byte unchanged within the games array.

Every changed line is accounted for below (the raw diff follows):

- generated: build timestamp only; no metadata meaning.
- Eternum: add 3dcg, adventure, animated, horror, humor and male protagonist; remove mystery
  and comedy; add school setting. Romance and sci-fi stay; order follows the thread's tag list.
- Living With Chainsaw: remove fan game and minigames; add parody (fan-game alias); no
  minigames entry exists. Romance stays.
- Moonripple Lake: replace comedy with humor and free roam with sandbox. Romance stays.
- Once in a Lifetime: add 3dcg, animated, horror, humor, male protagonist and multiple endings;
  remove mystery and comedy; add school setting. Romance stays. Thread order is preserved.
- Our Red String: remove drama and two protagonists; add multiple protagonist (alias).
  Romance stays.
- Pale Carnations: remove mystery and drama; add 3dcg, animated, humor, male protagonist and
  romance, exactly the non-content tags in its thread.
- Ripples: remove the old sci-fi, mystery and romance lines and replace with the thread-ordered
  3dcg, adventure, animated, humor, male protagonist, romance, school setting and sci-fi.
  Romance and sci-fi are retained but moved; mystery is removed.

No new fields leak into schema 2. All added and removed lines in this diff are listed above.

```diff
--- /tmp/catalog-main-index.json	2026-11-04 10:53:51
+++ dist/index.json	2026-11-04 11:00:05
@@ -1,15 +1,20 @@
 {
  "schema": 2,
- "generated": "2026-11-04T09:53:51.084Z",
+ "generated": "2026-11-04T10:00:05.210Z",
  "games": [
   {
    "id": "eternum",
    "title": "Eternum",
    "developer": "Caribdis",
    "tags": [
+    "3dcg",
+    "adventure",
+    "animated",
+    "horror",
+    "humor",
+    "male protagonist",
     "romance",
-    "mystery",
-    "comedy",
+    "school setting",
     "sci-fi"
    ],
    "nsfw": true,
@@ -173,8 +178,7 @@
    "developer": "Dr.Ergenecon",
    "tags": [
     "romance",
-    "fan game",
-    "minigames"
+    "parody"
    ],
    "nsfw": true,
    "cover": {
@@ -224,8 +228,8 @@
    "developer": "Banana Cream Games",
    "tags": [
     "romance",
-    "comedy",
-    "free roam"
+    "humor",
+    "sandbox"
    ],
    "nsfw": true,
    "cover": {
@@ -275,9 +279,14 @@
    "title": "Once in a Lifetime",
    "developer": "Caribdis",
    "tags": [
+    "3dcg",
+    "animated",
+    "horror",
+    "humor",
+    "male protagonist",
+    "multiple endings",
     "romance",
-    "mystery",
-    "comedy"
+    "school setting"
    ],
    "nsfw": true,
    "cover": {
@@ -329,8 +338,7 @@
    "developer": "Eva Kiss",
    "tags": [
     "romance",
-    "drama",
-    "two protagonists"
+    "multiple protagonist"
    ],
    "nsfw": true,
    "cover": {
@@ -380,8 +388,11 @@
    "title": "Pale Carnations",
    "developer": "Team Mutt and Jeff",
    "tags": [
-    "mystery",
-    "drama"
+    "3dcg",
+    "animated",
+    "humor",
+    "male protagonist",
+    "romance"
    ],
    "nsfw": true,
    "cover": {
@@ -430,9 +441,14 @@
    "title": "Ripples",
    "developer": "Jestur",
    "tags": [
-    "sci-fi",
-    "mystery",
-    "romance"
+    "3dcg",
+    "adventure",
+    "animated",
+    "humor",
+    "male protagonist",
+    "romance",
+    "school setting",
+    "sci-fi"
    ],
    "nsfw": true,
    "cover": {
```

## Validation

- Main baseline build passed; final `npm run build` passed (10 recipes).
- `node --test scripts/tags.test.mjs`: four tests passed, checking enum synchronization,
  unknown/wrong-group ids, limits/duplicates/summary/state, and both built index formats.
- A temporary copy of Moonripple Lake was renamed to bad-tag-check and its tags replaced with
  `[not-a-real-tag]`. `npm run build` exited 1 with:

```text
bad-tag-check.yaml: data/tags/0 must be equal to one of the allowed values
```

- The temporary recipe was removed, then the final build and tests passed again.
- `git diff --check` passed.
