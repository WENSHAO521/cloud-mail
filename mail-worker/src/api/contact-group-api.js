import app from '../hono/hono';
import result from '../model/result';
import userContext from '../security/user-context';

const ENSURE = `CREATE TABLE IF NOT EXISTS contact_group (group_id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, name TEXT NOT NULL DEFAULT '', emails TEXT NOT NULL DEFAULT '[]', create_time DATETIME DEFAULT CURRENT_TIMESTAMP)`;

app.get('/contactGroup/list', async (c) => {
	try { await c.env.db.prepare(ENSURE).run(); } catch {}
	const userId = userContext.getUserId(c);
	const { results } = await c.env.db.prepare(
		'SELECT group_id, name, emails FROM contact_group WHERE user_id = ? ORDER BY group_id DESC'
	).bind(userId).all();
	return c.json(result.ok(results.map(r => ({ ...r, emails: JSON.parse(r.emails || '[]') }))));
});

app.post('/contactGroup/add', async (c) => {
	try { await c.env.db.prepare(ENSURE).run(); } catch {}
	const userId = userContext.getUserId(c);
	const { name, emails } = await c.req.json();
	const row = await c.env.db.prepare(
		'INSERT INTO contact_group (user_id, name, emails) VALUES (?,?,?) RETURNING *'
	).bind(userId, name || '', JSON.stringify(emails || [])).first();
	return c.json(result.ok({ ...row, emails: JSON.parse(row.emails || '[]') }));
});

app.put('/contactGroup/update', async (c) => {
	const userId = userContext.getUserId(c);
	const { groupId, name, emails } = await c.req.json();
	await c.env.db.prepare(
		'UPDATE contact_group SET name=?, emails=? WHERE group_id=? AND user_id=?'
	).bind(name || '', JSON.stringify(emails || []), groupId, userId).run();
	return c.json(result.ok());
});

app.delete('/contactGroup/delete', async (c) => {
	const userId = userContext.getUserId(c);
	const { groupId } = c.req.query();
	await c.env.db.prepare('DELETE FROM contact_group WHERE group_id=? AND user_id=?').bind(Number(groupId), userId).run();
	return c.json(result.ok());
});
