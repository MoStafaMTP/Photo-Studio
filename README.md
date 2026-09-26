# Photo Studio

Photo Studio is a browser-based product-image editor and eBay listing preparation tool. It supports batch editing, layered compositions, reusable watermark libraries, automatic filename-based watermark selection, and smart product positioning inside watermark-safe areas.

The application runs locally in the browser with plain HTML, CSS, and JavaScript. It has no build step, framework, backend, or package dependency.

## Current milestone

The repository contains **Phase 1.2 — Smart Image Preparation Engine**.

- **Phase 1:** Manual batch image editor, layers, transforms, background removal, shadows, saved watermarks, and export.
- **Phase 1.1:** Listing workflow with account/material selection and filename-based automatic watermarking.
- **Phase 1.2:** Product separation, watermark safe-area analysis, automatic scaling and positioning, background reconstruction, and final listing export.

Detailed handoffs are available in:

- [`PHASE_1_HANDOFF.md`](PHASE_1_HANDOFF.md)
- [`PHASE_1_1_HANDOFF.md`](PHASE_1_1_HANDOFF.md)
- [`PHASE_1_2_HANDOFF.md`](PHASE_1_2_HANDOFF.md)

## Workspace and text update

Implemented on September 26, 2026: Full Screen/Grid views, expandable tools beneath fixed Layers, account templates below the account list, and editable text layers. [`WORKSPACE_UPDATE_HANDOFF.md`](WORKSPACE_UPDATE_HANDOFF.md) records the requirements, implementation, pre-update checkpoint and completed validation.

## Features

### Views and sidebar

- **Full Screen View** keeps the main canvas and left-side image list. **Grid View** hides the left sidebar and displays the same batch as large current previews, with selection, edit, duplicate and delete controls. Double-click a preview to open it in Full Screen View.
- Ctrl/Command multi-selection, Ctrl+Alt+A, Tab and Shift+Tab work in both views. Switching views preserves edits, layer selections, image order and Undo/Redo.
- Layers stays open at the top. Independent **Image Size**, **Shadow**, **Saved Watermarks**, and **Text Editor** sections expand underneath it.
- Resize canvas width/height is below the Image Size percentage controls. The header uses one line. Export format and both download buttons float at the bottom-left of the workspace, outside the sidebar, and remain visible in both views while image lists scroll.
- Full Screen/Grid controls are accessible icons at the bottom-right of the canvas, or the grid area in Grid View. They are editor overlays and are never included in exported pixels.
- Large batches scroll within the grid or left image list; lower tools scroll separately from Layers.

### Text layers

- Add editable multiline text to the active image with font family/size, bold, italic, underline, strikethrough, color, alignment, opacity, line height and letter spacing.
- Add an outline and shadow; shadow starts at 80% and uses the existing per-layer angle/distance controls.
- Text supports selection, positioning, group movement/scaling, rotation, flipping, reordering, duplication, clipboard copy/paste and deletion. Text styling works on multiple selected text layers; content editing uses a single selected text layer.
- Text changes participate in Undo/Redo, previews, all three export formats and ZIPs. Batch duplicates and generated unmain images retain independently editable text. Background removal skips text.
- Export waits for fonts; unavailable optional web fonts use the same system fallback as the preview.

### Editing

