import app from '../hono/hono';
import result from '../model/result';
import userContext from '../security/user-context';

const ENSURE = `CREATE TABLE IF NOT EXISTS auto_reply (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL UNIQUE, enabled INTEGER NOT NULL DEFAULT 0, message TEXT NOT NULL DEFAULT '', update_time DATETIME DEFAULT CURRENT_TIMESTAMP)`;

app.get('/autoReply/get', async (c) => {
	try { await c.env.db.prepare(ENSURE).run(); } catch {}
	const userId = userContext.getUserId(c);
	const row = await c.env.db.prepare('SELECT enabled, message FROM auto_reply WHERE user_id = ?').bind(userId).first();
	return c.json(result.ok(row || { enabled: 0, message: '' }));
});

app.put('/autoReply/set', async (c) => {
	try { await c.env.db.prepare(ENSURE).run(); } catch {}
	const userId = userContext.getUserId(c);
	const { enabled, message } = await c.req.json();
	await c.env.db.prepare(
		`INSERT INTO auto_reply (user_id, enabled, message) VALUES (?,?,?)
		 ON CONFLICT(user_id) DO UPDATE SET enabled=excluded.enabled, message=excluded.message, update_time=CURRENT_TIMESTAMP`
	).bind(userId, enabled ? 1 : 0, message || '').run();
	return c.json(result.ok());
});
