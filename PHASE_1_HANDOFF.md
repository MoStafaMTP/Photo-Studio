# Photo Studio — Phase 1 Handoff

**Phase status:** Complete and frozen as the Phase 1 baseline  
**Snapshot date:** September 21, 2026  
**Phase 2 direction:** Workflow and task automation  
**Phase 1 backup:** `C:\Users\Asus\Photo-Studio-Phase-1-Backup-2026-09-21.zip`

## 1. Product summary

Photo Studio is a browser-based image editor for preparing product images individually or in batches. It supports multi-image upload, a square editing canvas, layered image composition, background removal, shadows, reusable watermark libraries, and JPG/PNG/WebP export. Everything runs in the browser with HTML, CSS, and plain JavaScript. There is no build step, server application, framework, or package dependency.

Phase 1 establishes the manual editing workflow. Phase 2 should build automation on top of this baseline without changing the archived Phase 1 copy.

## 2. Current project structure

| Path | Purpose |
| --- | --- |
| `index.html` | Static application shell, upload controls, initial toolbar controls, canvas, and export buttons. |
| `script.js` | Editor state, canvas rendering, layers, transforms, watermarks, background removal, history, and export logic. |
| `styles.css` | Base styling plus the accumulated desktop, editor, and iOS 17 visual treatment. |
| `viewport.css` | Final viewport/layout overrides, fixed editor sizing, sidebar scrolling, header controls, layer UI, and watermark flyout UI. |
| `watermark-assets.js` | 49 default PNG watermark files embedded as base64 data URLs so defaults work from local files and local servers. |
| `VERIFY_PHASE_1.ps1` | PowerShell checksum verification utility for the archived project. |
| `Us Auto Nation/` | Eight source PNG watermark templates. The folder name uses `Us`; the displayed section uses `US`. |
| `US Auto Seat Cover/` | Eight source PNG watermark templates. |
| `US Auto Seat Factory/` | Eight source PNG watermark templates. |
| `DIY/` | Eight source PNG watermark templates. |
| `Master/` | Eight source PNG watermark templates. |
| `Premium/` | Eight source PNG watermark templates. |
| `Elite/` | Empty default watermark category, ready for future templates. |
| `DSA eBay/` | One source PNG watermark template. |
| `PHASE_1_MANIFEST.sha256` | SHA-256 inventory created with the Phase 1 backup. |

The project contains 49 source PNG templates and 49 matching embedded entries in `watermark-assets.js`. The embedded file is deliberately large because it makes the built-in watermark library portable.

## 3. Running the editor

The editor can be opened directly by opening `index.html` in a modern Chromium-based browser. A local web server is recommended for consistent browser storage and download behavior:

```powershell
cd C:\Users\Asus\photoroom-site
python -m http.server 8000
```

Then open `http://localhost:8000/`.

The app uses Google Fonts when network access is available and falls back to system fonts when it is offline. Image editing and default watermark assets do not require an external service.

## 4. Phase 1 defaults

| Setting | Current default |
| --- | --- |
| Output width | 1576 px |
| Output height | 1576 px |
| Canvas aspect ratio | 1:1 |
| Export format | JPG |
| Background mode | Color |
| Background color | White (`#ffffff`) |
| Main image size | 100% |
| Internal gap | 0 px; the old gap controls are hidden |
| Fit implementation | `contain` is currently initialized internally; the fit UI is hidden |
| Watermark | None applied when images are first uploaded |
| Watermark opacity | 100% when a template is applied |
| Watermark position | Fixed and centered; it covers the canvas using cover scaling |
| Shadow | Off |
| New shadow opacity/intensity | 80% |
| Shadow angle | 90° |
| Shadow distance | 18 px |
| Movement lock | Move freely |
| Background removal | Off |

## 5. Interface and layout

