# Canon RAW image import

Implemented September 27, 2026. Photo Studio accepts **CR2 and CR3** alongside JPG, PNG and WebP through the main upload picker, canvas drop area, Layers picker/drop area and CPIS `importImages` API. Mixed batches are supported, including RAW files with an empty or generic MIME type and mixed-case extensions.

## Editor behavior

- A local LibRaw worker develops the sensor image at full resolution with camera white balance, camera orientation and sRGB output. It produces an 8-bit PNG for the existing canvas editor; it does not substitute the embedded JPEG thumbnail. The developed colors can differ from Canon's own JPEG rendering.
- Original File objects and filenames remain attached to the image. Decoded pixels are cached separately for previews, copies, clipboard paste, added layers, generated DT/DB unmain outputs and Undo/Redo. Repeated copies do not develop the RAW file again.
- Backgrounds remain intact on upload and during the default Listing workflow. The existing fit, scale and safe-area logic is unchanged. Close Views keep their native pixel size and remain excluded from background removal.
- Remove BG, Ctrl+B and Remove All BG use the same AI pipeline as raster uploads. Removal/restoration keeps layer size and placement unchanged. The original developed photo is retained for restoration.
- JPG, PNG and WebP exports use the configured canvas size and existing ZIP routing. Output filenames retain the source stem and take the chosen extension: `DT.CR3` becomes `DT.jpg`, for example. RAW files are import sources; the editor exports raster images.

## Progress, cancellation and failures

The **Opening RAW images** dialog identifies the current file and processing stage. Cancel or Escape stops the worker and leaves that import uncommitted. Decoding happens sequentially off the main thread; the worker is released after the import. Large sensor images take more time and memory than ordinary JPEGs.

In normal uploads, valid files from a mixed batch are added together and damaged/unsupported files are named in the status area. A failed RAW file does not create a broken thumbnail. In CPIS imports, RAW decoding and metadata validation both complete before any files/context are committed; a canceled or failed RAW import rejects the Promise and leaves the editor unchanged.

Supported Canon variants follow LibRaw 0.22.1. A new/unsupported camera encoding or damaged source reports a decoding error. This is not a RAW exposure/development control panel.

## Runtime and deployment

`image-import.js` is loaded before `script.js`. The bundled `vendor/libraw/raw-runtime.js` is loaded lazily only for RAW imports. Keep the complete `vendor/libraw/` directory when copying/deploying the project. No RAW conversion server, external decoder download, build step or cross-origin isolation headers are required. Photos stay in the browser, and RAW import works offline after the application files are available.

Background removal retains its separate existing model/runtime requirements described in [AI_BACKGROUND_REMOVAL.md](AI_BACKGROUND_REMOVAL.md). The first AI removal still requires those assets; bundling the RAW decoder does not bundle the AI model.

See [vendor/libraw/NOTICE.md](vendor/libraw/NOTICE.md) for pinned source, licenses, integrity hashes and regeneration instructions. Generated images, original uploads and their decoded cache are session state, not saved across reloads.

## Validation

Three focused browser suites use real RAW files stored outside the repository:

| Suite | Checks | Coverage |
| --- | ---: | --- |
| `tests/raw-import.browser.cjs` | 12 | Offline full-resolution CR2/CR3 development, both pickers, native dimensions and names, history, copies/layers/paste, generated unmain images, JPG/PNG/WebP exports, deterministic background toggle/geometry and damaged input. |
| `tests/raw-controls.browser.cjs` | 8 | Plain HTTP without isolation, cancellation during decoder loading, both drop targets, MIME/extension variations, mixed failures, atomic CPIS failures, resolved metadata precedence and portrait orientation. |
| `tests/raw-ai.browser.cjs` | 4 | Real IS-Net removal and restoration on both decoded RAW sources, full-resolution soft alpha and unchanged layer geometry. This suite uses the actual AI model. |

Real decoded photos and the CR3 cutout were visually inspected. The two tested files developed to 1944 × 1296 and 6024 × 4020 pixels. Successful model outputs include opaque subject pixels, transparent background pixels and fractional edge alpha. These checks verify the import/removal path, not every camera model or scene.

Existing history (59), layer layout (31), workspace/text (82), Listing/unmain (39), preparation (30) and metadata (8) checks also passed: **273 checks in total** for this update. Preparation includes 1,368 placement cases; background masks in geometry/state suites are deterministic fixtures, separate from the actual AI suite above. JavaScript syntax and `git diff --check` passed.

Repeat with Playwright available (optional `PLAYWRIGHT_MODULE` and `BROWSER_EXECUTABLE` paths select existing installations):

```powershell
node tests/raw-import.browser.cjs C:\fixtures\sample.CR2 C:\fixtures\sample.CR3
node tests/raw-controls.browser.cjs C:\fixtures\sample.CR2
node tests/raw-ai.browser.cjs C:\fixtures\sample.CR2 C:\fixtures\sample.CR3
```

The AI suite can reuse the verified model from `AI_MODEL_PATH`; otherwise the application downloads it normally. The controls suite expects a CR2 with a standard TIFF orientation tag, such as the first fixture below, so it can also test a portrait variant.

Public validation sources (not bundled):

- Canon 40D sRAW: [rawpy RAW_CANON_40D_SRAW_V103.CR2](https://github.com/letmaik/rawpy/blob/main/test/RAW_CANON_40D_SRAW_V103.CR2).
- Canon EOS M50 CRAW: [raw.pixls.us sample 2663](https://raw.pixls.us/getfile.php/2663/nice/Canon%20-%20EOS%20M50%20-%20CRAW%20(3%3A2).CR3), listed as CC0 by raw.pixls.us. SHA-256: `15384b775867ec4c42b11882837f1e368cedc0561832ffab271221e6bb80be4c`.
