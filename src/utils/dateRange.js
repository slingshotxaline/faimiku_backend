const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const endOfDay = (d) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

// Rolling windows anchored to "now". Returns { from, to } Date objects,
// or null for an unrecognized/"all" preset (meaning: no filter).
export const getPresetDateRange = (preset) => {
  const now = new Date();

  switch (preset) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "yesterday": {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      return { from: startOfDay(d), to: endOfDay(d) };
    }
    case "7d": {
      const d = new Date(now);
      d.setDate(d.getDate() - 6); // includes today = 7 days total
      return { from: startOfDay(d), to: endOfDay(now) };
    }
    case "1m": {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      return { from: startOfDay(d), to: endOfDay(now) };
    }
    case "3m": {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 3);
      return { from: startOfDay(d), to: endOfDay(now) };
    }
    case "6m": {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 6);
      return { from: startOfDay(d), to: endOfDay(now) };
    }
    case "1y": {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      return { from: startOfDay(d), to: endOfDay(now) };
    }
    case "2y": {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 2);
      return { from: startOfDay(d), to: endOfDay(now) };
    }
    default:
      return null;
  }
};

// Resolves req.query into { from, to } (Date objects or undefined).
// Explicit ?from=&to= wins over ?range=preset.
export const resolveDateRangeFromQuery = ({ range, from, to } = {}) => {
  if (from || to) {
    return {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    };
  }
  if (range && range !== "all") {
    const preset = getPresetDateRange(range);
    if (preset) return preset;
  }
  return {};
};