- The interface uses an iOS 17-inspired visual style with system fonts, rounded controls, light panels, blue selection states, and compact icon buttons.
- The application fills the browser viewport. The editor shell is constrained to the available screen instead of using the canvas pixel dimensions for layout.
- Browser zoom changes the UI scale while the canvas keeps its intrinsic export dimensions.
- The center workspace uses a square canvas wrapper fitted into the available viewport.
- The left sidebar contains upload controls, uploaded image thumbnails, image count, individual export, and batch export.
- When many batch images are uploaded, the thumbnail list is the scrollable area on desktop; the rest of the editor remains fixed.
- The header contains Undo, Redo, Rotate, Position, BG, Resize, and Export controls.
- The right toolbar contains Layers, Image size, Shadow, and Saved Watermarks.
- Icon-only controls have titles and ARIA labels for their actions.
- On narrow screens, the shell changes to a vertical layout and the canvas and tools remain usable.

## 6. Batch image workflow

- Upload one or many JPG, PNG, or WebP images with the file picker.
- Images can also be dropped onto the canvas area.
- Every uploaded image appears in the left sidebar with its filename and preview.
- The thumbnail preview is regenerated from the current editor canvas after edits, so it reflects the latest visible state of the active image.
- A left-side image can be duplicated. The duplicate preserves its complete editor state, including layers, transforms, background-removal state, shadows, watermark assignment, and layer stacking order.
- A left-side image can be deleted at any time.
- The active image is highlighted. Ctrl-click on Windows/Linux or Command-click on macOS supports multi-selection for watermark scope.

### Watermark scope from the left sidebar

- With zero or one thumbnail selected, watermark template selection, opacity changes, and enable/disable changes apply to **all images in the batch**.
- When two or more thumbnails are Ctrl/Command-selected, those watermark changes apply only to the selected images.
- The selected batch thumbnails use a blue highlight.
- Uploading images does not automatically assign a watermark. A template must first be selected.

## 7. Canvas and image transforms

- The canvas output size can be changed with numeric width and height fields from 64 to 5000 pixels.
- Rotate left and right uses 15-degree steps.
- Horizontal and vertical flip are independent.
- Image size is adjustable from 10% to 300% for the original layer. Added layers support scaling up to 500% through group operations.
- Scrolling over the canvas resizes the current image or selected layer group.
- Holding Shift while scrolling uses a larger resize step.
- Layers can be moved by dragging directly on the canvas.
- Holding Shift while dragging locks movement to the horizontal or vertical direction after the initial direction is detected.
- Arrow keys move selected layers by 1 pixel.
- Shift+Arrow moves selected layers by 10 pixels.
- Position buttons center selected layers horizontally, vertically, or on both axes.
- The movement-lock menu can lock horizontal movement, vertical movement, both axes, or allow free movement.
- Selected layers are shown with blue dashed canvas outlines. These outlines are excluded from exports.

## 8. Layer system

Each batch image has its own independent layer stack.

- The uploaded batch image begins as the `Original` layer.
- Additional JPG, PNG, or WebP images can be added with the Add images button, file picker, or layer drop zone.
- The layer list displays the highest stacking layer at the top.
- Dragging a layer row changes its stacking order on the canvas.
- Layer checkboxes support multi-selection.
- Ctrl/Command-clicking visible layers on the canvas also toggles layer selection.
- Select all and Clear manage the current layer selection.
- Selected layers can be moved and resized as a group while preserving their relative layout.
- Side-by-side automatically scales selected layers if needed and arranges them horizontally with spacing.
- Smaller and Larger change all selected layers as a group.
- Duplicate creates copies offset from their source positions.
- Duplicating a background-removed layer preserves the transparent/background-removed state.
- The original layer can be duplicated into a normal added layer.
- The original layer or any added layer can be deleted as long as at least one layer remains for that batch image.
- Undo can restore a deleted original layer during the current session.

## 9. Shadow controls

Shadow state belongs to each layer rather than to the whole canvas.

