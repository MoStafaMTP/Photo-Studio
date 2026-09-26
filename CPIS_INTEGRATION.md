# CPIS metadata integration

CPIS owns image classification, shared-component assignment, product color, and listing/composite membership. Photo Studio validates supplied metadata, chooses an existing account template, and runs its existing editor/processing/export engine. It does not expand shared components into listings or build composites.

## Payload

```json
{
  "schemaVersion": 1,
  "account": "US Auto Nation",
  "material": "Genuine Leather Perf",
  "color": "Ebony",
  "images": [
    {"filename": "DT.jpg", "variation": "DT", "subtype": "main"},
    {"filename": "DOPTcv.jpg", "variation": "DOPT", "subtype": "cv"},
    {"filename": "DOPBio.jpg", "variation": "DOPB", "subtype": "io"},
    {"filename": "DT unmain.jpg", "variation": "DT", "subtype": "unmain"}
  ]
}
```

`schemaVersion` defaults to 1. Account, material, and a non-empty images array are required; color is optional. Every image must include filename, variation, and subtype. Codes are case-insensitive and normalized. Unknown or missing values are rejected; they never trigger filename guessing.

Primary variation codes: `DT`, `DB`, `PT`, `PB`, `DPT`, `DPB`, `DTB`, `PTB`, `DPTB` (Full Set).

Shared image codes: `DOPT` (Driver OR Passenger Top), `DOPB` (Driver OR Passenger Bottom). These remain `kind: "shared"`, not primary variations. CPIS decides their listing membership: DOPT can support DT/PT/DPT/DTB/PTB/DPTB; DOPB can support DB/PB/DPB/DTB/PTB/DPTB. Photo Studio does not compute or expand those memberships.

Subtypes: `main`, `unmain`, `cv`, `io`, `numbered`.

## Template selection

| Metadata | Existing template category |
| --- | --- |
| `main` + DT, DB, DPT, DPB, DTB, DPTB | Main |
| `main` + PT, PB, PTB | Main Passenger Side |
| `unmain`, `cv`, `io`, or `numbered` | Normal |
| DOPT or DOPB, any subtype | Normal |

The account and material then select the existing PNG for that category:

| Material | Main | Passenger Side | Normal |
| --- | --- | --- | --- |
| Genuine Leather Solid | GLS | PS GLS | Normal |
| Genuine Leather Perforated / Genuine Leather Perf | GLS PI | PS GLS PI | Normal |
| Perforated | PI | PS PI | Normal |
| Other Material | Normal | PS | Normal |

Existing material keys (`genuine-leather-solid`, `genuine-leather-perforated`, `perforated`, `other-material`) are also accepted. Unknown materials are rejected instead of silently becoming Other Material. Account names match existing library sections case-insensitively; `DSA` also identifies `DSA eBay`.

`unmain` receives Normal, as requested; Photo Studio does not assemble its composite listing. `cv` always skips background removal and fitting, keeps the original background, and centers the source at native pixel size. Remove BG, Remove All BG and Ctrl+B also skip Close View sources and their copies, and manual scaling cannot shrink them below 100%. The configured canvas still determines the exported dimensions; native images larger than the canvas can be clipped. Other subtypes use proportional fitting with 50 output-pixel clearance. Normal-template products can grow up to 8% into the clear upper-center space while preserving the gap from header artwork, horizontal centering and bottom clearance; explicit custom margins retain the ordinary fit. Close View is exempt from fitting and its inset to preserve original size. Manual edits can change ordinary products' automatic placement.

An optional per-image `templateName` supplies an exact account-template choice resolved by CPIS. It overrides the category mapping and is validated against the account's library. A missing explicit template is an error, not a fallback to another template. Close View handling still follows subtype. Without an explicit template, the existing Master `PLS PI` alias and single-template account fallback continue to work.

Color is preserved and displayed as CPIS context. Photo Studio does not infer materials/templates from color or recolor images. CPIS can supply `templateName` when it has already resolved a color-specific template installed in the selected account.

Apply Workflow creates a local Normal-template `unmain` output for each resolved DT/PT `main` image, preserving the original image and its template. The new filename appends ` unmain` before the extension. CPIS metadata, not filename substrings, controls this rule; DPTB remains Full Set and is excluded. Copies appear in the editor and exports, with their own editor IDs, `unmain` subtype and `generatedFromImageId` source links in the plan. Existing generated copies or matching uploaded unmain files are reused. Photo Studio does not invent CPIS IDs or change composite/listing membership.

