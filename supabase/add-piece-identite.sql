ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS type_piece   text CHECK (type_piece IN ('CNI','PASSEPORT','PERMIS','CARTE_CONSULAIRE','AUTRE')),
  ADD COLUMN IF NOT EXISTS numero_piece text;
