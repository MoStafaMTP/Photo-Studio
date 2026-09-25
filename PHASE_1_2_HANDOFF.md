# Photo Studio — Phase 1.2 Handoff

**Milestone:** Phase 1.2 — Smart Image Preparation Engine  
**Implementation date:** September 22, 2026  
**Baseline:** Frozen Phase 1.1 Listing archive at `C:\Users\Asus\Photo-Studio-Phase-1.1-Backup-2026-09-21.zip`

## What Phase 1.2 adds

Phase 1.2 extends the Listing module with automatic product preparation before the selected watermark is applied.

The workflow now:

1. Uses resolved CPIS image metadata when supplied, with filename detection for standalone uploads.
2. Resolves the selected account and material watermark.
3. Uses the supplied template's spacing defaults, or measures a custom watermark's full-width transparent band.
4. Separates the product from edge-connected background pixels.
5. Reconstructs the vacated background from the source image's corner and edge colors.
6. Scales the product proportionally to fit inside the safe band.
7. Centers the product horizontally and vertically inside that band.
8. Draws the selected watermark at 100% configured opacity.
9. Returns prepared images to the editor for review and export as JPG, PNG, or WebP using the header's individual or Export Batch controls.

The Listing dialog uses a single blue (`#007aff`) **Apply Workflow** button. Apply the workflow first, review any manual adjustments in the editor, then export from the header.

Export Batch names the ZIP after the account folder of the templates actually assigned to the exported images (for example, `Elite.zip`). Mixed accounts use the distinct folder names joined with ` + `; a batch without assigned templates keeps `photo-studio-batch.zip`. Browsing another template folder does not change the export name.

The **Smart image preparation** checkbox is enabled by default in Listing. Turning it off only assigns the matched watermarks, while Close View images still restore their original size and background.

**Close View exception:** CPIS subtype `cv`, or standalone filenames such as `DTcv`, `DOPTcv`, `Close View`, `Close_View`, `Close-View`, or `CloseView` (case-insensitive), use the account's Normal template and bypass product separation, background rebuilding, and automatic fitting, even with smart preparation enabled. Applying the workflow restores the original background and centers the unrotated source at 100% native pixel size. Close Views are exempt from the 50px fitting inset to preserve their native size. Preview, layer bounds, duplication, clipboard and export share this rule. Remove BG, Remove All BG and Ctrl+B skip these sources, including in mixed selections; scale controls cannot shrink them below 100%. Rendering also bypasses stale removal/preparation state. Resolved metadata takes priority over filenames, and layer copies retain their source's Close View classification. The configured output canvas still controls the export dimensions; larger native images can extend past that canvas, and smaller images leave space around them.

## CPIS metadata support

See `CPIS_INTEGRATION.md` for the full contract. `listing-metadata.js` validates the primary codes DT/DB/PT/PB/DPT/DPB/DTB/PTB/DPTB, shared codes DOPT/DOPB, and subtypes main/unmain/cv/io/numbered. CPIS classifications override filenames. Only primary `main` rows use Main/Passenger Side templates; other subtypes and shared components use Normal, including `unmain` as confirmed by the user. An optional explicit `templateName` can override template choice without overriding Close View processing.

Listing exposes **Import CPIS JSON** and **Use filenames**. `window.PhotoStudioIntegration` supports structured metadata with File objects, an existing-batch metadata setter, plan/metadata getters, clearing metadata, and the normal Apply Workflow operation. The imported account/material context is authoritative and its selectors are locked; color and optional source IDs are preserved. Unknown values, ambiguous filenames, incomplete manifests, and unclassified new uploads are surfaced rather than guessed. Metadata is copied by batch duplication and excluded from visual-edit undo snapshots.

CPIS remains responsible for which variations use shared images and for composite/listing assembly. No CPIS server connection, business-rule engine, or asset-upload service was added.

## Watermark Template Manager

The Listing dialog contains an expandable **Watermark Template Manager**. It displays the unique Main, Passenger Side, and Normal templates required by the current account/material plan.

Each template records:

- template name and listing categories;
- native canvas width and height;
- top safe margin;
- bottom safe margin;
- computed middle safe height;
- whether the values came from shared template defaults, automatic analysis, explicit re-analysis, or custom edits.

## Shared template spacing (September 25, 2026)

Eight Elite PNGs are included, bringing the portable library to 57 templates. `watermark-safe-areas.js` stores the supplied PDF's margins in pixels on a 1500 × 1500 template:

