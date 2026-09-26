# Photo Studio — Phase 1.2 Handoff

**Milestone:** Phase 1.2 — Smart Image Preparation Engine  
**Implementation date:** September 22, 2026  
**Baseline:** Frozen Phase 1.1 Listing archive at `C:\Users\Asus\Photo-Studio-Phase-1.1-Backup-2026-09-21.zip`

## September 26 workspace extension

The [workspace update handoff](WORKSPACE_UPDATE_HANDOFF.md) documents the completed Full Screen/Grid views, fixed Layers with an icon sidebar, account watermark templates below the account list, and editable text layers. It includes the pre-update Git checkpoint, implementation details, the initial 220 passing browser checks, the preceding 127 workspace/history checks and the latest 82-check workspace validation. Three icons open one section at a time directly beneath Layers without a separate card: Image Size & Shadow (including Resize and Background moved from the header), Saved Watermarks, and Text Editor. Watermark accounts appear two per row without arrows. Resize remains below Image Size, view controls sit at the image corner, and downloads and format stay in the single-line header while Grid View hides the left sidebar. The image-list scrollbar sits on the left without reversing its contents. Layers puts Duplicate/Delete alongside Add images/Select all/Clear and removes Smaller/Bigger/Side By Side. The Position controls offer Center Vertically for canvas group centering, plus Align Vertically and Align Horizontally for alignment relative to the selection; Movement Lock is removed. The Phase 1.2 Listing and background preparation behavior below remains in place; composed/generated images also preserve text layers.

## What Phase 1.2 adds

Phase 1.2 extends the Listing module with automatic product preparation before the selected watermark is applied.

The workflow now:

1. Uses resolved CPIS image metadata when supplied, with filename detection for standalone uploads.
2. Resolves the selected account and material watermark.
3. Uses the supplied template's spacing defaults, or measures a custom watermark's full-width transparent band.
4. Analyzes product boundaries using the existing foreground detection and safe-area logic.
5. Retains the original photo and background for rendering; reconstructed source colors fill any surrounding area beyond that transformed photo.
6. Scales the product proportionally to fit inside the safe band, using exactly the same fitting calculations as before.
7. Centers the product horizontally and vertically inside that band and draws the original photo at that fitted transform.
8. Draws the selected watermark at 100% configured opacity.
9. Returns prepared images to the editor for review and export as JPG, PNG, or WebP using the Export current or Export Batch controls in the header.

The Listing dialog uses a single blue (`#007aff`) **Apply Workflow** button. Apply the workflow first, review any manual adjustments in the editor, then export from the header.

**DSA eBay:** material selection is hidden and disabled for this account. Its `DSA Seat Factory - eBay` template is selected directly for Main, Passenger Side and Normal roles, and the plan can become ready with no material selected. The account question expands to the available width, the template manager works without a material, and reopening Listing focuses a visible control. Returning to another account restores the material question and its previous value. This behavior also restores correctly through Undo/Redo. DSA does not plan or create automatic DT/DB unmain copies, including from CPIS main roles; it does not delete already uploaded or previously generated images. A batch whose images are all assigned to DSA exports directly into `DSA eBay.zip` without directories. Close View protections and explicit CPIS template overrides continue to apply.

Export Batch names the ZIP after the account folder of the templates actually assigned to the exported images (for example, `Elite.zip`). Mixed accounts use the distinct folder names joined with ` + `; a batch without assigned templates keeps `photo-studio-batch.zip`. Browsing another template folder does not change the export name.

Image exports keep the uploaded filename stem with the selected JPG/PNG/WebP extension, without the former `-photo-studio` suffix. DSA-only ZIPs are flat. Other and mixed-account ZIPs contain `Main/` and `unmain/` directories. The actual assigned template determines the destination: Normal goes in `unmain/`, everything else in `Main/`, including after manual template changes. Conflicting names within a folder, or at the root of a flat ZIP, receive a numeric suffix to prevent replacement during extraction; equal names in different folders are preserved. Browsing a different account does not change archive layout.

