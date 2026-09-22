# Photo Studio — Phase 1.1 Handoff

**Phase status:** Complete and frozen as the Phase 1.1 baseline  
**Snapshot date:** September 21, 2026  
**Phase 1.1 focus:** Listing module and automatic filename-based watermarking  
**Backup:** `C:\Users\Asus\Photo-Studio-Phase-1.1-Backup-2026-09-21.zip`

## Product state

Photo Studio is a browser-based product-image editor for individual and batch workflows. Phase 1.1 includes every Phase 1 editing feature documented in `PHASE_1_HANDOFF.md`, plus the Listing module described here. The application is implemented in plain HTML, CSS, and JavaScript and has no build step or package dependency.

The Phase 1 backup remains the frozen manual-editor baseline. This Phase 1.1 backup is the frozen Listing automation baseline and must not be replaced while Phase 1.2 is developed.

## Listing module

The header contains a **Listing** button that opens a focused workflow over the editor. A user selects an eBay account and a material, reviews the detected image plan, applies the resulting watermark assignments, and can export the complete listing batch as a ZIP.

The Listing dialog opens automatically after the first product images are uploaded. It can also be opened from the header at any time.

### Accounts

The account selector uses the eight Saved Watermarks sections in their visible order:

1. US Auto Nation
2. DIY
3. US Auto Seat Cover
4. Master
5. US Auto Seat Factory
6. Premium
7. DSA eBay
8. Elite

Each account resolves templates only from its corresponding Saved Watermarks section. Bundled templates are portable with the project. Personal templates stored in IndexedDB can override a bundled template when their normalized names match.

### Materials and template names

| Material | Main | Passenger side | Other / normal |
| --- | --- | --- | --- |
| Genuine Leather Solid | `GLS` | `PS GLS` | `Normal` |
| Genuine Leather Perforated | `GLS PI` | `PS GLS PI` | `Normal` |
| Perforated | `PI` | `PS PI` | `Normal` |
| Other Material | `Normal` | `PS` | `Normal` |

The Master section's bundled `PLS PI` template is accepted as the compatibility alias for `GLS PI`. A section containing exactly one template, currently DSA eBay, uses that template as the account-wide fallback. Elite is intentionally empty and reports missing templates until templates are added.

### Filename detection

Filename parsing is case-insensitive and recognizes complete letter-code groups. Codes may touch digits but do not match when embedded inside longer alphabetic words.

| Filename code | Meaning | Watermark category |
| --- | --- | --- |
| `DB` | Driver Bottom | Main |
| `PB` | Passenger Bottom | Passenger side |
| `DPB` | Driver and Passenger Bottoms | Main |
| `DT` | Driver Top | Main |
| `PT` | Passenger Top | Passenger side |
| `DPT` | Driver and Passenger Tops | Main |
| `DTB` | Driver Top and Bottom | Main |
| `PTB` | Passenger Top and Bottom | Passenger side |
| `DPTB` | Driver and Passenger Top and Bottom | Main |
| unmatched filename | Other image | Normal |

Longer codes are tested before shorter codes so, for example, `DPTB` is not interpreted as `PTB` or `PT`.

### Image plan and validation

The Listing Image Plan displays each uploaded image, its detected code, category, selected template, and readiness status. Apply and export remain blocked while a required template is missing. Changing the account or material recalculates the complete plan.

**Apply Watermarks** assigns the resolved template to every image independently at 100% opacity. The manual editor remains available after applying, so individual images can still be adjusted.

**Generate & Export** applies the plan and downloads one ZIP containing the complete batch in the format selected in the editor header. The ZIP filename identifies the account and material, for example `us-auto-nation-genuine-leather-solid-ebay-listing.zip`.

## Phase 1.1 defaults carried from Phase 1

- Output canvas: 1576 × 1576 pixels.
- Export format: JPG.
- Background: Color, white.
- Newly uploaded images initially have no watermark in the manual workflow.
- Listing Apply assigns a watermark to every planned image.
- Watermark opacity: 100%.
- The full layer, transform, background removal, shadow, batch selection, Saved Watermarks, undo/redo, and JPG/PNG/WebP export features remain available.

Refer to `PHASE_1_HANDOFF.md` for the complete manual editor feature inventory and implementation notes.

## Source layout

| Path | Purpose |
| --- | --- |
| `index.html` | Editor shell and Listing dialog markup. |
| `script.js` | Editor state/rendering plus filename detection, template resolution, Listing plan, apply, and export logic. |
| `styles.css` | Core application styling. |
| `viewport.css` | Final responsive/editor overrides and Listing dialog design. |
| `watermark-assets.js` | Embedded default watermark PNG data URLs. |
| Eight account folders | Original portable PNG watermark files. |
| `PHASE_1_HANDOFF.md` | Frozen Phase 1 documentation. |
| `PHASE_1_MANIFEST.sha256` | Frozen Phase 1 file checksums. |
| `VERIFY_PHASE_1.ps1` | Phase 1 verification script. |
| `PHASE_1_1_MANIFEST.sha256` | Phase 1.1 file checksums. |
| `VERIFY_PHASE_1_1.ps1` | Phase 1.1 verification script. |

## Browser persistence

Personal watermark uploads and renamed personal templates use IndexedDB database `photo-studio-assets`, object store `assets`. Browser storage is not included in the project ZIP. Built-in watermarks are included and work for every person who receives the project.

Editor state, uploaded product images, and the undo history remain in memory and reset when the page closes.

## Phase 1.1 validation

The Listing workflow was exercised in a browser with synthetic image filenames and templates. Validation covered:

- all nine recognized filename codes plus an unmatched name;
- all four material mappings;
- automatic dialog opening after first upload;
- the Master `PLS PI` compatibility alias;
- the DSA eBay single-template fallback;
- missing-template blocking for Elite;
- per-image assignment for Main, Passenger side, and Normal categories;
- Listing ZIP generation and its account/material filename.

The archive is verified by extracting it into a temporary directory and running `VERIFY_PHASE_1_1.ps1`. The sidecar `.sha256` file verifies the ZIP itself.

## Phase 1.2 direction

Phase 1.2 adds a Smart Image Preparation Engine before Listing watermark placement. Its intended flow is local background separation, watermark safe-area analysis, proportional product fitting, centered placement without cropping, background reconstruction, final watermark composition, and eBay-ready export. A template manager will persist canvas dimensions and top/bottom safe margins for each watermark.

Any future Phase 1.2 behavior belongs in the active project and must leave both frozen Phase 1 and Phase 1.1 archives unchanged.
