# Photo Studio workspace update handoff

Status: implemented and browser-verified on 2026-09-26, following the user's confirmation to implement now.

Requested: 2026-09-26. Revised after user review to use three exclusive icon-selected tool sections directly beneath Layers without separate cards, combine Image Size/Shadow/Background, stack Resize below Image Size, show accounts two per row without arrows, move templates below all accounts, move icon-only view controls to the image corner, and return the header to one line. Layers has simplified actions, downloads/format are in the header, and canvas group centering and relative layer alignment replace Movement Lock.

The first workspace implementation is preserved at [`39121d4`](https://github.com/MoStafaMTP/Photo-Studio/commit/39121d4271b1e61b248e82767832da4606add81b).

Pre-update checkpoint: [`4052c728fc8e94aebaa63d66da863c6f2c6b6712`](https://github.com/MoStafaMTP/Photo-Studio/commit/4052c728fc8e94aebaa63d66da863c6f2c6b6712), including refined cutout edges and the original-background toggle. The existing Phase 1, Phase 1.1 and Phase 1.2 handoffs remain available. This document preserves the requested scope and records the implemented workspace/text-layer update. No new phase number was assigned.

## 1. Two workspace views

Provide a view system inspired by Photoroom's Batch section, with these two modes:

| View | Required behavior |
| --- | --- |
| **Full Screen View** | The current Photo Studio editing view, with the main canvas, left-side images and right-side tools. |
| **Grid View** | Show the same images from the Left Side as larger previews in a grid layout. |

“Full Screen View” means the existing editor layout. Browser fullscreen is not part of this request. Full Screen View shows the left sidebar; Grid View hides it. Export current, Export Batch and the format selector live at the right edge of the header and remain visible in both views. View switching uses icons with tooltips and accessible names at the canvas bottom-right; in Grid View the same controls stay at the grid area bottom-right. These controls do not handle canvas drag/wheel gestures and are excluded from image exports.

The view switch must operate on the existing project images. Current edits, layer arrangements, image order, selected images, watermark assignments and Undo/Redo history must survive switching views. Grid previews must show each image's latest rendered composition, including layers, text, background and watermark.

Retain current batch selection behavior in the grid: single-image selection, Ctrl/Command multi-selection and Ctrl+Alt+A to select all. Existing selected-image watermark targeting and image duplicate/delete/export actions must remain available. The grid should scroll within the workspace when the batch is large.

## 2. Right-side sections

Keep **Layers** fixed at the top of the Right Side and always open. Its controls and layer list must remain accessible while the tools below scroll; a long layer list may scroll within its own area.

The top action row contains Add images, Select all, Clear, Duplicate and Delete (the last two are icons). It wraps within the same action group on mobile. Smaller, Bigger and Side By Side actions are removed. Image Size and scrolling remain available for scaling. The Position group no longer includes Movement Lock; its vertical-center icon moves the selected layers as one group to the canvas midpoint, preserving horizontal positions, sizes and relative spacing. Unselected layers stay in place, and the action supports Undo/Redo. Shift-drag still constrains motion to the dominant axis.

A separate **Align selected layers vertically with each other** icon sets every selected layer's vertical center to the selection's current bounding-box midpoint. It keeps horizontal positions and sizes, does not move unselected layers, and works independently of the canvas center. It is disabled with fewer than two selected layers. Undo/Redo restores the individual positions; repeating alignment does not create an empty history step.

An icon rail on the far right selects one of three sections directly below Layers. The section shares the sidebar's white background, without an outer border, rounded card or inset gap:

1. **Image Size & Shadow** (Image Size, Resize Canvas, Shadow and Background)
2. **Saved Watermarks**
3. **Text Editor**

Clicking an icon opens only its panel; clicking the active icon keeps it open. Switching panels preserves editing values, layer selection and each panel's scroll position, without creating an Undo step. Each icon has a tooltip and accessible name. The vertical tablist uses selected-state attributes, associated tabpanels and a single keyboard tab stop; Up/Down, Home and End select tabs without triggering image movement.

Image Size & Shadow starts open. Selecting a different text layer opens Text Editor exclusively. Users can then switch to Image Size & Shadow to adjust that text layer without the panel switching back on every edit.

### Image Size & Shadow

- Include the existing Image Size slider and numeric percentage field.
- Place **Resize Canvas** underneath the Image Size controls inside this panel.
- Preserve the distinction between Image Size (selected layer scale) and Resize (output canvas width/height in pixels).
- Keep Shadow as a distinct control group within the combined panel, with the existing controls: enable/disable, opacity/intensity, angle and distance.
- Move **Background** out of the header and into this panel below Shadow. Preserve None/Color, the color picker, Remove BG and Remove All BG, including their existing selection, history and background-toggle behavior.
- Retain current per-layer behavior, group scaling and default 80% intensity when adding a shadow.
- Keep the controls readable and responsive; stack adjacent controls at narrow widths if needed.

### Saved Watermarks

- Show two accounts per row, without dropdown arrows, in this order: US Auto Nation / DIY; US Auto Seat Cover / Master; US Auto Seat Factory / Premium; DSA eBay / Elite. Keep this pairing on narrow screens and allow long account names to wrap.
- Clicking an eBay account opens its templates and related options **below the complete account list**.
- Use this inline expansion in place of the previous template panel that appears to the left on hover.
- Selecting a template keeps the existing rule: apply it only to the selected batch images.
- Retain bundled defaults, personal uploads, previews, rename/delete controls for personal templates, watermark disabling and opacity settings.
- Preserve the current account names and account-specific templates, including the DSA eBay exception.

Account order retains the previous row-reading order: US Auto Nation, DIY, US Auto Seat Cover, Master, US Auto Seat Factory, Premium, DSA eBay, Elite. Each now occupies a separate line.

A shared two-column template grid appears below all eight accounts, with the selected account name and upload control. Clicking another account replaces the templates in this same area without moving any account row. Clicking the open account again collapses the panel.

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
- `workspace-ui.css` is loaded after the existing stylesheets. Grid rows preserve their content height for large batches; the grid and left-side image list scroll independently. Layers has its own bounded list and stays above the scrolling active panel. The icon rail remains beside both areas. On narrow mobile screens, the tools stack below the workspace. Header exports remain accessible while the workspace/tools scroll; Grid View also hides the compact mobile sidebar.
- `showSidebarSection()` in `workspace-ui.js` manages exclusive panel visibility, accessible selection, focus and panel scroll restoration. Text selection uses this same function. Existing control nodes are moved into the panels so their event handlers and shared editor state stay intact.
- `text-layers.js` owns structured `type: 'text'` layer data, canvas text layout/rendering, font readiness and Text Editor controls. A text layer is not permanently rasterized. It uses the shared position/rotation/flip/scale/shadow fields and existing layer bounds, grouping, ordering, history and deletion rules.
- Duplication, copy/paste, batch duplication and generated unmain copies preserve text data with independent IDs. Image-asset loading and background removal skip text layers. Text can remain as the final layer after deleting the original image layer.
- The header stays on one line. The export format and both download buttons are direct header children, outside the horizontally scrollable editing tools. Export labels collapse to accessible icons on narrow screens; the format selector stays visible. The old floating dock and its resize observer are removed. Grid View reserves bottom space only for the view controls, hides the sidebar and expands into the freed space. Resize is below Image Size and controls canvas dimensions; Image Size controls the selected layer's percentage scale.
- Movement Lock is removed from the DOM, movement handlers and history settings. Vertical centering reuses `centerSelectedLayerEntities('y')`, which translates the selection by a common offset without scaling or changing internal arrangement.
- `alignSelectedLayerCentersVertically()` uses the selection bounds before editing to give all selected layers a shared vertical center. It preserves each layer's horizontal center and routes changes through the existing layer-position and history helpers.
- Personal watermarks still persist in IndexedDB. Uploaded images, text layers, view state and Undo/Redo are session state, consistent with the existing editor; this update does not add project-file persistence across reloads.

Load order is `text-layers.js`, `script.js`, `workspace-ui.js`, then `editor-history.js` after the existing watermark/metadata modules. Text functions are initialized before the renderer, but their controls are assembled after the main editor DOM exists.

## Validation

The latest sidebar/alignment revision passed 76 workspace browser checks with no uncaught browser errors. These verify sections directly beneath Layers without cards, paired watermark accounts without arrows on desktop/mobile, selection-relative vertical alignment and its no-op/Undo/Redo behavior, canvas group centering, simplified layer actions, exclusive panels, keyboard navigation, Background controls, text-layer panel switching, header exports, templates below all accounts, Grid View sidebar hiding, desktop/mobile scroll visibility, a downloaded Grid View ZIP, and view-control gesture isolation. Earlier revisions passed 127 workspace/history checks, 78 workspace/background checks and the initial 220 checks across six suites. The other suite results in the table are historical validations, not reruns for this latest change:

| Suite | Checks | Coverage |
| --- | ---: | --- |
| `tests/workspace-text.browser.cjs` | 76 | Seamless sections below Layers, paired watermark accounts without arrows, relative alignment and canvas group centering with history, simplified layer actions, exclusive icon panels, header exports, Background controls, real view/account/text interactions, keyboard navigation, text history/transforms/copies, image-only background removal, workflow/unmain preservation, font fallback, individual JPG/PNG/WebP pixels, a downloaded Elite ZIP, fixed Layers and a 35-image scrolling batch. |
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
- [x] Three icons select Image Size & Shadow, Saved Watermarks or Text Editor; only one section is visible, directly below Layers without a separate card.
- [x] Resize is below Image Size; Shadow and Background are separate groups in the same panel, with all controls preserved and Background removed from the header.
- [x] Accounts appear two per row without dropdown arrows; their templates expand below all accounts.
- [x] Icon-only view controls sit at the canvas/grid bottom-right without affecting image gestures.
- [x] Downloads and export format stay visible in the header when Grid View hides the sidebar; the header remains one line.
- [x] Duplicate and Delete sit beside Add images, Select all and Clear; Smaller, Bigger and Side By Side are removed.
- [x] Group vertical centering replaces Movement Lock and preserves size, horizontal position and spacing, with Undo/Redo support.
- [x] An additional relative-alignment icon gives selected layers a shared vertical center at their current location, with Undo/Redo support.
- [x] Text can be added, edited, styled and manipulated as a true layer.
- [x] Text input shortcuts do not accidentally trigger destructive layer actions.
- [x] Text, fonts and styling match across previews and all export formats.
- [x] Existing background, Listing, watermark, selection, duplication and history regressions pass.

The pre-update Git checkpoint remains available for comparison or restoration; historical Phase 1/1.1 archives are unchanged.