**DT/DB unmain outputs:** for accounts other than DSA eBay, the Listing review plans one additional Normal-template image for each resolved DT or DB `main` source. Apply Workflow creates these copies as independent, editable left-side images with ` unmain` appended before the extension; the originals retain their Main template selection. Copies keep explicit `unmain` metadata and a `generatedFromImageId` link to their source, independent image URLs and layer assets. Reapplying does not create extra copies, and a matching uploaded unmain file is reused. Deleting a generated copy allows one replacement on the next run. Descriptive filenames, existing filename collisions and repeated source filenames are handled. PT and other roles, including cv/io/numbered/unmain, shared components and Full Set (`DPTB`), do not generate these copies. Existing PT unmain images are not deleted automatically. Missing Normal templates block the workflow, with the existing single-template account fallback retained.

**Full Set filenames:** `Full Set`, `Full_Set`, `Full-Set`, and `FullSet` are local filename aliases for `DPTB`, with the same Main-template selection by account/material and Normal-template supporting suffixes. CPIS still supplies canonical `DPTB` metadata, which overrides filenames. There is no separate DPTB watermark asset requirement.

**Editor grouping:** after successful Apply Workflow, all Normal-template images move below the other images. Relative order within each group, the active image, and batch selection are preserved by stable image identities. The resulting CPIS plan follows the same order.

**Layer duplication:** a base-layer duplicate uses the original's unrotated draw dimensions and keeps its scale percentage, with an independent size multiplier instead of clamping the fitted size to 500%. For prepared products it copies the cropped foreground pixels into an immutable source snapshot; duplicate, clipboard, batch, and generated-output copies retain that snapshot. Toggling a prepared duplicate's background restores the original source or the saved cutout. Rotation, flips, shadows, and the existing 35px duplicate offset are preserved.

**Layer import scale:** uploaded and dropped layers now start at 100% of the full proportional canvas fit. The old implicit 0.32 fit multiplier is removed. A square source therefore fills a square canvas at 100%; non-square sources preserve their proportions. Size controls show two decimal places when needed and use the added-layer 500% maximum instead of displaying a clamped 300%. Copies retain their existing percentage and exact geometry through the separate duplicate size multiplier. Close View layers continue to use native pixel dimensions at 100%.

**Composition preservation:** Listing labels images containing added layers (including those whose original layer was deleted) as **Keep layout**. Apply Workflow replaces their watermark without resetting transforms, clearing preparation/background edits, or re-fitting only the original layer. A prepared original's current unrotated size and center are retained independently of the template's automatic fit, so Normal header analysis cannot move it when accounts change. Manual Saved Watermark changes use the same preservation rule. Generated unmain compositions inherit the arrangement with independent layer IDs and loaded assets. Existing single-original-layer preparation and Close View rules remain in place; manual compositions are not automatically rearranged to enforce a new template's margins.

The **Smart image preparation** checkbox is enabled by default in Listing. Automatic preparation keeps original backgrounds visible; Remove BG, Ctrl+B and Remove All BG remain explicit actions. Turning smart preparation off only assigns the matched watermarks, while Close View images still restore their original size and background.

**Close View exception:** CPIS subtype `cv`, or standalone filenames such as `DTcv`, `DOPTcv`, `Close View`, `Close_View`, `Close-View`, or `CloseView` (case-insensitive), use the account's Normal template and bypass product separation, background rebuilding, and automatic fitting, even with smart preparation enabled. Applying the workflow restores the original background and centers the unrotated source at 100% native pixel size. Close Views are exempt from the 50px fitting inset to preserve their native size. Preview, layer bounds, duplication, clipboard and export share this rule. Remove BG, Remove All BG and Ctrl+B skip these sources, including in mixed selections; scale controls cannot shrink them below 100%. Rendering also bypasses stale removal/preparation state. Resolved metadata takes priority over filenames, and layer copies retain their source's Close View classification. The configured output canvas still controls the export dimensions; larger native images can extend past that canvas, and smaller images leave space around them.

## CPIS metadata support

