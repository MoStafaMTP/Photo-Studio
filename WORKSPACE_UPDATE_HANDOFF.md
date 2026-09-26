# Photo Studio workspace update handoff

Status: implemented and browser-verified on 2026-09-26, following the user's confirmation to implement now.

Requested: 2026-09-26.

Pre-update checkpoint: [`4052c728fc8e94aebaa63d66da863c6f2c6b6712`](https://github.com/MoStafaMTP/Photo-Studio/commit/4052c728fc8e94aebaa63d66da863c6f2c6b6712), including refined cutout edges and the original-background toggle. The existing Phase 1, Phase 1.1 and Phase 1.2 handoffs remain available. This document preserves the requested scope and records the implemented workspace/text-layer update. No new phase number was assigned.

## 1. Two workspace views

Provide a view system inspired by Photoroom's Batch section, with these two modes:

| View | Required behavior |
| --- | --- |
| **Full Screen View** | The current Photo Studio editing view, with the main canvas, left-side images and right-side tools. |
| **Grid View** | Show the same images from the Left Side as larger previews in a grid layout. |

“Full Screen View” means the existing editor layout. Browser fullscreen is not part of this request.

The view switch must operate on the existing project images. Current edits, layer arrangements, image order, selected images, watermark assignments and Undo/Redo history must survive switching views. Grid previews must show each image's latest rendered composition, including layers, text, background and watermark.

Retain current batch selection behavior in the grid: single-image selection, Ctrl/Command multi-selection and Ctrl+Alt+A to select all. Existing selected-image watermark targeting and image duplicate/delete/export actions must remain available. The grid should scroll within the workspace when the batch is large.

## 2. Right-side sections

Keep **Layers** fixed at the top of the Right Side and always open. Its controls and layer list must remain accessible while the tools below scroll; a long layer list may scroll within its own area.

Below Layers, provide three expandable sections in this order:

1. **Image Size, Shadow**
2. **Saved Watermarks**
3. **Text Editor**

Clicking a section header opens its contents; clicking again can collapse it. Opening or closing a section must preserve all editing values and layer selections. Headers must support keyboard operation and expose their expanded/collapsed state.

The request does not specify whether opening one section should close another. The implemented default is independent sections, allowing more than one to stay open. Image Size, Shadow starts open; Saved Watermarks and Text Editor start closed. Selecting a text layer opens Text Editor.

### Image Size, Shadow

- Include the existing Image Size slider and numeric percentage field.
- Move the **Resize** controls from the header into this section, next to Image Size.
- Preserve the distinction between Image Size (selected layer scale) and Resize (output canvas width/height in pixels).
- Include the existing shadow controls: enable/disable, opacity/intensity, angle and distance.
- Retain current per-layer behavior, group scaling and default 80% intensity when adding a shadow.
- Keep the controls readable and responsive; stack adjacent controls at narrow widths if needed.

### Saved Watermarks

- Show the saved watermark accounts in this section.
- Clicking an eBay account opens its templates and related options **underneath that account**.
- Use this inline expansion in place of the previous template panel that appears to the left on hover.
- Selecting a template keeps the existing rule: apply it only to the selected batch images.
- Retain bundled defaults, personal uploads, previews, rename/delete controls for personal templates, watermark disabling and opacity settings.
- Preserve the current account names and account-specific templates, including the DSA eBay exception.

Retain the existing account ordering unless a later design update changes it:

| Left | Right |
| --- | --- |
| US Auto Nation | DIY |
| US Auto Seat Cover | Master |
| US Auto Seat Factory | Premium |
| DSA eBay | Elite |

The expanded account spans both columns and displays a two-column template grid underneath its account button. Clicking the same account again closes it. The panel never covers the canvas or neighboring controls.

### Text Editor

Required capabilities:

- Add text as a **new, editable layer** in the active image.
- Edit the text content after adding it.
- Change font size.
- Change font family.
- Change font style.
- Change text color.
- Provide additional text customization options.

Implemented text controls:

| Control | Implemented behavior |
| --- | --- |
| Content | Editable text and explicit line breaks. |
| Font | Family, size, weight/bold and italic. |
| Decoration | Underline and strikethrough. |
| Layout | Left/center/right alignment, line height and letter spacing. |
| Appearance | Text color and opacity. |
| Effects | Optional outline/stroke and shadow, with editable settings. |

Available families: Arial, Verdana, Tahoma, Georgia, Times New Roman, Courier New, DM Sans, and Space Grotesk. Style controls apply to all selected text layers; content editing is enabled when exactly one text layer is selected.

Text must participate in the existing Layers system: selection, stacking/reordering, positioning, rotation, resizing, grouping, duplicate, copy/paste and deletion. Selecting a text layer should load that layer's settings into Text Editor. Multiple text layers must be independently editable. Text must remain editable after switching views or selecting another image.

Text edits and styling changes must be undoable/redoable. While typing, text-editing keys must edit the text; for example, Delete must not delete the entire layer while its content field has focus. Background removal is an image-only action and must skip text layers.

Text must render consistently in the main canvas, left-side thumbnails, grid previews and individual/batch JPG, PNG and WebP exports. Export waits for font-loading attempts to settle. If an optional web font cannot load, the canvas uses the same system fallback for the preview and download.

## Existing behavior to preserve

- Uploaded and duplicated image layers retain their exact scale, position, background state and independent settings.
- Remove BG and Ctrl+B remain toggles; restoring an original background must not resize or move the product.
- Close View images retain their original background and native-size protections.
- Listing workflows, CPIS metadata precedence, template matching, 50px safe-area spacing and saved-watermark persistence remain functional.
- DSA eBay skips material selection and DT/DB unmain generation, and exports directly into its ZIP without subfolders. Other accounts retain their current export behavior.
- Existing filename handling, latest-state thumbnails, batch selection and Undo/Redo continue to work.

## Implementation notes

- `workspace-ui.js` assembles the shared Full Screen/Grid view switch, sidebar sections and responsive header. Grid cards offer select, edit, duplicate and delete actions; double-click also opens an image in Full Screen View. Ctrl/Command multi-selection and existing batch shortcuts share the original selection state.
- Grid previews use `renderEditorComposition(item)` in `script.js`, the same renderer as the editor and export. A separate cache uses edit-state keys; one dirty image is processed per animation frame, prioritizing the active image. Export, workflow processing and dragging pause preview work. Previews never change active selection or create history steps.
- `workspace-ui.css` is loaded after the existing stylesheets. Grid rows preserve their content height for large batches; the grid and left-side image list scroll independently. Layers has its own bounded list and stays above the scrolling accordion controls. On narrow mobile screens, the tools stack below the workspace.
- `text-layers.js` owns structured `type: 'text'` layer data, canvas text layout/rendering, font readiness and Text Editor controls. A text layer is not permanently rasterized. It uses the shared position/rotation/flip/scale/shadow fields and existing layer bounds, grouping, ordering, history and deletion rules.
- Duplication, copy/paste, batch duplication and generated unmain copies preserve text data with independent IDs. Image-asset loading and background removal skip text layers. Text can remain as the final layer after deleting the original image layer.
- All downloads remain in the header. Resize is in the first sidebar section and controls canvas dimensions; Image Size controls the selected layer's percentage scale.
- Personal watermarks still persist in IndexedDB. Uploaded images, text layers, view state and Undo/Redo are session state, consistent with the existing editor; this update does not add project-file persistence across reloads.

Load order is `text-layers.js`, `script.js`, `workspace-ui.js`, then `editor-history.js` after the existing watermark/metadata modules. Text functions are initialized before the renderer, but their controls are assembled after the main editor DOM exists.

## Validation

All 220 checks passed across these six browser suites, with no uncaught browser errors:

| Suite | Checks | Coverage |
| --- | ---: | --- |
| `tests/workspace-text.browser.cjs` | 47 | Real view/account/text UI interactions, shared selection, keyboard navigation, granular text history, group transforms, text/whole-image copies, image-only background removal, workflow/unmain text preservation, font failure fallback, individual JPG/PNG/WebP pixels, a downloaded Elite ZIP, fixed Layers and a 35-image scrolling batch. |
| `tests/editor-history.browser.cjs` | 59 | Existing whole-session history and all editing paths. |
| `tests/layer-layout.browser.cjs` | 30 | Exact duplicate sizes and preserving compositions across account/template changes. |
| `tests/listing-unmain.browser.cjs` | 39 | Template mapping, generated copies, metadata and real downloads. |
| `tests/listing-dsa.browser.cjs` | 28 | DSA material-free workflow and flat exports. |
| `tests/background-toggle.browser.cjs` | 17 | Original-background restoration, cutout reuse and Close View protection. |

Screenshots were inspected at 1600 × 1000, including Grid View and text editing. Layout checks also cover 1280 × 720 and 390 × 844. Tests use generated images; screenshots/download artifacts stay outside the repository. Syntax validation uses `node --check` on the changed JavaScript modules. Browser suites require Playwright only for testing, with optional `PLAYWRIGHT_MODULE` and `BROWSER_EXECUTABLE` paths.

## Completed acceptance checklist

- [x] Both named views are available; Grid View shows larger previews of the same batch.
- [x] Switching views preserves edits, selection, order and Undo/Redo.
- [x] Grid previews reflect the latest complete image composition.
- [x] Layers stays at the top, remains open and remains usable with long layer/tool lists.
- [x] The three requested sections expand and collapse by click and keyboard.
- [x] Resize is next to Image Size in the first section, with current sizing/shadow behavior preserved.
- [x] Account templates expand inline underneath the clicked account.
- [x] Text can be added, edited, styled and manipulated as a true layer.
- [x] Text input shortcuts do not accidentally trigger destructive layer actions.
- [x] Text, fonts and styling match across previews and all export formats.
- [x] Existing background, Listing, watermark, selection, duplication and history regressions pass.

The pre-update Git checkpoint remains available for comparison or restoration; historical Phase 1/1.1 archives are unchanged.
