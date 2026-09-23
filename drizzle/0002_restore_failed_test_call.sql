-- Restore the single failed @cruze test call observed in the live logs.
DELETE FROM rate_limits WHERE bucket_key='voice:deputy:1:20710';
--> statement-breakpoint
UPDATE rate_limits SET hits=MAX(0,hits-1) WHERE bucket_key='voice:global:20710';
