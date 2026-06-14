-- Suivi des sessions agents (ouverture/fermeture de point)
CREATE TABLE IF NOT EXISTS sessions_agents (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id          uuid        REFERENCES agents(id) ON DELETE CASCADE,
  point_de_vente_id uuid        NOT NULL REFERENCES points_de_vente(id) ON DELETE CASCADE,
  user_id           uuid        NOT NULL REFERENCES auth.users(id),
  nom_agent         text,
  ouvert_a          timestamptz NOT NULL DEFAULT now(),
  ferme_a           timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_point ON sessions_agents(point_de_vente_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user  ON sessions_agents(user_id);

ALTER TABLE sessions_agents ENABLE ROW LEVEL SECURITY;

-- Agent : insérer/mettre à jour ses propres sessions
CREATE POLICY "sessions_insert_own" ON sessions_agents
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sessions_update_own" ON sessions_agents
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Lecture : agent voit ses sessions, propriétaire voit les sessions de ses points
CREATE POLICY "sessions_select" ON sessions_agents
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM points_de_vente
      WHERE points_de_vente.id = sessions_agents.point_de_vente_id
        AND points_de_vente.proprietaire_id = auth.uid()
    )
  );
