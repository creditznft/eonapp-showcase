(() => {
  const run = () => {
  try {
    const css = JSON.parse(document.getElementById('cm-css-data')?.textContent || '""');
    const style = document.getElementById('cm-inline-css');
    if (style) style.textContent = css;

    const code = JSON.parse(document.getElementById('cm-js-data')?.textContent || '""');
    const blob = new Blob([code], { type: 'text/javascript' });
    const blobUrl = URL.createObjectURL(blob);
    const script = document.createElement('script');
    script.async = false;
    script.src = blobUrl;
    script.onload = () => URL.revokeObjectURL(blobUrl);
    script.onerror = () => URL.revokeObjectURL(blobUrl);
    document.body.appendChild(script);
  } catch (error) {
    console.error('Preview boot failed:', error);
  }
  };

  if (document.body) run();
  else document.addEventListener('DOMContentLoaded', run, { once: true });
})();
