export function getRepoNameFromUrl(url) {
    try {
        const urlObj = new URL(url);
        const parts = urlObj.pathname.split("/").filter(Boolean);
        if (parts.length >= 2) {
            return parts[1];
        }
        return null;
    } catch {
        return null;
    }
}
