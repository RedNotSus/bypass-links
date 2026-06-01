export function createLogger(scope) {
  function write(level, event, details = {}) {
    const payload = {
      timestamp: new Date().toISOString(),
      level,
      scope,
      event,
      ...normalizeDetails(details)
    };

    const line = JSON.stringify(payload);
    if (level === "error") {
      console.error(line);
    } else if (level === "warn") {
      console.warn(line);
    } else {
      console.log(line);
    }
  }

  return {
    info: (event, details) => write("info", event, details),
    warn: (event, details) => write("warn", event, details),
    error: (event, details) => write("error", event, details)
  };
}

export function serializeError(error) {
  if (!error) {
    return null;
  }

  return {
    name: error.name,
    message: error.message || String(error),
    stack: error.stack
  };
}

export function summarizeUrl(value) {
  try {
    const url = new URL(value);
    return {
      host: url.host,
      protocol: url.protocol,
      pathLength: url.pathname.length,
      searchLength: url.search.length
    };
  } catch {
    return {
      valid: false,
      length: typeof value === "string" ? value.length : 0
    };
  }
}

function normalizeDetails(details) {
  return Object.fromEntries(
    Object.entries(details).map(([key, value]) => [key, normalizeValue(value)])
  );
}

function normalizeValue(value) {
  if (value instanceof Error) {
    return serializeError(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeValue(item));
  }

  if (value && typeof value === "object") {
    return normalizeDetails(value);
  }

  return value;
}