- Upload one or many JPG, PNG, or WebP images.
- 1576 × 1576 default output canvas.
- Resize, rotate in 15-degree steps, and flip horizontally or vertically.
- Drag layers with optional Shift axis locking.
- Move layers with arrow keys or Shift+Arrow for faster movement.
- Tab selects the next left-side image; Shift+Tab selects the previous one and scrolls it into view. Navigation stops at the first/last image and selects that image alone, like a normal thumbnail click. Form fields and the Listing dialog retain normal Tab focus navigation.
- Add, duplicate, delete, select, group, resize, and reorder layers.
- Images uploaded or dropped into Layers start at 100% of the proportional canvas fit; the old hidden 32% reduction is removed. A 1576 × 1576 layer fills a 1576 × 1576 canvas at 100%. The size controls display fractional percentages and support added layers up to 500%; Close Views still use native pixel size.
- Duplicate and copy/paste preserve the displayed layer size, rotation, flips, shadows, and prepared product cutout. Prepared copies can toggle between their original background and saved cutout.
- Click empty space outside the canvas to deselect layers; editing controls preserve the selection.
- Use `Delete` to remove selected layers, `Ctrl + C`/`Ctrl + V` to copy and paste them, `Ctrl + Enter` to center them, and `Ctrl + B` to toggle their backgrounds off or on.
- Per-layer shadows with opacity, angle, and distance controls.
- Remove BG and Ctrl+B toggle selected layers between the cutout and their original background. The button stays enabled and highlighted while removal is on, with a restore tooltip and accessible pressed state. A single remaining layer can still be toggled after its selection handles are cleared; multiple layers require an explicit selection. Ctrl+B also works from numeric editing controls. Remove All BG processes the complete batch; Close View sources are skipped.
- Remove BG follows background-colored areas connected to the image border, preserving matching colors inside the product. Conservative color/edge limits, corner-outlier rejection and an unchanged-image fallback reduce accidental subject removal; existing transparent backgrounds are respected.
- Manual and workflow cutouts recover fractional edge opacity and remove background color mixed into edge pixels, using nearby product colors. Contour smoothing uses that soft mask rather than a hard, square erosion, retaining a one-pixel inset and gradual inward transition on broad edges. Thin details and internal texture/translucency are protected. Large workflow masks retain fractional coverage when enlarged; product pixels stay at original resolution.
- Remove BG after Apply Workflow keeps the fitted product's size, center, rotation and placement. Restoring its background renders the actual uploaded source aligned to that product, rather than only showing the reconstructed backdrop. Prepared duplicates retain the current background state and their crop, and repeated toggles reuse the saved cutout.
- Session-wide Undo/Redo records each small movement, wheel/input adjustment, shadow, background, watermark, layer and canvas edit. Uploads, batch duplication/deletion, reset and Apply Workflow are reversible, including generated unmain images. There is no fixed 50-step limit. Use Ctrl+Z, Ctrl+Y, or Ctrl+Shift+Z.

### Watermarks

- Eight account-specific Saved Watermarks sections. Each account occupies its own line. Click an account to expand its templates below the complete account list; click again to close.
- 57 bundled PNG templates, including eight Elite templates, available to every clone of the repository.
- Upload, rename, select, disable, and delete personal watermark templates.
- Apply watermark changes only to the selected left-side image or Ctrl/Command-selected images.
- Press `Ctrl + Alt + A` to select the complete batch and apply the active watermark template to every selected image.
- Resize the active image smoothly in 1% mouse-wheel steps, or hold Shift for faster 5% steps.
- Read or enter the current 10–300% image size in the number field beside the Image Size slider.
- Watermark opacity defaults to 100%.

### Listing workflow

- Select an eBay account and product material.
- DSA eBay skips material selection and uses its single `DSA Seat Factory - eBay` template for every image category, without creating DT/DB unmain copies. Switching to another account restores the material question and any previous choice.
- Import resolved CPIS metadata through **Import CPIS JSON** or `window.PhotoStudioIntegration`; metadata takes priority over filenames.
- Detect `DB`, `PB`, `DPB`, `DT`, `PT`, `DPT`, `DTB`, `PTB`, and `DPTB` filename codes. `Full Set` (also `Full_Set`, `Full-Set`, and `FullSet`) is an alias for `DPTB` and follows its material-specific Main template rules.
- Support DOPT/DOPB as shared image types and `main`, `unmain`, `cv`, `io`, and `numbered` subtypes. Only primary `main` images use Main/Passenger templates; all other roles use Normal unless CPIS supplies an explicit template choice.
- Select Main, Passenger Side, or Normal templates automatically.
- For accounts other than DSA eBay, Apply Workflow creates an additional editable Normal-template image for each DT/DB main source, named with ` unmain` before the extension (for example, `DB unmain.jpg`). Originals keep their templates. The review shows planned copies, and repeated runs reuse existing copies. PT and Full Set do not generate unmain copies.
- After Apply Workflow, all images assigned a Normal template appear below the other images. Order within each group, the active image, and multi-image selection are preserved.
- Existing layered arrangements show **Keep layout** in Listing. Changing account/material or applying another watermark preserves layer positions, sizes, transforms, stacking order, and background edits. Automatic product fitting applies to single original layers; compositions keep their manual placement. Generated unmain copies inherit a source composition.
- Review every image and resolved template before processing.
- Close View filenames (`Close View`, `Close_View`, `Close-View`, or `CloseView`, case-insensitive) use the account's Normal template and keep the source image at its original pixel size with its background intact. This also takes priority when the filename contains a part code such as `DT`.
- Use Apply Workflow to prepare the images, then review them in the editor and use Export Batch to download a ZIP.

