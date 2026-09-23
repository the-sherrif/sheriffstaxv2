-- Revert the owner-authorized test issuance; preserve the application and its orders.
-- Remove the test row rather than blocking future qualification with a revoked row.
DELETE FROM referral_visits WHERE referrer_id IN (SELECT id FROM deputies WHERE id=1 AND application_id='bbc707a4-688c-4cf9-b9c0-5ff17e2919e5' AND handle='cruze');
--> statement-breakpoint
UPDATE applications SET referred_by=NULL WHERE referred_by IN (SELECT id FROM deputies WHERE id=1 AND application_id='bbc707a4-688c-4cf9-b9c0-5ff17e2919e5' AND handle='cruze');
--> statement-breakpoint
UPDATE applications SET recovery_hash=NULL WHERE id='bbc707a4-688c-4cf9-b9c0-5ff17e2919e5' AND handle='cruze' AND EXISTS (SELECT id FROM deputies WHERE id=1 AND application_id='bbc707a4-688c-4cf9-b9c0-5ff17e2919e5' AND handle='cruze');
--> statement-breakpoint
DELETE FROM deputies WHERE id=1 AND application_id='bbc707a4-688c-4cf9-b9c0-5ff17e2919e5' AND handle='cruze';
-- Keep the issuance sequence intact: an old shared test number must not be reassigned.
