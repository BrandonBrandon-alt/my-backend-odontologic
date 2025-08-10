// Minimal in-memory TTL cache
// Not for distributed environments; suitable for small read-heavy endpoints

const isTest = process.env.NODE_ENV === 'test';
const store = new Map();

function nowMs() {
  return Date.now();
}

function get(key) {
  if (isTest) return undefined;
  const entry = store.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt && entry.expiresAt <= nowMs()) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

function set(key, value, ttlMs) {
  if (isTest) return;
  const expiresAt = ttlMs ? nowMs() + ttlMs : null;
  store.set(key, { value, expiresAt });
}

function del(key) {
  if (isTest) return;
  store.delete(key);
}

async function wrap(key, ttlMs, fetcher) {
  if (isTest) {
    return fetcher();
  }
  const cached = get(key);
  if (cached !== undefined) return cached;
  const value = await fetcher();
  set(key, value, ttlMs);
  return value;
}

module.exports = {
  get,
  set,
  del,
  wrap,
};