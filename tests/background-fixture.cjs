// Deterministic masks for editor-state/geometry tests. Neural image quality is
// exercised separately by ai-background.browser.cjs with the actual IS-Net model.
exports.install = async (page, workflow = false) => page.evaluate(workflow => {
  PhotoStudioBackground.remove = async (source, {signal} = {}) => {
    await Promise.resolve();
    if (signal?.aborted) throw new DOMException('Canceled', 'AbortError');
    return workflow ? createSmartPreparation(source, {canvasWidth: 1576, canvasHeight: 1576, topMargin: 100, bottomMargin: 100}).foreground : createBackgroundRemovedSource(source);
  };
}, workflow);
