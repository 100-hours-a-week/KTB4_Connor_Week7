function formatCount(value) {
    const count = Number(value) || 0;

    if (count >= 1000) {
        return `${Math.floor(count / 1000)}k`;
    }

    return String(count);
}

function formatDate(value) {
    if (!value) {
        return "";
    }

    const [date, time] = String(value).replace("T", " ").split(" ");
    return `${date} ${time.split(".")[0].slice(0, 8).padEnd(8, "0")}`;
}

function formatLimitText(value, maxLength) {
    return Array.from(value || "").slice(0, maxLength).join("");
}

export { formatCount, formatDate, formatLimitText };