### CPIS integration

The [CPIS integration guide](CPIS_INTEGRATION.md) defines the payload, validation, template mapping, and browser API. CPIS owns variation detection, shared-component assignment, color, and composite/listing membership. Photo Studio reuses its existing account templates and processing engine.

The API supports importing image Files with metadata, annotating an existing batch, reviewing template choices, applying the workflow, and reading metadata back with stable editor image IDs. `Genuine Leather Perf` maps to Genuine Leather Perforated. Color is retained as context. Invalid/missing metadata blocks processing; it does not trigger filename guessing. Standalone uploads retain filename fallback.

This is a browser API and JSON import, with no automatic CPIS network connection. The CPIS host must supply the metadata and files. Existing image and ZIP exports remain available after manual corrections.

### Smart preparation

- Separate products from edge-connected studio backgrounds locally in the browser.
- Reconstruct the background behind the product's original position.
- Analyze each watermark's alpha channel to find its largest clear horizontal band.
- Fit the complete product proportionally inside that safe area without cropping.
- Keep a minimum 50 output-pixel gap inside template margins. Normal templates can grow products upward by up to 8% into clear space between the top logos, while checking the actual silhouette for 50px artwork clearance and preserving proportions and bottom spacing. Custom margins and full-image fallbacks retain the ordinary fit.
- Center the product horizontally and vertically in the safe area. Only portrait Normal-template products use the available upper-center space; landscape uploads and products wider than their height remain vertically centered, including after rotation.
- Review and edit top and bottom margins in the Watermark Template Manager.
- Bundled templates use the account/template margins from `Template Sizes.pdf`, saved in `watermark-safe-areas.js` at the native 1500 × 1500 template size. Margins follow the watermark's centered cover scaling; the additional 50px gap stays fixed in output pixels, independent of browser zoom.
- Older automatic measurements are replaced by the shared defaults; explicit custom margins are preserved. **Use default** restores the supplied margins, and **Analyze** saves a new measurement.
- Save margin overrides in IndexedDB.
- Preserve a full-image fallback when reliable separation is not possible.

### Export

- JPG, PNG, and WebP output.
- Export the current image.
- Keep uploaded image filenames without adding `Photo Studio`. The chosen format determines the extension. ZIP name collisions within each folder receive a number such as `DT (2).jpg` so every image remains available.
- A batch assigned entirely to DSA eBay exports images directly inside `DSA eBay.zip`, without subfolders. Other or mixed-account batches contain `Main/` and `unmain/`: Normal-template images go in `unmain/`, all others in `Main/`, with both folders present even when one is empty. Layout follows actual template assignments, not the account currently being browsed. Filename collisions are numbered in either layout.
- Batch ZIP names match the applied template's account folder, such as `Elite.zip`, `DIY.zip`, or `US Auto Nation.zip`. Mixed accounts use their folder names joined with ` + `; batches without an assigned template keep `photo-studio-batch.zip`.
- Export prepared eBay listing images with the current-image or Export Batch controls in the floating export dock.

## Run locally

You can open `index.html` directly in a modern Chromium-based browser. A local static server is recommended for consistent browser storage and download behavior.

With Python installed:

```powershell
cd C:\path\to\Photo-Studio
python -m http.server 8000
```

Then open <http://localhost:8000/>.

## Project structure