| Account | Default top / bottom | Top-margin exceptions |
| --- | --- | --- |
| US Auto Nation | 85 / 130 | GLS PI, PS GLS, PS PI: 140; PS GLS PI: 160 |
| US Auto Seat Cover | 180 / 135 | None |
| US Auto Seat Factory | 100 / 150 | Normal: 50; GLS PI, PS GLS, PS PI: 150; PS GLS PI: 215 |
| DIY | 190 / 100 | None |
| Master | 90 / 170 | GLS PI, PS GLS, PS PI: 130; PS GLS PI: 170 |
| Premium | 150 / 100 | PS GLS PI: 170 |
| Elite | 170 / 120 | GLS PI, PS GLS, PS PI: 200; PS GLS PI: 250 |
| DSA eBay | 110 / 130 | Applies to its single shared template |

Master's existing `PLS PI.png` filename is treated as `GLS PI` for both matching and spacing. The supplied templates retain their stable IDs. Run `node scripts/build-watermark-assets.cjs` to refresh the embedded images after updating PNG assets.

The automatic analyzer reads the watermark PNG alpha channel row by row and selects the largest full-width clear band. This approach also handles templates whose artwork is in a corner or near the center, because all artwork above the clear band becomes the top margin and all artwork below it becomes the bottom margin.

The **Analyze** button recalculates a template from its current pixels. **Use default** restores the supplied margins for bundled templates. Editing either margin immediately recalculates the middle area and updates already prepared images using that template.

Safe-area overrides are stored in IndexedDB database `photo-studio-assets`, object store `assets`, under stable keys based on the watermark section and template ID. Shared PDF defaults replace older automatically measured values on existing devices. Explicit custom edits and explicit re-analysis are preserved. A new device uses the shared defaults for bundled templates and automatic analysis for personal templates.

## Smart background separation

The engine runs entirely in the browser and requires no server or external API.

- Product images are analyzed at up to 1600 pixels on their longest side.
- Four corner regions form a background color model.
- The engine adapts its tolerance to the color variation found along the source edges.
- Only matching pixels connected to an image edge are classified as background. This prevents enclosed product areas with a similar color from being erased.
- Original transparency is respected.
- The resulting product is stored as a transparent in-memory canvas with a tight visible bounding box.
- If a dependable foreground cannot be found, the engine keeps the full image as a non-destructive fallback and marks the Listing row **Review fit**.

The local separator is designed for the clean or gently graded product backgrounds normally used for marketplace photography. Complex scenes, background objects touching the product, or nearly identical product/background colors can use the safe full-image fallback rather than producing a destructive cutout.

## Background reconstruction

The reconstructed background preserves every pixel classified as original background. Pixels previously covered by the product are filled from a bilinear model of the source's four corner regions. This retains flat and graded studio backgrounds and prevents the old product position from appearing behind the resized product.

The reconstructed background fills the output canvas. The transparent product layer is then rendered above it, followed by any added layers and the watermark according to the existing layer stack.

## Safe-area fitting

The top and bottom margins are converted from template dimensions using the same centered cover transform as the watermark, including non-square outputs. An additional **50 output-pixel inset** is applied at the top, bottom and canvas sides for every prepared product. It is independent of browser zoom and does not scale with the template. Old `clearance: 0` values no longer bypass this minimum, including on custom margins. Applying the workflow rejects configurations that leave no room for the gap instead of silently discarding the margins.

The product's visible bounding box is scaled with `contain` logic. Rotation is included in the fit calculation. At the initial 100% image size:

- the complete product remains visible;
- natural proportions are preserved;
- no product cropping occurs;
- the product is centered in the available safe rectangle.

Normal templates now use the same centered safe-area fit as Main and Passenger templates. This supersedes the previous upward lift and extra 8% enlargement, which could reduce the requested gap and shift the product away from the center. Proportions and rotated bounds are preserved; full-image fallbacks use the same inset.

Positioning is calculated at the automatic 100% size, then the user's manual scale and drag offsets are applied. The 50px gap and safe-area centering describe automatic placement; deliberate manual adjustments can change them. The manual center action centers the selected layer/group on the canvas. Base-layer position updates use the actual current geometry, fixing drift during centering, dragging and group scaling when the safe-area center differs from the canvas center.

After preparation, the normal editor controls remain available. The product can be dragged, moved with arrow keys, Shift-dragged on one axis, resized with the Image Size control or mouse wheel, rotated, flipped, centered, and given a per-layer shadow. The reconstructed background remains fixed while those product adjustments are made.

Mouse-wheel resizing uses smooth 1% steps; holding Shift uses faster 5% steps. Watermark changes apply only to the images selected in the left panel, including a single selected image. `Ctrl + Alt + A` selects every image and immediately applies the active watermark template to the complete selection.

The Image Size control includes a synchronized 10–300% numeric field. The full-batch shortcut listens for the physical A key during capture, allowing it to work with non-Latin keyboard layouts and while a form control has focus.

