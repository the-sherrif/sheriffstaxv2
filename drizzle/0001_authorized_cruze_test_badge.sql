-- Owner-authorized test issuance for the existing @cruze application only.
-- Preserve Field Orders as submitted: this does not claim social verification.
-- No recruiter credit is awarded for this manually issued test badge.
INSERT INTO deputies (application_id,handle,referrer_id,created_at,status)
SELECT id,handle,NULL,strftime('%Y-%m-%dT%H:%M:%fZ','now'),'active'
FROM applications
WHERE id='bbc707a4-688c-4cf9-b9c0-5ff17e2919e5' AND handle='cruze'
AND NOT EXISTS (SELECT 1 FROM deputies WHERE handle='cruze' OR application_id='bbc707a4-688c-4cf9-b9c0-5ff17e2919e5');
