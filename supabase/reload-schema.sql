-- Forcer le rechargement du schema cache PostgREST
-- Exécuter après add-agent-permissions.sql si l'erreur persiste
NOTIFY pgrst, 'reload schema';
