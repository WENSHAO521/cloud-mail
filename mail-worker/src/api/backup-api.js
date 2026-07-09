import app from '../hono/hono';
import result from '../model/result';
import backupService from '../service/backup-service';
import userContext from '../security/user-context';
import BizError from '../error/biz-error';

// Which providers have OAuth credentials configured on this deployment
app.get('/backup/providers', async (c) => {
	const providers = backupService.getConfiguredProviders(c);
	return c.json(result.ok(providers));
});

// Get OAuth URL for a provider — frontend opens it in a popup
app.get('/backup/connect/:provider', async (c) => {
	const provider = c.req.param('provider');
	const userId = userContext.getUserId(c);
	const url = await backupService.getAuthUrl(c, provider, userId);
	return c.json(result.ok({ url }));
});

// OAuth callback — provider redirects here after user grants access
// Must be in the security exclude list (no JWT required)
app.get('/backup/oauth/:provider/callback', async (c) => {
	const provider = c.req.param('provider');
	return backupService.handleCallback(c, provider);
});

// Get connection status for all providers
app.get('/backup/status', async (c) => {
	const userId = userContext.getUserId(c);
	const status = await backupService.getStatus(c, userId);
	return c.json(result.ok(status));
});

// Disconnect a provider
app.delete('/backup/:provider', async (c) => {
	const provider = c.req.param('provider');
	const userId = userContext.getUserId(c);
	await backupService.disconnect(c, userId, provider);
	return c.json(result.ok());
});

// Trigger manual backup
app.post('/backup/start/:provider', async (c) => {
	const provider = c.req.param('provider');
	const userId = userContext.getUserId(c);
	const summary = await backupService.startBackup(c, userId, provider);
	return c.json(result.ok(summary));
});