Landscape uploads and products wider than their height remain vertically centered in the safe area. Only portrait Normal-template products use the optional upper-center enlargement; Close View rules remain unchanged.

## Browser API

The static editor exposes `window.PhotoStudioIntegration` after `script.js` loads. This is a same-page browser API, not an HTTP service or a cross-origin message listener. CPIS's host integration must deliver the payload and File objects to this API; there is no automatic connection to a CPIS server.

```js
// Start with an empty editor; imageFiles is an Array/FileList of real image Files.
await PhotoStudioIntegration.importImages(payload, imageFiles);

// Or annotate a batch already uploaded through the normal UI:
PhotoStudioIntegration.setMetadata(payload);

// Review the resolved templates before processing.
const plan = PhotoStudioIntegration.getPlan();
if (plan.ready) await PhotoStudioIntegration.applyWorkflow();

// Retain the source identifiers when passing work back to CPIS.
const manifest = PhotoStudioIntegration.getMetadata();
```

- `importImages(payload, imageFiles)` validates metadata and file matching before adding a new batch, waits for decoding, and opens the Listing review. It rejects a non-empty editor so existing work is not replaced. Failed images remain visible for replacement/removal and cannot be processed.
- `setMetadata(payload)` synchronously validates and annotates the entire current batch, then opens the review. It does not process images or alter existing pixel edits/watermarks until Apply Workflow is invoked.
- `getPlan()` returns `{ready, account, material, color, images}`. Each image includes `imageId`, optional CPIS `id`, filename, variation, subtype, kind, source (`metadata`/`filename`/`generated`), templateName, closeView, and error. Planned DT/PT copies also appear before processing with `pendingGeneration: true` and a `generatedFromImageId` link. After Apply Workflow they become ordinary editable images and pendingGeneration is false.
- `getMetadata()` returns the current manifest plus stable editor `imageId` values, or null in filename mode. Optional per-image CPIS `id` and `templateName` values are retained.
- `applyWorkflow()` returns a Promise for the resulting plan. Validation or processing failures reject it. The existing Apply Workflow button uses the same path.
- `clearMetadata()` explicitly returns the batch to local filename detection and unlocks the account/material selectors. Existing edits remain until the workflow is applied again.

The payload must cover every uploaded image exactly once. Initial matching uses the original File.name, case-sensitively; filenames are identity keys here, not classification hints. If original filenames repeat, include each editor `imageId` to disambiguate. The filename and imageId must agree. An optional CPIS `id` is a preserved source identifier, not a matching key, and may be shared by an editor duplicate and its source.

Locally generated unmain copies do not have to be included when CPIS resends metadata for its original uploads. Missing generated entries inherit the source's resolved variation and retain subtype `unmain`. `getMetadata()` includes the generated images with their actual filenames and editor IDs so a complete manifest can also be round-tripped.

One editor batch has one account/material/color context. In metadata mode those values are authoritative, and the account/material selectors are locked. Uploading additional images requires updated metadata; the workflow blocks instead of guessing for unclassified files. Batch duplicates inherit metadata; deletion removes only that batch item. Undo/redo of visual edits does not change CPIS classification.

After processing, use the existing layer controls and per-image tools for manual corrections. Export and Export Batch render the edited canvas state; they do not re-run automatic classification or preparation. Existing exports remain image files/ZIPs, not a CPIS asset-upload service.

Individual and batch image filenames retain their stems without a Photo Studio suffix. ZIP filename collisions are numbered so no images overwrite one another on extraction. The archive itself keeps its account-folder name.

## JSON import in the UI

Upload the images, open Listing, and choose **Import CPIS JSON**. The review labels metadata-driven rows with **CPIS**, displays the supplied color, and shows the resolved template/subtype. **Use filenames** is the explicit way to return to the standalone workflow.

Local filename fallback recognizes main codes and suffixes such as `DT1`, `DTcv`, `DTio`, `DT unmain`, `DOPTcv`, `DOPTio`, `DOPT1`, `DOPBcv`, `DOPBio`, and `DOPB1`. Full `Close View` spellings also remain supported. Supplied metadata always wins, including when it contradicts such a filename.

Metadata is session state, like the uploaded images; it is not automatically persisted after closing the page. Bundled templates and shared spacing defaults continue to ship with the repository.

## Validation

Run `node --test tests/listing-metadata.test.cjs` for the metadata contract and fallback parser checks. Browser checks additionally exercise upload/import, invalid manifest handling, metadata precedence, manual edits, duplicates, Close View pixels, and the existing Listing workflow.
