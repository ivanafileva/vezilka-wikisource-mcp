-- A donation batch is submitted as one Vezilka donation per resource; the batch
-- stores all returned references as a comma-separated list, which can exceed
-- the original varchar(255).
alter table donation_batches
    alter column vezilka_reference type varchar(4096);
