(() => {
  "use strict";
  const DATA_URL = "/assets/sports/sports-data.json";
  async function loadSportsData() {
    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`sports data failed: ${response.status}`);
    return response.json();
  }
  window.keeganSports = { loadSportsData };
})();
