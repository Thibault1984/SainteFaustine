-- ============================================================
-- SCRIPT SQL POUR SUPABASE : SÉCURISATION DES DONNÉES (RLS)
-- À exécuter dans la console Supabase (SQL Editor)
-- ============================================================

-- 1. Sécuriser la table `site_content`
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Autoriser tout le monde (public) à lire les données
CREATE POLICY "Public Read Access for site_content" 
  ON public.site_content 
  FOR SELECT 
  USING (true);

-- Autoriser uniquement les administrateurs à modifier (insert, update, delete)
CREATE POLICY "Admin Write Access for site_content"
  ON public.site_content
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- ============================================================

-- 2. Sécuriser le Storage (Bucket 'school_assets')
-- S'assure que le bucket existe
INSERT INTO storage.buckets (id, name, public) 
VALUES ('school_assets', 'school_assets', true)
ON CONFLICT (id) DO NOTHING;

-- Autoriser tout le monde à voir/télécharger les images
CREATE POLICY "Public Read Access for school_assets" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'school_assets');

-- Autoriser uniquement les administrateurs à ajouter de nouveaux fichiers
CREATE POLICY "Admin Insert Access for school_assets" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'school_assets' AND 
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- Autoriser uniquement les administrateurs à modifier (écraser) des fichiers
CREATE POLICY "Admin Update Access for school_assets" 
  ON storage.objects 
  FOR UPDATE 
  USING (
    bucket_id = 'school_assets' AND 
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- Autoriser uniquement les administrateurs à supprimer des fichiers
CREATE POLICY "Admin Delete Access for school_assets" 
  ON storage.objects 
  FOR DELETE 
  USING (
    bucket_id = 'school_assets' AND 
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );
