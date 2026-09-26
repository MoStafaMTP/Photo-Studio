# Bundled Canon RAW decoder

`raw-runtime.js` packages the single-threaded WebAssembly runtime from **@colorhythm/libraw-wasm 1.1.1**, built with **LibRaw 0.22.1**. It is loaded only when a Canon RAW file is opened. The application needs no package installation or external decoder service.

## Licenses and corresponding source

- The JavaScript wrapper is MIT licensed; see `LICENSE.wrapper` for its copyright notice and license.
- LibRaw is Copyright (C) 2008–2025 LibRaw LLC and includes the additional contributors identified in `COPYRIGHT`. LibRaw is offered under LGPL 2.1 or CDDL 1.0. This bundle distributes LibRaw under **CDDL 1.0**; `LICENSE.CDDL`, `LICENSE.LGPL` and `COPYRIGHT` are retained alongside it.
- The exact upstream package source and build instructions are available at [colorhythm/libraw-wasm commit 9b0f59a5](https://github.com/colorhythm/libraw-wasm/tree/9b0f59a5e0f6d3d12a8f6fa594015ef4f30a6e95).
- The corresponding native LibRaw source is [LibRaw commit b860248a](https://github.com/LibRaw/LibRaw/tree/b860248a89d9082b8e0a1e202e516f46af9adb29). The package's [build script at the pinned commit](https://github.com/colorhythm/libraw-wasm/blob/9b0f59a5e0f6d3d12a8f6fa594015ef4f30a6e95/packages/libraw.wasm/scripts/build.mjs) supplies its C API additions, configuration and Emscripten compilation steps. These links provide the corresponding source and modifications for the distributed binary.

## Reproduction and local changes

From the repository root, run `node scripts/build-raw-decoder.cjs` with a modern Node.js version and an internet connection. The script retrieves the pinned npm distribution and checks the following SHA-256 digests (base64) before generating the runtime:

| Upstream asset | SHA-256 |
| --- | --- |
| `dist/libraw.mjs` | `rF5lTgII2DN90x71sVEY8hqeTEsM6W0FjtYyQeiJk0o=` |
| `dist/libraw.wasm` | `xMuXp+Q3LaQaH/bsbhFG843rEltzO4u7LpxScnlTq6g=` |

Photo Studio leaves the WASM binary unchanged. Its build script changes the JavaScript delivery wrapper from an ES module to a classic script, replaces `import.meta.url` with the worker location and embeds the WASM bytes as base64. `image-import.js` sends that factory and binary to a dedicated worker. This allows use from both `file://` and ordinary HTTP without cross-origin isolation headers. The generated file is approximately 1.2 MB; the unchanged WASM binary is 853,083 bytes.

Retain this notice and the accompanying license/copyright files when redistributing the application.
