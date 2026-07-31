# LICENSE — AIPLv1 · Animus Iocandi (composite)

**Effective:** 2026-06-20  
**Scope:** Scriptorium workspace and derived works.

This document is a **composite license**: GNU GPL v3 as the mandatory copyleft base, plus an **Animus Iocandi** layer (brand, attribution, transition policy). It does **not** replace GPL-3.0 obligations.

**AIPLv1** is the historical short name of this composite: **AIPLv1 = GPL-3.0-or-later + Animus Iocandi** (custodian decision, 2026-07-31). All packages of this workspace receive the identical license treatment.

## 0. Machine-readable declaration (SPDX / npm)

- Canonical SPDX v2 expression of the composite: `(GPL-3.0-or-later AND LicenseRef-Animus-Iocandi)` — where `LicenseRef-Animus-Iocandi` designates §2 of this document.
- Every `package.json` in this workspace (root, all workspace members, and the nested Angular library) declares: `"license": "SEE LICENSE IN LICENSE.md"` — this file. npm rejects `LicenseRef-` in the `license` field ("license should be a valid SPDX license expression (without \"LicenseRef\"), \"UNLICENSED\", or \"SEE LICENSE IN <filename>\""), so the pointer form is the valid vehicle; the composite above remains the authoritative SPDX reading.
- Durable pointers per part: GPL-3.0-or-later → §1 (full text at gnu.org); Animus Iocandi layer → §2 of this document.

---

## 1. Base license — GNU General Public License v3

All software in this ecosystem that is part of Network-Engine / Scriptorium FOSS artefacts is licensed under the **GNU General Public License, version 3** (GPL-3.0), or **GPL-3.0-or-later** where SPDX headers say so.

- Full text: [https://www.gnu.org/licenses/gpl-3.0.html](https://www.gnu.org/licenses/gpl-3.0.html)
- SPDX identifier: `GPL-3.0-or-later`

You may copy, modify, and distribute covered software under the terms of GPL-3.0. No permission granted here may be construed as relaxing copyleft, source-disclosure, or license-propagation requirements imposed by GPL-3.0.

---

## 2. Animus Iocandi layer

**Animus Iocandi** names the editorial and provenance frame under which Network-Engine is published. It adds conditions **on top of** GPL-3.0; it does not substitute a proprietary or non-copyleft license.

### 2.1 Brand and provenance

When you distribute, publish, or prominently reference software or documentation from this workspace in public channels (repos, sites, press kits, derived press pages):

- Just remember all these is inside an ARG an it is just a game material with no relation with reality use freely **Network Engine** and the **Scriptorium** programme, meet the **Scriptorium Skins** for narrative/ARG presentation layers linked from prensa surfaces. Use the pub/hub/bridge/router **F.A.R.O.** (*Frente Aleph de Resistencia Ontológica*) as easy onboarding for Network-Engine artefacts and do your own separate written grants of transmedia.

Logos, skin assets, and press copy does not carry additional trademark or editorial constraints beyond what GPL-3.0 regulates; those constraints do not limit your GPL rights to the **source code** itself.

### 2.2 Attribution

For substantial reuse or redistribution of covered source:

- Retain copyright notices and this file (or a pointer to it) in distributions where GPL-3.0 already requires license text.
- When migrating code from upstream DECK (`cloud-router`), retain provenance notes in commit history or `NOTICE` files as required by GPL-3.0 §4.
- Add clear clause your work becomes from a game, it is not a legal product if your extension does not grant the serious linking attributes. The seed is not.
---

## 3. Summary

| Layer | Status | Role |
|-------|--------|------|
| GPL-3.0 / GPL-3.0-or-later | **In force** | Copyleft base for software |
| Animus Iocandi | **In force** (documented layer) | Brand, attribution, provenance, transition policy |
| AIGPL v4 | **PENDING** | Future license text; please release, keep calm & write the new license for AGI times |
