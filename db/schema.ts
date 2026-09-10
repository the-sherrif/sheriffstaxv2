import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
export const applications = sqliteTable('applications', {
 id:text('id').primaryKey(),sessionHash:text('session_hash').notNull().unique(),handle:text('handle').notNull(),
 warrantUrl:text('warrant_url'),warrantNumber:text('warrant_number').notNull(),rulesVersion:integer('rules_version').notNull(),referredBy:integer('referred_by'),
 follow:integer('follow').notNull().default(0),like:integer('like').notNull().default(0),spreadMode:text('spread_mode').notNull().default('quote'),
 spreadUrl:text('spread_url').notNull().default(''),replyUrl:text('reply_url').notNull().default(''),createdAt:text('created_at').notNull(),recoveryHash:text('recovery_hash').unique(),
});
export const deputies=sqliteTable('deputies',{
 id:integer('id').primaryKey({autoIncrement:true}),applicationId:text('application_id').notNull().unique().references(()=>applications.id),
 handle:text('handle').notNull().unique(),referrerId:integer('referrer_id'),createdAt:text('created_at').notNull(),status:text('status').notNull().default('active'),
},t=>[index('idx_deputies_referrer_status').on(t.referrerId,t.status)]);
export const referralVisits=sqliteTable('referral_visits',{
 tokenHash:text('token_hash').primaryKey(),referrerId:integer('referrer_id').notNull().references(()=>deputies.id),expiresAt:integer('expires_at').notNull(),
},t=>[index('idx_referral_expiry').on(t.expiresAt)]);
export const rateLimits=sqliteTable('rate_limits',{bucketKey:text('bucket_key').primaryKey(),hits:integer('hits').notNull(),expiresAt:integer('expires_at').notNull()},t=>[index('idx_rate_limits_expiry').on(t.expiresAt)]);
// Future verifier-owned records. No Registry endpoint can insert Treasury contributions.
export const verifiedContributions=sqliteTable('verified_contributions',{
 id:integer('id').primaryKey({autoIncrement:true}),chainId:integer('chain_id').notNull(),transactionHash:text('transaction_hash').notNull(),transferIndex:integer('transfer_index').notNull(),
 wallet:text('wallet').notNull(),asset:text('asset').notNull(),atomicAmount:text('atomic_amount').notNull(),usdCents:integer('usd_cents').notNull(),phase:text('phase').notNull(),
 referrerId:integer('referrer_id'),status:text('status').notNull(),verifiedAt:text('verified_at').notNull(),
},t=>[uniqueIndex('idx_unique_chain_transfer').on(t.chainId,t.transactionHash,t.transferIndex)]);