See `CPIS_INTEGRATION.md` for the full contract. `listing-metadata.js` validates the primary codes DT/DB/PT/PB/DPT/DPB/DTB/PTB/DPTB, shared codes DOPT/DOPB, and subtypes main/unmain/cv/io/numbered. CPIS classifications override filenames. Only primary `main` rows use Main/Passenger Side templates; other subtypes and shared components use Normal, including `unmain` as confirmed by the user. An optional explicit `templateName` can override template choice without overriding Close View processing.

Listing exposes **Import CPIS JSON** and **Use filenames**. `window.PhotoStudioIntegration` supports structured metadata with File objects, an existing-batch metadata setter, plan/metadata getters, clearing metadata, and the normal Apply Workflow operation. The imported account/material context is authoritative and its selectors are locked; color and optional source IDs are preserved. Unknown values, ambiguous filenames, incomplete manifests, and unclassified new uploads are surfaced rather than guessed. Metadata is copied by batch duplication. Visual-edit Undo retains the metadata active for that edit; explicit metadata import/clear operations now have their own reversible history steps.

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

The sizing engine runs entirely in the browser and requires no server or external API. Foreground analysis remains unchanged because its bounds and silhouette determine the current sizing, safe-area clearance and Normal-template fit. Default preview/export uses the actual original source. Manual Remove BG now uses a separate local AI mask, with a first-use model/runtime download; see [AI_BACKGROUND_REMOVAL.md](AI_BACKGROUND_REMOVAL.md) for the September 27, 2026 update and validation.

- Product images are analyzed at up to 1600 pixels on their longest side, while the foreground canvas retains original-resolution product pixels. For larger sources, only the detection mask is enlarged; its fractional coverage is retained instead of thresholding it back to black/white, and source transparency is applied once.
- Four corner regions form a background color model.
- The engine adapts its tolerance to the color variation found along the source edges.
- Only matching pixels connected to an image edge are classified as background. This prevents enclosed product areas with a similar color from being erased.
- Original transparency is respected.
- The resulting product is stored as a transparent in-memory canvas with placement bounds mapped to source pixel coordinates. Edge matting estimates fractional coverage by projecting the edge RGB between the modeled background and a nearby opaque product color. Low-contrast or poorly matched samples retain their source values; matched edge colors are decontaminated. A separable 7 × 7 binomial filter smooths this untrimmed soft matte, and a cached Gaussian coverage/distance table applies a one-native-pixel inset and two-pixel inward transition on broad edges. This replaces square binary erosion as the final contour. Two-pixel-deep cores protect narrow details and connections; internal texture and translucency stay unchanged. Original transparent pixels remain transparent, and the canvas border is not treated as removed background. The Listing analysis and legacy helper share this path without changing canvas dimensions or placement bounds; current manual removal uses the separate AI worker.
- If a dependable foreground cannot be found, the engine keeps the full image as a non-destructive fallback and marks the Listing row **Review fit**.

The local separator is designed for the clean or gently graded product backgrounds normally used for marketplace photography. Complex scenes, background objects touching the product, or nearly identical product/background colors can use the safe full-image fallback rather than producing a destructive cutout.

Before the September 27 AI update, manual Remove BG used `analyzeProductBackground` in conservative mode instead of globally deleting/fading colors similar to the top-left pixel. Four corner samples model flat or graded background; a corner that disagrees with three agreeing corners is excluded from that model. Only matching pixels connected to the image border are removed, and growth stops at local color discontinuities. Manual color tolerance is bounded to 18–48 total RGB difference, versus the existing 58–135 workflow limits. If the border is mostly fully transparent, source opacity is respected instead of color-keying the product. Unreliable separation returns the original image intact. Workflow detection retains its previous thresholds through the shared helper's non-conservative mode.

Preview and export re-enable high-quality image resampling after every canvas resize. Close View sources bypass removal and edge cleanup entirely. The legacy helper remains a color/continuity heuristic for older state; new Remove BG actions use IS-Net and never silently fall back to it on failure.

## Background reconstruction