| Path | Purpose |
| --- | --- |
| `index.html` | Application shell and Listing interface. |
| `script.js` | Editor, layers, watermark library, smart preparation, and export logic. |
| `editor-history.js` | Whole-session edit history, state restoration and saved-watermark undo persistence. |
| `styles.css` | Base editor styling. |
| `viewport.css` | Editor and Listing UI styling. |
| `workspace-ui.js` / `workspace-ui.css` | Shared Grid/Full Screen views, sidebar/header assembly, current previews and final responsive layout. |
| `text-layers.js` | Editable text data, measurement/rendering, font readiness and Text Editor controls. |
| `WORKSPACE_UPDATE_HANDOFF.md` | Completed workspace/text update, requirements and validation. |
| `watermark-assets.js` | Portable embedded copies of all bundled watermark PNGs. |
| `watermark-safe-areas.js` | Shared account/template spacing defaults transcribed from the supplied PDF. |
| `listing-metadata.js` | CPIS metadata validation, image-role translation, and local filename fallback. |
| `CPIS_INTEGRATION.md` | Integration contract and browser API for the CPIS developer. |
| `tests/listing-metadata.test.cjs` | Dependency-free metadata contract regression tests. |
| `scripts/build-watermark-assets.cjs` | Regenerate embedded images after changing account-folder PNGs. |
| Account folders | Original account-specific watermark PNG files. |
| `PHASE_*_HANDOFF.md` | Feature and implementation documentation for each milestone. |

## Browser storage

Personal watermark uploads and safe-area overrides are stored in the browser's IndexedDB database named `photo-studio-assets`. They persist on that browser profile but are not committed to Git.

Uploaded images, text layers and view state remain in the current session. Undo/Redo history remains available while the current tab is open; it is not saved across reloads. Undoing personal-template uploads, renames, deletions or margin changes also updates browser storage. Selection/navigation and exports do not add editing steps; a new edit after Undo starts a new branch and clears Redo.

Bundled watermark templates are stored in the repository and work on every system.

After adding or replacing bundled PNGs, update the library entries in `script.js` and run `node scripts/build-watermark-assets.cjs`.

## Technical notes

- Canvas rendering uses the real export dimensions while CSS fits the preview to the browser viewport.
- ZIP files are generated locally without a third-party archive library.
- Smart product separation is optimized for clean or gently graded marketplace backgrounds. Difficult scenes use a non-destructive full-image fallback marked **Review fit**.
- No uploaded product images leave the browser.
- Close View images are centered at native pixel size on the configured output canvas; 100% means one source pixel per output pixel. They are exempt from safe-area fitting and the 50px inset so that their original size and background are preserved. A source larger than the output canvas can extend beyond its edges; increase the output dimensions when needed. Manual enlargement is available, but shrinking below 100% and background removal are blocked for Close View sources and their layer/batch copies.

## Validation

`tests/workspace-text.browser.cjs` passes 55 checks covering the revised single-line header, separate size/shadow sections, bottom-right icon controls, floating exports that remain visible with the sidebar hidden in Grid View, account templates below all accounts, all text controls, history, selection/navigation, text/group/copy behavior, workflow/unmain copies, font fallback, export pixels and a downloaded ZIP. A 35-image batch scrolls inside the workspace. Layout is checked at desktop, smaller desktop and mobile sizes. The initial workspace implementation also passed five existing history/layer/Listing/background suites (220 checks with the initial 47-check workspace suite). The latest layout revision reran the expanded 55-check workspace suite, including an actual ZIP download from Grid View and fixed export controls during desktop/mobile scrolling. See the workspace handoff for details.

`tests/background-toggle.browser.cjs` passes 17 checks with its generated fixture and 25 checks when run with the supplied `9.jpg` and `FullSet.jpg`. Real clicks and keyboard events verify pressed/enabled state, deselection, exact original-PNG restoration, cached repeated toggles, numeric-field Ctrl+B, Undo/Redo, prepared-source restoration, duplicates, groups, deleted base layers and Close View protection. Optional image paths can be passed as command-line arguments; the supplied photos remain outside the repository.

`tests/cutout-smoothing.browser.cjs` passes 24 checks for gradual opacity, curved/slanted contours, background-color decontamination, one-to-four-pixel details, unchanged interior texture/translucency, native-resolution workflow cleanup, fixed placement, repeated removal, Undo/Redo and PNG/JPG/WebP export. Original/previous/new crops of both supplied 1576px photos were compared over light and dark backgrounds. Set `CUTOUT_PREVIEW` to an output PNG path to save the generated-fixture visual sheet.

`tests/listing-dsa.browser.cjs` passes 28 checks covering the DSA material-free workflow, template matching, account switching, Undo/Redo, Close Views, CPIS metadata, keyboard focus and skipped DT/DB unmain generation. Actual downloads verify a flat DSA ZIP, filename collision handling, repeat export, independence from the browsed account and folder-based mixed-account export. Other accounts retain material-specific matching and DT/DB unmain generation.