- Add Shadow toggles the shadow for all selected layers.
- A newly enabled shadow starts at 80% intensity.
- Shadow intensity ranges from 0% to 100%.
- Shadow angle ranges from 0° to 360° and is stored separately for every layer.
- Shadow distance ranges from 0 to 100 pixels and is stored separately for every layer.
- The renderer uses a fixed blur of 26 canvas pixels and computes X/Y shadow offsets from the selected angle and distance.

## 10. Background controls

- The background mode supports None or Color.
- Phase 1 defaults to Color with white selected.
- The color picker changes the canvas background color and activates Color mode.
- Remove BG operates on the currently selected layer or layers.
- Remove All BG processes the original and every added layer in every batch image.
- Background removal state is preserved when layers or complete batch images are duplicated.
- The current background-removal implementation is local and heuristic. It samples the top-left pixel and makes similar colors transparent with a soft threshold. It works best with simple, uniform backgrounds and is not an AI segmentation model.

## 11. Saved Watermarks

The Saved Watermarks section is arranged in two columns in this order:

| Left | Right |
| --- | --- |
| US Auto Nation | DIY |
| US Auto Seat Cover | Master |
| US Auto Seat Factory | Premium |
| DSA eBay | Elite |

Hovering or clicking a section opens its template flyout beside the Saved Watermarks panel. Templates are displayed two per row.

### Bundled templates

| Section | Built-in templates |
| --- | ---: |
| US Auto Nation | 8 |
| US Auto Seat Cover | 8 |
| US Auto Seat Factory | 8 |
| DIY | 8 |
| Master | 8 |
| Premium | 8 |
| Elite | 0 |
| DSA eBay | 1 |
| **Total** | **49** |

Built-in templates are read-only and available to anyone who has the project because they are stored both in the project folders and in `watermark-assets.js`.

### Personal templates

- The plus button uploads one or multiple custom image watermarks into the active section.
- Personal templates can be renamed.
- Personal templates can be deleted.
- Personal templates are saved in the browser's IndexedDB database named `photo-studio-assets`, object store `assets`.
- Personal templates persist across reloads on the same browser profile.
- IndexedDB data is browser-local and is not part of the source folder or Phase 1 ZIP. Moving the project to another computer transfers all bundled defaults but not personal templates uploaded through the UI.

### Watermark rendering

- Watermarks are assigned independently to each batch image.
- A selected watermark is fixed at the center and cover-scaled so it fills the complete output canvas.
- Watermark opacity defaults to 100% and can be adjusted.
- The eye control disables or enables assigned watermarks without deleting their template assignments.
- New images begin with no watermark assigned.

## 12. Undo, redo, and reset

- Undo is available through the header button or Ctrl/Command+Z.
- Redo is available through the header button or Ctrl/Command+Y.
- The in-memory history holds up to 50 snapshots.
- History covers the active image state and the shared canvas controls captured by the editor.
- Keyboard movement and wheel scaling are grouped to avoid creating a snapshot for every low-level event.
- Duplicating or removing complete batch images clears the current undo/redo stacks.
- Reset current image restores its base transform, shadow defaults, 1576×1576 output fields, hidden gap value, and background-removal state, and removes the active image's watermark assignment.
- Project state and undo history are not persisted after the page closes.

## 13. Export behavior

- Supported formats are JPG, PNG, and WebP.
- JPG is selected by default and is encoded at 92% quality.
- Export current downloads the active image as a single file.
- Export Batch renders every batch image and creates `photo-studio-batch.zip` entirely in the browser.
- The ZIP writer stores each image as an individual entry and does not depend on a third-party ZIP library.
- Export names use the original display name plus `-photo-studio` and the selected extension.
- Characters invalid in Windows filenames are replaced.
- Canvas selection outlines and editing handles are not exported.
- JPG export always receives an opaque background because JPEG does not support transparency.
- The default white Color background makes all formats opaque until the user chooses None.
- With None selected, PNG can preserve transparency. WebP receives white when background removal is active on the original image.

## 14. State and implementation model

