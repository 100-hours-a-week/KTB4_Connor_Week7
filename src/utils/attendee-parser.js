function parseAttendeeInput({ rawValue, existingChips = [] }) {
  const parts = rawValue.split(",");
  const hasTrailingComma = rawValue.endsWith(",");
  const completeParts = hasTrailingComma ? parts : parts.slice(0, -1);
  const existingNames = new Set(existingChips);
  const chipsToAdd = [];

  completeParts.forEach((part) => {
    const name = part.trim();
    if (!name || existingNames.has(name)) return;
    existingNames.add(name);
    chipsToAdd.push(name);
  });

  return {
    chipsToAdd,
    remainingValue: hasTrailingComma ? "" : parts.at(-1) || "",
  };
}

export { parseAttendeeInput };
