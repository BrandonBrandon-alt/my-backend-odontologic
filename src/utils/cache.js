/**
 * Caché en memoria con TTL mínimo.
 * - No apto para entornos distribuidos (solo proceso único).
 * - Útil para endpoints de solo lectura con alto ratio de lectura.
 */
// Minimal in-memory TTL cache
// Not for distributed environments; suitable for small read-heavy endpoints

const isTest = process.env.NODE_ENV === 'test';
const store = new Map(); // Mapa clave -> { value, expiresAt }

function nowMs() {
  return Date.now(); // Marca de tiempo en ms
}

function get(key) {
  if (isTest) return undefined; // Deshabilita caché en tests
  const entry = store.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt && entry.expiresAt <= nowMs()) {
    store.delete(key); // Expirado: limpiar y no devolver
    return undefined;
  }
  return entry.value; // Devuelve valor si vigente
}

function set(key, value, ttlMs) {
  if (isTest) return; // No cachear en tests
  const expiresAt = ttlMs ? nowMs() + ttlMs : null; // TTL opcional
  store.set(key, { value, expiresAt });
}

function del(key) {
  if (isTest) return;
  store.delete(key);
}

async function wrap(key, ttlMs, fetcher) {
  if (isTest) {
    return fetcher(); // Evita caché en tests
  }
  const cached = get(key);
  if (cached !== undefined) return cached;
  const value = await fetcher(); // Obtiene y cachea
  set(key, value, ttlMs);
  return value;
}

module.exports = {
  get,
  set,
  del,
  wrap,
};