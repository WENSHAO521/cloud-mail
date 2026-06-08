import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const cloudBackup = sqliteTable('cloud_backup', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id').notNull(),
	provider: text('provider').notNull(),
	accessToken: text('access_token').notNull().default(''),
	refreshToken: text('refresh_token').notNull().default(''),
	expiresAt: integer('expires_at').notNull().default(0),
	folderId: text('folder_id').notNull().default(''),
	lastBackupAt: integer('last_backup_at').notNull().default(0),
	backupCount: integer('backup_count').notNull().default(0),
});

export default cloudBackup;
