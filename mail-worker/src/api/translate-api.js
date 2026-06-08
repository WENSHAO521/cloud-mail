import app from '../hono/hono';
import result from '../model/result';
import emailUtils from '../utils/email-utils';

app.post('/translate', async (c) => {
	const { text, html, source_lang, target_lang } = await c.req.json();

	const ai = c.env.ai;
	if (!ai) return c.json(result.fail('AI binding not configured'), 503);

	const plain = html
		? emailUtils.htmlToText(html).slice(0, 4000)
		: (text || '').trim().slice(0, 4000);

	if (!plain) return c.json(result.ok({ translated_text: '' }));

	const resp = await ai.run('@cf/meta/m2m100-1.2b', {
		text: plain,
		source_lang: source_lang || 'en',
		target_lang: target_lang || 'zh',
	});

	return c.json(result.ok({ translated_text: resp.translated_text || '' }));
});
