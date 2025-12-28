const form = document.getElementById("shorten-form");
const urlInput = document.getElementById("url-input");
const resultPanel = document.getElementById("result");
const statsPanel = document.getElementById("stats");
const errorPanel = document.getElementById("error");
const shortenButton = document.getElementById("shorten-button");

const setError = (message) => {
  errorPanel.textContent = message;
};

const renderResult = ({ shortUrl, shortCode }) => {
  resultPanel.hidden = false;
  resultPanel.innerHTML = `
    <strong>Short URL:</strong>
    <a href="${shortUrl}" target="_blank" rel="noopener noreferrer">${shortUrl}</a>
    <p>Short code: <code>${shortCode}</code></p>
  `;
};

const renderStats = ({ shortCode, originalUrl, clickCount, lastClickedAt }) => {
  statsPanel.hidden = false;
  statsPanel.innerHTML = `
    <h3>Stats</h3>
    <table class="stats-table">
      <tr>
        <td><strong>Short code</strong></td>
        <td>${shortCode}</td>
      </tr>
      <tr>
        <td><strong>Original URL</strong></td>
        <td><a href="${originalUrl}" target="_blank" rel="noopener noreferrer">${originalUrl}</a></td>
      </tr>
      <tr>
        <td><strong>Clicks</strong></td>
        <td>${clickCount}</td>
      </tr>
      <tr>
        <td><strong>Last clicked</strong></td>
        <td>${lastClickedAt || "Never"}</td>
      </tr>
    </table>
  `;
};

const fetchStats = async (shortCode) => {
  const response = await fetch(`/api/links/${shortCode}/stats`);
  if (!response.ok) {
    throw new Error("Unable to fetch stats");
  }
  return response.json();
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setError("");
  resultPanel.hidden = true;
  statsPanel.hidden = true;
  shortenButton.disabled = true;

  try {
    const response = await fetch("/api/links", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: urlInput.value.trim() }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to shorten link");
    }

    renderResult(data);
    const stats = await fetchStats(data.shortCode);
    renderStats(stats);
  } catch (error) {
    setError(error.message);
  } finally {
    shortenButton.disabled = false;
  }
});
