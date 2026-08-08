# Toldot human worklist

Tasks marked **required** cannot be reliably accepted by Qwen alone. Tasks marked **placeholder allowed** may wait until the simulation and UI loop are proven.

## G0 — Agent workflow smoke

- **T001-Q01 — Create repository agent rules** — `STRONG MODEL + HUMAN APPROVAL`
  - Packet: `task_packets/G0/strong_model/T001-Q01.yaml`
  - Why: Create the single authoritative instruction file used by all coding agents.
- **T002-Q01 — Write architecture boundary document** — `STRONG MODEL + HUMAN APPROVAL`
  - Packet: `task_packets/G0/strong_model/T002-Q01.yaml`
  - Why: Define the minimum application architecture so future agents do not invent incompatible patterns.
- **T003-Q01 — Write simulation rules document** — `STRONG MODEL + HUMAN APPROVAL`
  - Packet: `task_packets/G0/strong_model/T003-Q01.yaml`
  - Why: Specify tick order, constrained resources, ID conventions, and deterministic behavior before implementation.
- **T004-Q01 — Write historical representation guide** — `STRONG MODEL + HUMAN APPROVAL`
  - Packet: `task_packets/G0/strong_model/T004-Q01.yaml`
  - Why: Create enforceable language and representation rules for scenario content.
- **T005-Q01 — Write content format contract** — `STRONG MODEL + HUMAN APPROVAL`
  - Packet: `task_packets/G0/strong_model/T005-Q01.yaml`
  - Why: Define JSON file shapes and the registered condition/effect approach.
- **T006-Q01 — Write test strategy** — `STRONG MODEL + HUMAN APPROVAL`
  - Packet: `task_packets/G0/strong_model/T006-Q01.yaml`
  - Why: Define the headless testing layers and exact pass/fail expectations.

## G2 — Playable settlement loop

- **T050-Q01 — Research southern/central prototype locations** — `STRONG MODEL + HUMAN APPROVAL`
  - Packet: `task_packets/G2/strong_model/T050-Q01.yaml`
  - Why: Create concise research notes for the twelve map locations as they relate to the 1904 scenario.
- **T050-Q02 — Research northern prototype locations** — `STRONG MODEL + HUMAN APPROVAL`
  - Packet: `task_packets/G2/strong_model/T050-Q02.yaml`
  - Why: Create concise research notes for the twelve map locations as they relate to the 1904 scenario.
- **T053-Q01 — Research two Eastern European cohort abstractions** — `STRONG MODEL + HUMAN APPROVAL`
  - Packet: `task_packets/G2/strong_model/T053-Q01.yaml`
  - Why: Research four broad arrival cohort archetypes without reducing people to stereotypes.
- **T053-Q02 — Research Yemenite and urban artisan/professional abstractions** — `STRONG MODEL + HUMAN APPROVAL`
  - Packet: `task_packets/G2/strong_model/T053-Q02.yaml`
  - Why: Research four broad arrival cohort archetypes without reducing people to stereotypes.
- **T062-Q01 — Create original prototype base map** — `HUMAN REQUIRED`
  - Packet: `task_packets/G2/human/T062-Q01.yaml`
  - Why: Display a static prototype map background inside a pan-and-zoom container.
- **H001 — Approve first-iteration visual direction** — `HUMAN REQUIRED`
  - Packet: `task_packets/G2/human/H001.yaml`
  - Why: Lock a small, consistent visual direction before map and icon production.
- **H002 — Select licensed bilingual fonts** — `HUMAN REQUIRED; placeholder allowed`
  - Packet: `task_packets/G2/human/H002.yaml`
  - Why: Select fonts that render Hebrew and English clearly and can legally ship with the game.
- **H007 — Perform G2 visual usability review** — `HUMAN REQUIRED`
  - Packet: `task_packets/G2/human/H007.yaml`
  - Why: Review the playable settlement screen at target resolution before historical events are added.

## G3 — Historical vertical slice

- **T083-Q01 — Research six arrival and language events** — `STRONG MODEL + HUMAN APPROVAL`
  - Packet: `task_packets/G3/strong_model/T083-Q01.yaml`
  - Why: Prepare historically grounded event briefs spanning the prototype's core systems.
- **T083-Q02 — Research six labor, donor, and Ottoman events** — `STRONG MODEL + HUMAN APPROVAL`
  - Packet: `task_packets/G3/strong_model/T083-Q02.yaml`
  - Why: Prepare historically grounded event briefs spanning the prototype's core systems.
- **T083-Q03 — Research final six health, local-relations, and Ahuzat Bayit events** — `STRONG MODEL + HUMAN APPROVAL`
  - Packet: `task_packets/G3/strong_model/T083-Q03.yaml`
  - Why: Prepare historically grounded event briefs spanning the prototype's core systems.
- **H008 — Perform Hebrew and mixed-direction layout review** — `HUMAN REQUIRED`
  - Packet: `task_packets/G3/human/H008.yaml`
  - Why: Verify Hebrew, English, numbers, dates, and mixed-direction content remain readable and correctly ordered.
- **H009 — Approve historical content for the vertical slice** — `HUMAN REQUIRED`
  - Packet: `task_packets/G3/human/H009.yaml`
  - Why: Perform final human judgment on event wording, actor representation, uncertainty, and source linkage.

## G4 — Release-quality prototype

- **T099-Q01 — Create three scripted balance policies and measurement report** — `HUMAN REQUIRED`
  - Packet: `task_packets/G4/human/T099-Q01.yaml`
  - Why: Adjust only numeric prototype values so three documented play styles remain viable.
- **T099-Q02 — Tune numeric content only** — `HUMAN REQUIRED`
  - Packet: `task_packets/G4/human/T099-Q02.yaml`
  - Why: Adjust only numeric prototype values so three documented play styles remain viable.
- **T100-Q01 — Run final vertical-slice acceptance** — `HUMAN REQUIRED`
  - Packet: `task_packets/G4/human/T100-Q01.yaml`
  - Why: Verify the complete first iteration against the project definition of done.
- **H010 — Complete three human playtest runs** — `HUMAN REQUIRED`
  - Packet: `task_packets/G4/human/H010.yaml`
  - Why: Verify the prototype is understandable, stable, and emotionally coherent without developer guidance.

## Asset production summary

- **T062-Q01 — Create original prototype base map** — required; packet `task_packets/G2/human/T062-Q01.yaml`
- **H001 — Approve first-iteration visual direction** — required; packet `task_packets/G2/human/H001.yaml`
- **H002 — Select licensed bilingual fonts** — required; packet `task_packets/G2/human/H002.yaml`
- **H003 — Create five location-type icons** — polish; placeholder allowed; packet `task_packets/G2/human/H003.yaml`
- **H004 — Create four global resource icons** — polish; placeholder allowed; packet `task_packets/G2/human/H004.yaml`
- **H005 — Create ten building and project icons** — polish; placeholder allowed; packet `task_packets/G2/human/H005.yaml`
- **H006 — Create event document-frame assets** — polish; placeholder allowed; packet `task_packets/G3/human/H006.yaml`
- **H007 — Perform G2 visual usability review** — required; packet `task_packets/G2/human/H007.yaml`
- **H008 — Perform Hebrew and mixed-direction layout review** — required; packet `task_packets/G3/human/H008.yaml`