`tests/subject-preservation.browser.cjs` passes 23 checks covering white/light-gray subject interiors, subtle product boundaries, subjects touching a corner, one/two-pixel details, translucent regions, graded backgrounds and uncertain-cutout fallback. It also checks the actual Remove BG action, repeated toggles, Undo/Redo, duplicates, added layers, Remove All BG, Close View protection and transparent PNG export. These use generated fixtures; no user-supplied failing photo was available for this change.

`tests/cutout-scale.browser.cjs` passes 31 checks for one-pixel fringe removal, inward antialiasing, transparent dark products, original-resolution texture and mask edges on large images, native fallback preservation, real file-drop handling, proportional percentage sizing, fractional/large scales, Undo/Redo, duplicates, Close View protection, fixed workflow geometry and transparent PNG export pixels. Browser tests block optional Google Fonts requests so network delays cannot prevent editor checks.

`tests/editor-history.browser.cjs` checks whole-batch history, more than 50 one-pixel moves, keyboard/wheel/numeric input, mouse dragging, cross-image Undo/Redo, layers, uploads/deletions, atomic workflow/reset actions, saved-watermark persistence, metadata actions, and fixed geometry and export pixels when removing/restoring backgrounds. It also verifies that repeated preparation reuses immutable image buffers.

Layer duplication and account switching passed 30 checks in `tests/layer-layout.browser.cjs`: exact duplicate sizes at multiple rotations and fit modes, large scales, prepared cutout/export pixel bounds, background toggling, clipboard and group copies, repeated account changes, Main/Normal/manual watermark changes, layer order and selection, deleted original layers, composed unmain outputs, Close View preservation, and continued manual editing.

Normal-template fitting passed 54 checks in `tests/normal-template-fit.browser.cjs`, including native-pixel 50px header clearance for all seven Normal templates at four output sizes, rotation/flips, wide products, custom margins, full-width banners, Close View preservation and export. The sample Elite product grew 8% and its top whitespace decreased from 229px to 103px.

The DT/DB output workflow has 39 checks in `tests/listing-unmain.browser.cjs`, covering pending-copy review, actual Apply Workflow/individual/ZIP downloads, independent editing and assets, repeat/delete behavior, existing unmain files, missing templates/copy failures, clean filenames, Full Set aliases across every account/material, landscape centering, CPIS overrides and metadata round trips, Normal-last grouping with selection preservation, and template-based export folders including empty folders and filename collisions. The metadata unit suite includes eight tests.

The updated preparation suite passed 24 browser checks, including 1,368 placement cases across all 57 templates, four output sizes, two product proportions and three rotations; JPG/PNG/WebP pixel checks; prepared-layer movement/centering; Close View background and size protection; duplicates; and impossible-margin validation. Run `node tests/listing-preparation.browser.cjs` and `node tests/normal-template-fit.browser.cjs` with Playwright available for testing. Optional `PLAYWRIGHT_MODULE` and `BROWSER_EXECUTABLE` environment variables can point to existing installations.

The CPIS update passed 7 unit tests (including all 55 variation/shared-component and subtype combinations), 19 integration browser checks, and the existing 16-check Elite/Close View browser suite. Run `node --test tests/listing-metadata.test.cjs` for the repeatable metadata checks.

The Phase 1.2 browser regression suite passed 24 checks covering filename mapping, template resolution, safe-area measurement and persistence, foreground detection, background reconstruction, proportional fitting, centering, and 1576 × 1576 JPG export.

A focused browser suite passed 13 additional checks covering single-image and multi-image watermark scope, `Ctrl + Alt + A` full-batch selection and application, thumbnail selection state, and normal/Shift mouse-wheel scaling.

The shortcut and numeric Image Size update passed 10 browser checks covering physical-key detection on non-Latin layouts, focused-input handling, full-batch watermark application, slider/wheel/value synchronization, direct numeric entry, and the 300% limit.

The layer keyboard shortcuts passed 12 browser checks covering multi-layer copy/paste, preserved editing state, independent pasted assets, group centering, background removal, multi-layer deletion, original-layer deletion, and the one-layer safety rule.

The `Ctrl + B` toggle passed 6 browser checks covering mixed selections, first-press removal, second-press restoration, status feedback, and Remove BG control synchronization.

`script.js` also passes `node --check`.
