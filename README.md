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

## Features

### Editing

- Upload one or many JPG, PNG, or WebP images.
- 1576 × 1576 default output canvas.
- Resize, rotate in 15-degree steps, and flip horizontally or vertically.
- Drag layers with optional Shift axis locking.
- Move layers with arrow keys or Shift+Arrow for faster movement.
- Add, duplicate, delete, select, group, resize, and reorder layers.
- Click empty space outside the canvas to deselect layers; editing controls preserve the selection.
- Use `Delete` to remove selected layers, `Ctrl + C`/`Ctrl + V` to copy and paste them, `Ctrl + Enter` to center them, and `Ctrl + B` to toggle their backgrounds off or on.
- Per-layer shadows with opacity, angle, and distance controls.
- Manual background removal for selected layers or the complete batch; Close View sources are skipped, including by Ctrl+B.
- Undo and redo.

### Watermarks

- Eight account-specific Saved Watermarks sections.
- 57 bundled PNG templates, including eight Elite templates, available to every clone of the repository.
- Upload, rename, select, disable, and delete personal watermark templates.
- Apply watermark changes only to the selected left-side image or Ctrl/Command-selected images.
- Press `Ctrl + Alt + A` to select the complete batch and apply the active watermark template to every selected image.
- Resize the active image smoothly in 1% mouse-wheel steps, or hold Shift for faster 5% steps.
- Read or enter the current 10–300% image size in the number field beside the Image Size slider.
- Watermark opacity defaults to 100%.

### Listing workflow

- Select an eBay account and product material.
- Import resolved CPIS metadata through **Import CPIS JSON** or `window.PhotoStudioIntegration`; metadata takes priority over filenames.
- Detect `DB`, `PB`, `DPB`, `DT`, `PT`, `DPT`, `DTB`, `PTB`, and `DPTB` filename codes. `Full Set` (also `Full_Set`, `Full-Set`, and `FullSet`) is an alias for `DPTB` and follows its material-specific Main template rules.
- Support DOPT/DOPB as shared image types and `main`, `unmain`, `cv`, `io`, and `numbered` subtypes. Only primary `main` images use Main/Passenger templates; all other roles use Normal unless CPIS supplies an explicit template choice.
- Select Main, Passenger Side, or Normal templates automatically.
- Apply Workflow creates an additional editable Normal-template image for each DT/DB main source, named with ` unmain` before the extension (for example, `DB unmain.jpg`). Originals keep their templates. The review shows planned copies, and repeated runs reuse existing copies. PT and Full Set do not generate unmain copies.
- After Apply Workflow, all images assigned a Normal template appear below the other images. Order within each group, the active image, and multi-image selection are preserved.
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
- Export the complete batch as a browser-generated ZIP containing `Main/` and `unmain/`. Images assigned Normal templates go in `unmain/`; all other images go in `Main/`. This follows the current template, including manual changes, rather than the filename or subtype. Both folders are included even when one is empty.
- Batch ZIP names match the applied template's account folder, such as `Elite.zip`, `DIY.zip`, or `US Auto Nation.zip`. Mixed accounts use their folder names joined with ` + `; batches without an assigned template keep `photo-studio-batch.zip`.
- Export prepared eBay listing images with the header's current-image or Export Batch controls.

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
| `styles.css` | Base editor styling. |
| `viewport.css` | Final responsive layout and Listing UI styling. |
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

Bundled watermark templates are stored in the repository and work on every system.

After adding or replacing bundled PNGs, update the library entries in `script.js` and run `node scripts/build-watermark-assets.cjs`.

## Technical notes

- Canvas rendering uses the real export dimensions while CSS fits the preview to the browser viewport.
- ZIP files are generated locally without a third-party archive library.
- Smart product separation is optimized for clean or gently graded marketplace backgrounds. Difficult scenes use a non-destructive full-image fallback marked **Review fit**.
- No uploaded product images leave the browser.
- Close View images are centered at native pixel size on the configured output canvas; 100% means one source pixel per output pixel. They are exempt from safe-area fitting and the 50px inset so that their original size and background are preserved. A source larger than the output canvas can extend beyond its edges; increase the output dimensions when needed. Manual enlargement is available, but shrinking below 100% and background removal are blocked for Close View sources and their layer/batch copies.

## Validation

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