The reconstructed background preserves every pixel classified as original background. Pixels previously covered by the product are filled from a bilinear model of the source's four corner regions. This retains flat and graded studio backgrounds and prevents the old product position from appearing behind the resized product.

The reconstructed background fills the output canvas. The transparent product layer is then rendered above it, followed by any added layers and the watermark according to the existing layer stack.

## Safe-area fitting

The top and bottom margins are converted from template dimensions using the same centered cover transform as the watermark, including non-square outputs. The ordinary fit includes an additional **50 output-pixel inset** at the top, bottom and canvas sides. It is independent of browser zoom and does not scale with the template. Old `clearance: 0` values no longer bypass this minimum, including on custom margins. Normal templates can use transparent header space while preserving 50px clearance from actual header artwork, as described below. Applying the workflow rejects configurations that leave no room for the gap instead of silently discarding the margins.

The product's visible bounding box is scaled with `contain` logic. Rotation is included in the fit calculation. At the initial 100% image size:

- the complete product remains visible;
- natural proportions are preserved;
- no product cropping occurs;
- the product is centered in the available safe rectangle.

**Normal templates:** separated products can grow proportionally by up to 8% and move slightly upward into the transparent space between the top logos. Horizontal centering, canvas-edge clearance and at least the original bottom clearance are preserved. Total upward travel is limited to 8% of the canvas height. Width-limited products can move upward without further enlargement. The renderer checks the transformed product silhouette against the actual header artwork with a conservative 50px exclusion mask. Native watermark pixels are pooled before the mask is reduced, so thin artwork is retained; a small sampling allowance prevents antialiasing from eroding the gap. Middle branding remains an intentional overlay. If even the baseline crowds a corner logo, a conservative full-band fit is used. Close View images, explicit custom margins and full-image fallback preparations are excluded.

**Landscape exception:** an upload whose original width exceeds its height, or a product whose rotated bounds are wider than tall, does not receive the Normal upward adjustment or enlargement. Its vertical center stays at the middle of the template's safe area. If corner artwork requires a smaller fit to retain 50px clearance, scaling remains centered. Portrait Normal images retain the upper-space improvement.

Normal fit results and header masks are cached per preparation/image and invalidated by output dimensions, watermark image, geometry and transforms. Preview, thumbnails, selection bounds and export use the same geometry.

Positioning is calculated at the automatic 100% size, then the user's manual scale and drag offsets are applied. The 50px gap and automatic positioning rules describe automatic placement; deliberate manual adjustments can change them. The manual center action centers the selected layer/group on the canvas, including Normal-template products. Base-layer position updates use the actual current geometry, fixing drift during centering, dragging and group scaling when the automatic center differs from the canvas center.

After preparation, the normal editor controls remain available. The product can be dragged, moved with arrow keys, Shift-dragged on one axis, resized with the Image Size control or mouse wheel, rotated, flipped, centered, and given a per-layer shadow. The original photo and its background follow the product transform by default; any reconstructed fill beyond the transformed source stays fixed.

Mouse-wheel resizing uses smooth 1% steps; holding Shift uses faster 5% steps. Watermark changes apply only to the images selected in the left panel, including a single selected image. `Ctrl + Alt + A` selects every image and immediately applies the active watermark template to the complete selection.

The Image Size control includes a synchronized 10–300% numeric field. The full-batch shortcut listens for the physical A key during capture, allowing it to work with non-Latin keyboard layouts and while a form control has focus.

Layer keyboard controls include `Delete` for selected-layer removal, `Ctrl + C` and `Ctrl + V` for the internal layer clipboard, `Ctrl + Enter` for horizontal and vertical group centering, and `Ctrl + B` for toggling selected-layer backgrounds off or on. Pasted layers retain their transforms, shadows, and background-removal state and receive independent image assets.

`Tab` / `Shift + Tab` navigate to the next / previous left-side image in the current displayed batch order. They stop at the first/last image, use ordinary single-image selection (including watermark scope), refresh layer controls/canvas and focus/scroll the selected thumbnail into view. Navigation does not add Undo/Redo entries. Inputs, selects, text areas, editable content and Listing keep native Tab focus navigation; Ctrl/Meta/Alt combinations and active drag/export/workflow operations are excluded.

