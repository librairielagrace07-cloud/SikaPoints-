-- Ajoute le numéro de téléphone client et la référence de transaction
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS telephone_client text;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS reference_transaction text;