Layer keyboard controls include `Delete` for selected-layer removal, `Ctrl + C` and `Ctrl + V` for the internal layer clipboard, `Ctrl + Enter` for horizontal and vertical group centering, and `Ctrl + B` for toggling selected-layer backgrounds off or on. Pasted layers retain their transforms, shadows, and background-removal state and receive independent image assets.

Clicking empty space outside the canvas deselects all layers without changing the selected left-side images. Editing controls preserve layer selection, and scrolling over the canvas only resizes selected layers.

Manual **Remove BG** or **Remove All BG** intentionally exits smart preparation for the affected base image and returns it to the manual background-removal workflow. Reset also clears smart preparation from the current image.

## Rendering and state

Each prepared batch item receives an in-memory `smartPrep` object containing:

- transparent foreground canvas;
- reconstructed background canvas;
- detected foreground bounds;
- watermark safe-area metadata;
- matching template key;
- segmentation coverage and separated/fallback mode;
- analysis dimensions.

The canvas renderer recognizes this state for preview, thumbnails, individual export, and batch export. Prepared state is copied when a complete left-side batch image is duplicated during the session.

As in earlier phases, uploaded images and editing state are not persisted after the page closes. Template safe-area settings are persisted in the browser.

## Validation performed

The spacing/centering update passed the 24-check `tests/listing-preparation.browser.cjs` suite: 1,368 placement cases across 57 templates, four output sizes, two product proportions and three rotations; output pixels in JPG/PNG/WebP; movement and centering without drift; Close View protection through buttons, Ctrl+B, mixed selections, duplicates and clipboard; native pixels even with stale removal/scale/preparation state; oversized Close Views; and invalid-margin rejection. The seven metadata unit tests and 19 CPIS browser integration checks also passed.

The CPIS integration passed 7 unit tests covering metadata validation and all 55 primary/shared-code and subtype combinations, 19 browser integration checks, and the existing 16-check Elite/Close View regression suite. Metadata precedence, atomic validation errors, duplicate identity, visual undo isolation, JSON import, bad image decoding, and the exact pixels of a metadata-driven Close View export were checked.

The Normal-template positioning update passed 29 focused browser checks, including all seven bundled Normal templates, proportion and edge preservation, native-resolution checks for new top-artwork overlap, explicit-margin handling, rotation, manual movement/scaling, full-width header protection, and production export. The existing 16-check Elite/Close View suite also passed, including the exact Close View export pixel comparison.

The Elite/default-spacing update passed 16 browser checks: all 64 PDF margin mappings, all 57 bundled image loads, migration of old automatic margins, custom override persistence and reset, filename detection, mixed-batch processing, proportional safe margins, native Close View bounds and duplication, exact PNG pixel comparison, and the Apply Workflow button lifecycle. No browser JavaScript errors were reported.

Phase 1.2 was tested in a Chromium browser with generated product images and the real bundled US Auto Nation templates.

The automated browser suite passed 24 checks covering:

- all nine filename codes plus an unmatched filename;
- Main, Passenger Side, and Normal template selection;
- smart preparation for every image in a batch;
- exact synthetic product separation and bounding box detection;
- background reconstruction behind the original product position;
- proportional safe-area fit and horizontal/vertical centering;
- exact automatic margin measurement on a known top/bottom watermark fixture;
- persistence of manually edited top and bottom safe margins;
- Template Manager card generation and automatic safe margins;
- JPG composition through the production export path;
- preservation of the 1576 × 1576 output size.

The final exported image was also inspected visually. It showed the reconstructed studio gradient, product inside the detected clear band, and the complete bundled watermark over the final composition.

A focused browser suite passed 13 additional checks for exact single-image and multi-image watermark targeting, `Ctrl + Alt + A` full-batch selection and application, selected thumbnail state, and 1%/5% mouse-wheel scaling.

The shortcut and numeric Image Size update passed 10 focused browser checks, including non-Latin key output, focused-input handling, full-batch watermark application, two-way value synchronization, and numeric limits.

The layer shortcuts passed 12 focused browser checks covering multi-selection, copied state, independent pasted assets, group centering, background removal, deletion, and minimum-layer protection.

The `Ctrl + B` background toggle passed 6 focused browser checks covering mixed selections, removal, restoration, feedback, and control-state synchronization.

`node --check script.js` passes.

## Files changed after Phase 1.1

| File | Phase 1.2 change |
| --- | --- |
| `index.html` | Smart preparation option and Watermark Template Manager markup. |
| `script.js` | Safe-area analysis/persistence, product separation, background reconstruction, smart rendering, Listing integration, and smart-state handling. |
| `viewport.css` | Template Manager, smart option, responsive cards, and Listing dialog sizing. |
| `PHASE_1_2_HANDOFF.md` | This implementation handoff. |

Phase 1.2 does not alter the Phase 1 or Phase 1.1 ZIP archives or their checksum sidecars.
