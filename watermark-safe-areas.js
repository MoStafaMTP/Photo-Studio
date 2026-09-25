// Shared defaults from Template Sizes.pdf. All supplied templates are 1500 x 1500.
// Values are pixels in the template; the renderer scales them to the export canvas.
globalThis.DEFAULT_WATERMARK_SAFE_AREAS = Object.freeze({
  canvasWidth: 1500,
  canvasHeight: 1500,
  accounts: {
    'US Auto Nation': {top: 85, bottom: 130, templates: {'GLS PI': 140, 'PS GLS PI': 160, 'PS GLS': 140, 'PS PI': 140}},
    'US Auto Seat Cover': {top: 180, bottom: 135},
    'US Auto Seat Factory': {top: 100, bottom: 150, templates: {Normal: 50, 'GLS PI': 150, 'PS GLS PI': 215, 'PS GLS': 150, 'PS PI': 150}},
    DIY: {top: 190, bottom: 100},
    Master: {top: 90, bottom: 170, templates: {'GLS PI': 130, 'PS GLS PI': 170, 'PS GLS': 130, 'PS PI': 130}},
    Premium: {top: 150, bottom: 100, templates: {'PS GLS PI': 170}},
    Elite: {top: 170, bottom: 120, templates: {'GLS PI': 200, 'PS GLS PI': 250, 'PS GLS': 200, 'PS PI': 200}},
    'DSA eBay': {top: 110, bottom: 130}
  }
});
