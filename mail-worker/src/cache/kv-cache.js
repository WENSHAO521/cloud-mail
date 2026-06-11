/**
 * Module-level in-memory TTL cache for KV reads.
 * Cloudflare Worker isolates reuse the same module instance across many
 * requests, so this cache cuts KV reads dramatically for hot paths like
 * /setting/websiteConfig (unauthenticated) and per-request auth checks.
 */

const store = new Map()

function get(key) {
	const entry = store.get(key)
	if (!entry) return null
	if (Date.now() > entry.expiry) {
		store.delete(key)
		return null
	}
	return entry.value
}

function set(key, value, ttlSeconds) {
	store.set(key, { value, expiry: Date.now() + ttlSeconds * 1000 })
}

function del(key) {
	store.delete(key)
}

// Exported TTLs (seconds)
export const TTL = {
	SETTING: 60,   // settings change rarely; 60 s is fine
	AUTH:    30,   // short enough that logout/ban takes effect quickly
}

export default { get, set, del }
