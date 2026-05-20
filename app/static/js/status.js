const banner = document.getElementById("status-banner");

export function showStatus(message, type = "success") {
  if (!banner) return;
  banner.textContent = message;
  banner.className = `status-banner ${type}`;
}

export function hideStatus() {
  if (!banner) return;
  banner.className = "status-banner hidden";
  banner.textContent = "";
}
