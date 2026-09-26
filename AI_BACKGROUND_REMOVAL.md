# AI background removal — September 27, 2026

## Behavior

**Remove BG**, **Ctrl+B** and **Remove All BG** now use IS-Net general-use semantic segmentation, followed by an image-guided alpha matte and local edge-color cleanup. Unlike the previous border-color method, product detection is not decided by whether a pixel resembles a corner color. The output retains the source resolution and fractional edge opacity; the product image itself is not blurred or downsampled.

Processing runs in a browser Web Worker using ONNX Runtime Web. Uploaded photos and masks stay on the device. No API key, Python backend or image-upload service is required. This is an independent implementation, not Photoshop's proprietary engine, and automatic segmentation can still make mistakes on difficult photographs.

- Backgrounds stay intact by default. Apply Workflow uses its existing sizing analysis and calculations, unchanged.
- Manual removal after Apply Workflow uses the new AI mask, not the old fitting mask. Its scale, center, rotation and position remain unchanged.
- Close View and text layers are excluded. Already-transparent images with a substantially transparent perimeter retain their existing alpha, including translucent details.
- Clicking again or Ctrl+B restores the original source. Completed cutouts are reused, without cumulative erosion.
- Layer duplication, clipboard paste, batch duplication and generated unmain compositions retain completed cutouts. Prepared duplicates keep access to the full source for inference and preserve details beyond the older sizing bounds.
- Progress shows model download and layer count. Cancel/Escape keeps the whole selection unchanged. A failed batch also keeps all images unchanged; errors are reported rather than silently using the old heuristic.
- A successful selection/batch operation is one Undo step. Other editor actions and exports are unavailable while its modal is open.

## Downloads and storage

First use downloads a **178,648,008-byte (~170 MiB) model**, plus the pinned ONNX runtime assets. The model is SHA-256 checked and cached in the `photo-studio-ai` IndexedDB database under its content hash. The runtime uses normal browser/CDN caching. Clearing site data, changing origin, private browsing or insufficient storage may require another download; fully offline cold starts are not guaranteed.

The app remains static with no build step. Use a current Chromium browser and preferably `http://localhost:8000` or HTTPS. Direct `file://` use was also tested in Edge. Model downloads need access to Hugging Face and its file CDN; runtime downloads use jsDelivr. Deployments with CSP need to allow these resources and blob workers. An unavailable download leaves images unchanged and can be retried.

CPU inference can take tens of seconds per new photo and needs substantial memory. On the development machine, the two 1576 × 1576 sample photos took about 18–30 seconds each including preparation/refinement (the first run used a local model download). Batch work is sequential to limit peak memory; cancel terminates the worker. No model weights or private test photos are committed to Git.

## Pinned dependencies / attribution

| Component | Source / license |
| --- | --- |
| IS-Net / DIS, Xuebin Qin et al., ECCV 2022 | [Original project](https://github.com/xuebinqin/DIS), [Apache-2.0 license](https://github.com/xuebinqin/DIS/blob/main/LICENSE.md). |
| IS-Net general-use ONNX export | [rembg release](https://github.com/danielgatis/rembg/releases/download/v0.0.0/isnet-general-use.onnx), [normalization reference](https://github.com/danielgatis/rembg/blob/main/rembg/sessions/dis_general_use.py). |
| Browser-download mirror, identical bytes verified against rembg | [Pinned model revision](https://huggingface.co/skillsafe-ai/isnet-general-use/tree/63a3042f10276918a44e1a3f397440a7107ee398). SHA-256: `60920e99c45464f2ba57bee2ad08c919a52bbf852739e96947fbb4358c0d964a`. |
| ONNX Runtime Web 1.22.0 | [Microsoft runtime](https://github.com/microsoft/onnxruntime/tree/v1.22.0/js/web), [MIT license](https://github.com/microsoft/onnxruntime/blob/v1.22.0/LICENSE). Loaded lazily from the versioned jsDelivr distribution. |

`background-removal.js` contains model loading, cache, worker lifecycle, inference and matting. `script.js` manages selection, progress, atomic commits, history, rendering and prepared copies. The old `createBackgroundRemovedSource` helper remains for legacy state and deterministic tests; new manual actions do not fall back to it on AI failure.

## Validation

- Actual IS-Net inference was run on the user's `9.jpg` and `FullSet.jpg` seat-cover photos, without uploading them. Transparent PNGs and dark-background composites were inspected at source resolution. All four seat-cover pieces remain visible; the initial raw-model white fringe is reduced by matte refinement. These are visual spot checks, not an accuracy benchmark or a guarantee for every photo.
- `tests/ai-background.browser.cjs` exercises actual inference, original resolution, fractional alpha, stable geometry, restore/reuse, Undo/Redo and prepared copies. Pass photo paths as CLI arguments. Optional `AI_MODEL_PATH` serves the same verified model locally to avoid repeated downloads during tests; runtime code still runs unmodified.
- `tests/background-async.browser.cjs` uses a deferred fake inference result to exercise cancellation, failure on a later batch layer, atomic history, shortcut blocking, cache reuse and copy/paste.
- `tests/background-worker.browser.cjs` checks the actual worker's transparent-PNG preservation, cancellation, download failure and restart without model mocks.
- Existing editor-state and geometry suites use `tests/background-fixture.cjs` for deterministic masks and await completed actions. They do not measure neural segmentation quality. Existing heuristic edge tests continue to cover the unchanged Listing fitting analysis and legacy helper.
- The pinned public model URL was checked from the browser with a real cross-origin range request (HTTP 206, expected bytes), in addition to local model tests and runtime downloads.

Completed: **336 checks** across AI photo smoke (16), async state (16), worker lifecycle (7), background toggle (17), layer layout (31), history (59), Listing preparation (30, including 1,368 placement cases), scale/legacy edges (31), subject/legacy edges (23), workspace/text (82), and legacy smoothing (24). JavaScript syntax and Git whitespace checks also passed. Test photos and output composites stay outside the repository.
