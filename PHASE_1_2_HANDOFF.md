# Photo Studio — Phase 1.2 Handoff

**Milestone:** Phase 1.2 — Smart Image Preparation Engine  
**Implementation date:** September 22, 2026  
**Baseline:** Frozen Phase 1.1 Listing archive at `C:\Users\Asus\Photo-Studio-Phase-1.1-Backup-2026-09-21.zip`

## What Phase 1.2 adds

Phase 1.2 extends the Listing module with automatic product preparation before the selected watermark is applied.

The workflow now:

1. Detects the listing category from each filename.
2. Resolves the selected account and material watermark.
3. Measures that watermark's available full-width transparent band.
4. Separates the product from edge-connected background pixels.
5. Reconstructs the vacated background from the source image's corner and edge colors.
6. Scales the product proportionally to fit inside the safe band.
7. Centers the product horizontally and vertically inside that band.
8. Draws the selected watermark at 100% configured opacity.
9. Uses the existing JPG, PNG, WebP, individual, batch, and Listing ZIP export paths.

The **Smart image preparation** checkbox is enabled by default in Listing. Turning it off keeps the Phase 1.1 behavior and only assigns the filename-matched watermarks.

## Watermark Template Manager

The Listing dialog contains an expandable **Watermark Template Manager**. It displays the unique Main, Passenger Side, and Normal templates required by the current account/material plan.

Each template records:

- template name and listing categories;
- native canvas width and height;
- top safe margin;
- bottom safe margin;
- computed middle safe height;
- whether the values were detected automatically or edited by the user.

The automatic analyzer reads the watermark PNG alpha channel row by row and selects the largest full-width clear band. This approach also handles templates whose artwork is in a corner or near the center, because all artwork above the clear band becomes the top margin and all artwork below it becomes the bottom margin.

The **Analyze** button recalculates a template from its current pixels. Editing either margin immediately recalculates the middle area and updates already prepared images using that template.

Safe-area metadata is stored in IndexedDB database `photo-studio-assets`, object store `assets`, under stable keys based on the watermark section and template ID. If no saved value exists on a device, the deterministic automatic analyzer recreates it from the bundled watermark, so the defaults work on a new system.

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

The top and bottom margins are converted from the watermark's native dimensions to the current export canvas dimensions. A small internal clearance is added so the product does not touch watermark artwork.

The product's visible bounding box is scaled with `contain` logic. Rotation is included in the fit calculation. At the initial 100% image size:

- the complete product remains visible;
- natural proportions are preserved;
- no product cropping occurs;
- the product is centered in the available safe rectangle.

After preparation, the normal editor controls remain available. The product can be dragged, moved with arrow keys, Shift-dragged on one axis, resized with the Image Size control or mouse wheel, rotated, flipped, centered, and given a per-layer shadow. The reconstructed background remains fixed while those product adjustments are made.

Mouse-wheel resizing uses smooth 1% steps; holding Shift uses faster 5% steps. Watermark changes apply only to the images selected in the left panel, including a single selected image. `Ctrl + Alt + A` selects every image and immediately applies the active watermark template to the complete selection.

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

The canvas renderer recognizes this state for preview, thumbnails, individual export, normal batch export, and Listing ZIP export. Prepared state is copied when a complete left-side batch image is duplicated during the session.

As in earlier phases, uploaded images and editing state are not persisted after the page closes. Template safe-area settings are persisted in the browser.

## Validation performed

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

`node --check script.js` passes.

## Files changed after Phase 1.1

| File | Phase 1.2 change |
| --- | --- |
| `index.html` | Smart preparation option and Watermark Template Manager markup. |
| `script.js` | Safe-area analysis/persistence, product separation, background reconstruction, smart rendering, Listing integration, and smart-state handling. |
| `viewport.css` | Template Manager, smart option, responsive cards, and Listing dialog sizing. |
| `PHASE_1_2_HANDOFF.md` | This implementation handoff. |

Phase 1.2 does not alter the Phase 1 or Phase 1.1 ZIP archives or their checksum sidecars.
