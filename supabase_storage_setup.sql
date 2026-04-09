-- =====================================================
-- HARS Analytics — Supabase Storage : widget-photos
-- Exécuter dans le SQL Editor de Supabase
-- =====================================================

-- 1. Créer le bucket public "widget-photos"
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'widget-photos',
  'widget-photos',
  true,                         -- accès public en lecture (URL directe)
  5242880,                      -- 5 MB max par fichier
  ARRAY['image/jpeg', 'image/webp', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Politique : lecture publique (GET sans auth)
CREATE POLICY "Lecture publique widget-photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'widget-photos');

-- 3. Politique : upload uniquement via service_role (le Worker utilise la service key)
--    Les uploads depuis le Worker passent avec le token service_role,
--    qui bypass les RLS. Cette politique protège contre les uploads directs.
CREATE POLICY "Upload service_role uniquement"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'widget-photos'
  AND auth.role() = 'service_role'
);

-- 4. Politique : suppression via service_role
CREATE POLICY "Suppression service_role uniquement"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'widget-photos'
  AND auth.role() = 'service_role'
);