Clicking empty space outside the canvas deselects all layers without changing the selected left-side images. Editing controls preserve layer selection, and scrolling over the canvas only resizes selected layers.

Manual **Remove BG** or **Remove All BG** retains smart preparation and its fitted geometry while showing the cutout. Remove BG or Ctrl+B restores the original photo without re-fitting. Reset clears smart preparation from the current image.

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

Automatic preparation sets `removeBg: false` and `originalBackgroundRestored: true`, drawing the actual uploaded source aligned to the fitted product; reconstruction fills only the surrounding area beyond that source. The fitting functions, analysis bounds, Normal-template silhouette checks, scale and offsets are unchanged. Generated unmain items use the same default; existing layered compositions retain their explicit per-layer background choices when changing accounts. Remove BG retains `smartPrep` and its placement, hides the backdrop and original source, and shows the fitted foreground. Toggling off restores the source without a size change. Reset clears preparation, while new preparation restores the original-background default. Full-image fallback preparations use manual removal without re-fitting. Prepared copies retain both the cutout and corresponding original-background crop, so toggles preserve geometry and reuse the exact cutout.

The Remove BG button and Ctrl+B share the same target resolution and toggle. A sole remaining layer is available even after clearing its selection handles; multi-layer compositions require explicit selection. The button exposes `aria-pressed` (including mixed state), a restore tooltip, and remains enabled/blue when removal is on. Numeric inputs allow Ctrl+B, while text editing and the Listing dialog retain their shortcut guards. Remove All BG skips deleted base layers and Close Views. Source images and cached cutouts remain immutable across repeated toggles and history restoration.

`editor-history.js`, loaded after the editor, records complete batch and global-setting states. It preserves image/layer identities on restore, clones mutable configuration, shares immutable image assets, and ignores previews, processing caches, selection and navigation when detecting edits. Small input, wheel, key-repeat and drag increments are separate steps; compound operations such as Apply Workflow, watermark upload/application and Reset remain single actions. The previous 50-step cap and batch-operation history clearing are removed. Deleted source URLs remain available for restoration until the tab closes. Prepared foreground/background buffers are reused for repeated processing of the same immutable source image to avoid duplicating them for account changes.

History covers layer and batch uploads, duplication and deletion, stacking, size/position/rotation/flips, group centering, shadows, background controls/removal, watermark assignment/opacity/visibility, canvas dimensions, export format, Listing settings/workflows, and explicit CPIS metadata actions. Undo follows the affected batch state even after selecting another image. Personal-watermark upload/rename/delete and template margins are also reversible; restores use an ordered IndexedDB transaction so saved library state matches the editor. Ctrl+Z, Ctrl+Y and Ctrl+Shift+Z work with focused numeric controls and non-Latin keyboard layouts. No-op inputs and rendering/export do not consume history; a new edit after Undo clears Redo.

As in earlier phases, uploaded images and editing state are not persisted after the page closes. Template safe-area settings are persisted in the browser.

## Validation performed

The original-background default passed 191 checks: 30 preparation, 54 Normal-template fit, 31 layer-layout, 17 background-toggle and 59 history checks, with no uncaught browser errors. The preparation suite verifies unchanged geometry in all 1,368 placement cases, original background pixels in exports, generated unmain defaults, manual remove/restore with fixed size, and Close View protection. Layer checks explicitly test both default background-preserving copies and manually removed cutout copies.

`tests/background-toggle.browser.cjs` covers real mouse clicks/keyboard events, active/enabled button state, cleared handles, pixel-identical original-PNG restoration, cached cutouts, numeric-field shortcuts, Undo/Redo, prepared originals, restored duplicates, groups, deleted base layers and Close View protection. It accepts optional local image paths; the user-supplied `9.jpg` and `FullSet.jpg` remain outside the repository.

