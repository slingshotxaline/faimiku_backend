// Minimal dependency-free CSV writer — Excel opens CSV natively, so this
// covers "export to Excel" without adding an xlsx library. Handles the
// common escaping cases (commas, quotes, newlines within a field).
const escapeCsvField = (value) => {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
};

// columns: [{ key: "orderNumber", label: "Order #" }, ...]
// rows: array of plain objects (can use dot-path-resolved values via a
// getter function per column if needed — see usage in controllers)
export const toCsv = (rows, columns) => {
  const header = columns.map((c) => escapeCsvField(c.label)).join(",");
  const body = rows
    .map((row) => columns.map((c) => escapeCsvField(c.get ? c.get(row) : row[c.key])).join(","))
    .join("\n");
  return `${header}\n${body}`;
};

export const sendCsv = (res, filename, csvContent) => {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send("\uFEFF" + csvContent);
};