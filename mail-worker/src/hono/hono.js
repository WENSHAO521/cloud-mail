import { Hono } from 'hono';
const app = new Hono();

import result from '../model/result';
import { cors } from 'hono/cors';
import { VpsKvAdapter } from '../adapter/kv-adapter';

app.use('*', cors());

// Inject VPS KV adapter when Cloudflare KV is not bound
app.use('*', async (c, next) => {
  if (!c.env.kv && c.env.vps_kv_url && c.env.vps_kv_secret) {
    c.env.kv = new VpsKvAdapter(c.env.vps_kv_url, c.env.vps_kv_secret);
  }
  await next();
});

app.onError((err, c) => {
	if (err.name === 'BizError') {
		console.log(err.message);
	} else {
		console.error(err);
	}

	if (err.message === `Cannot read properties of undefined (reading 'get')`) {
		return c.json(result.fail('KV数据库未绑定 KV database not bound',502));
	}

	if (err.message === `Cannot read properties of undefined (reading 'put')`) {
		return c.json(result.fail('KV数据库未绑定 KV database not bound',502));
	}

	if (err.message === `Cannot read properties of undefined (reading 'prepare')`) {
		return c.json(result.fail('D1数据库未绑定 D1 database not bound',502));
	}

	return c.json(result.fail(err.message, err.code));
});

export default app;