`tests/cutout-smoothing.browser.cjs` passes 24 checks covering gradual opacity, curved/slanted silhouettes, white-matte decontamination, one-to-four-pixel details, unchanged internal color/translucency, native-resolution preparation, fixed geometry, repeated removal, Undo/Redo and PNG/JPG/WebP export. Original/previous/new crops of both supplied 1576px photos were compared on light/dark backgrounds at 3× magnification. The optional `CUTOUT_PREVIEW` path saves the generated-fixture sheet. Existing subject-preservation and cutout/scale suites continue to pass (23 and 31 checks).

`tests/listing-dsa.browser.cjs` passes 28 checks for DSA preselection/upload, blank-material readiness, template matching, account switching, Undo/Redo, Close Views, CPIS metadata, focus and skipped DT/DB generation. Actual ZIP downloads check flat DSA exports, numbered filename collisions, repeated exports, independence from the browsed account and grouped mixed-account exports. The 39-check listing-output and 59-check history suites also pass.

Tab navigation passed 14 focused browser checks using actual keyboard events: next/previous selection, thumbnail focus and scrolling, first/last boundaries, watermark selection scope, retained image edits and Undo/Redo, native field/dialog focus, modifier exclusions, and single/empty batches. No browser errors were reported.

`tests/subject-preservation.browser.cjs` passes 23 checks for interior colors matching the background, subtle light-subject boundaries, corner-touching subjects, thin features, existing transparency/translucency, gradients and uncertain-cutout fallback. Production actions cover Remove BG, repeated toggles, Undo/Redo, duplicates, added layers, Remove All BG, Close View protection and transparent PNG exports. Generated fixtures reproduce the old global-color deletion and thin-detail erosion; the user confirmed the issue occurs with Remove BG but did not provide a failing source photo.

`tests/cutout-scale.browser.cjs` passes 31 checks covering manual/workflow fringe removal on all four edges, inward antialiasing and unchanged interior pixels, transparent dark products, original-resolution texture and mask edges on large images, non-destructive fallback, actual Layers file-drop events, percentage sizing including fractional and >300% values, Undo/Redo, duplicates, Close Views, stable workflow placement and transparent PNG export. Optional Google Fonts requests are blocked in browser tests to keep checks independent of network availability.

`tests/editor-history.browser.cjs` covers granular and whole-batch history, restoring uploads and deletions with usable image assets, more than 50 movement steps, cross-image Undo/Redo, layers, compound workflow/reset actions, saved-library persistence, explicit metadata actions, real mouse movement and history buttons, numeric keyboard shortcuts, and background-toggle geometry/export pixels.

`tests/layer-layout.browser.cjs` passes 31 checks for default background-preserving prepared copies, exact-sized duplicates, crop/export pixels, high scales and rotated contain/cover layers, shadows and flips, background restoration, clipboard/group copies, repeated account changes, Normal/manual watermark changes, kept layer order/selection, continued editing, deleted original layers, composed unmain outputs, Close View arrangements, and later margin edits.

The Normal upper-space update passed 54 checks in `tests/normal-template-fit.browser.cjs`: all seven Normal templates, native-pixel checks for at least 50px header clearance at four output sizes, rotation and both flips, wide-product fallback, custom margins, full-width banners, manual edits, Close View preservation and production export. Sample enlargement ranged from 1.8% to 8%; the Elite sample's top whitespace dropped from 229px to 103px. The updated 24-check `tests/listing-preparation.browser.cjs` suite also passed, retaining its 1,368 placement cases and background/export regression coverage with Normal-specific header positioning.

`tests/listing-unmain.browser.cjs` has 39 checks for the DT/DB output workflow: reviewed pending copies, actual Apply Workflow and downloads, independent edits/assets, idempotence and recreation after deletion, landscape centers, metadata precedence and round trips, existing unmain reuse, load/missing-template failures, and PT exclusion. It also checks Full Set filename aliases across every account/material, Normal-last editor order with selection preservation, and template-based ZIP folders (including empty directories and filename collisions scoped to each folder). The metadata suite has eight tests including descriptive trailing-unmain filenames, Full Set aliases and supporting suffixes, and canonical DPTB metadata.

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