- `files` is the in-memory batch. Each item contains its source file/image, transform values, background-removal cache, layer stack, layer order, shadow settings, and per-image watermark state.
- `activeIndex` identifies the batch image currently displayed on the canvas.
- `selectedBatchImageIds` controls multi-image watermark targeting.
- `selectedLayerIds` controls layer operations inside the active batch image.
- Each added layer has independent position, scale, rotation, horizontal/vertical flip, background-removal cache, shadow intensity, shadow angle, and shadow distance.
- Canvas rendering order is background, ordered image layers, and then the watermark.
- The visible canvas uses its true output width and height. CSS scales it to fit the available square workspace.
- Object URLs are used for uploaded images and are revoked when batch images are removed.
- Default watermarks resolve from `watermark-assets.js` first, with project-relative files as a fallback.

## 15. Phase 1 limitations and cautions

- There is no backend, login, cloud storage, database server, or multi-device synchronization.
- Uploaded images, edits, layers, batch state, and undo history exist only in memory and are lost when the page closes or reloads.
- Only personal watermark templates persist, and they persist only in IndexedDB on the same browser profile.
- Background removal is color-based and may remove foreground pixels when their colors resemble the sampled corner background.
- Background color and output dimensions are shared canvas controls rather than per-image settings.
- Watermark changes are per-image, but watermark assignments are not currently part of a durable project file.
- Undo coverage is strongest for transforms, layers, shadows, canvas settings, and background removal. Watermark library selection and all batch-wide operations are not consistently represented as one reversible history transaction.
- The JavaScript is currently a single large file, and the CSS uses layered override blocks. Phase 2 work should consider modularizing state, rendering, commands, persistence, and workflow automation before adding many new features.
- There is no checked-in automated test suite. Phase 1 was validated with syntax checks and temporary headless-browser interaction checks.
- The embedded watermark asset file increases repository and download size but keeps the default library portable.

## 16. Validation completed at the Phase 1 boundary

- `node --check script.js`
- `node --check watermark-assets.js`
- Headless Chromium startup check against the local project.
- Browser interaction checks for JPG default export, no watermark on initial upload, watermark scope across all images and Ctrl-selected images, white Color background default, layer deletion, and the one-layer minimum guard.
- Default watermark inventory confirmed: 49 PNG files and 49 embedded data URLs.
- Phase 1 backup archive extraction and SHA-256 manifest verification should be completed when the archive is created.

## 17. Suggested Phase 2 starting points

Phase 2 is intended to focus on automation. The current design can support that work, but the first automation changes should establish clear commands and persistent project data.

Recommended sequence:

1. Define reusable workflow presets containing output size, background, transformations, background removal, shadow settings, watermark section/template, opacity, and export format.
2. Add an explicit Apply workflow action that can target all images, selected batch images, or selected layers.
3. Create project save/load using a versioned JSON schema plus referenced image assets, or a packaged project ZIP.
4. Move editor operations into command functions so manual UI actions and automated workflows use the same code path.
5. Add a queued batch processor with progress, cancellation, per-file errors, and retry behavior.
6. Add filename rules, output folder structures, and export presets.
7. Add tests for data migration, transform rendering, background rules, watermark targeting, layer order, and batch export.
8. Split `script.js` into state, rendering, history, watermark storage, automation, and export modules after browser support requirements are confirmed.

## 18. Backup and restore procedure

The Phase 1 ZIP is a frozen copy of the complete project source, bundled watermark folders, embedded watermark assets, this handoff, and the checksum manifest.

To restore:

1. Keep the ZIP unchanged as the archival copy.
2. Extract it into a new folder.
3. Confirm that `index.html`, both CSS files, both JavaScript files, all eight watermark folders, this handoff, and `PHASE_1_MANIFEST.sha256` are present.
4. Run `powershell -ExecutionPolicy Bypass -File .\VERIFY_PHASE_1.ps1` from the restored project folder.
5. Open `index.html` directly or serve the restored folder locally.

Continue Phase 2 work in the active `C:\Users\Asus\photoroom-site` folder. Do not modify the Phase 1 ZIP; create a new Phase 2 backup at the next milestone.
