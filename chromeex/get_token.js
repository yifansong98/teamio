// public/get_token.js (MAIN world script injected by background)
(function () {
  try {
    const token =
      (window._docs_flag_initialData &&
        window._docs_flag_initialData.info_params &&
        window._docs_flag_initialData.info_params.token) ||
      null;
    window.postMessage({ type: 'DOCS_REV_SCRAPER_TOKEN', token }, '*');
  } catch (e) {
    window.postMessage({ type: 'DOCS_REV_SCRAPER_TOKEN', token: null, error: String(e) }, '*');
  }
})();
