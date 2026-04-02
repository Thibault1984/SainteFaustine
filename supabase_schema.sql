-- ============================================================
-- SCRIPT SQL POUR SUPABASE : GESTION DES RÔLES (ADMIN/PARENT)
-- ============================================================

-- 1. Création de la table `user_roles` reliée au système d'authentification natif
CREATE TABLE public.user_roles (
    -- 'id' correspond à l'ID de l'utilisateur dans la table d'authentification sécurisée
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    
    -- Le rôle peut être uniquement 'admin' ou 'parent'
    role TEXT CHECK (role IN ('admin', 'parent')) NOT NULL,
    
    -- Date de création automatique
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Paramétrage de la sécurité (Row Level Security)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Autoriser les utilisateurs connectés à lire UNIQUEMENT leur propre rôle
CREATE POLICY "Les utilisateurs peuvent voir leur propre rôle" 
    ON public.user_roles
    FOR SELECT 
    USING (auth.uid() = id);

-- ============================================================
-- 4. CRÉATION AUTOMATIQUE DES COMPTES (ADMIN ET PARENT)
-- ============================================================
-- Ce script va injecter de force les utilisateurs de manière sécurisée 
-- avec la fonction de hachage de postgres (pgcrypto).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    admin_id uuid := gen_random_uuid();
    parent_id uuid := gen_random_uuid();
BEGIN
    -- Suppression préalable des anciens comptes pour éviter les erreurs de duplication
    DELETE FROM auth.users WHERE email IN ('Admin2012@ecolesaintefaustine.fr', 'Parents_SteFaustine@ecolesaintefaustine.fr');

    -- Création du compte Administrateur
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, 
        created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user
    ) VALUES (
        admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
        'Admin2012@ecolesaintefaustine.fr', crypt('Mbnb2BBB&K3jUIXHFHs7p2XU', gen_salt('bf')), now(), 
        now(), now(), '{"provider": "email", "providers": ["email"]}', '{}', false
    );
    
    -- IMPORTANT: Supabase exige la création de l'identité correspondante pour autoriser le login
    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at)
    VALUES (gen_random_uuid(), admin_id, admin_id::text, format('{"sub": "%s", "email": "%s"}', admin_id::text, 'Admin2012@ecolesaintefaustine.fr')::jsonb, 'email', now(), now());
    
    INSERT INTO public.user_roles (id, role) VALUES (admin_id, 'admin');

    -- Création du compte Famille/Parent
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, 
        created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user
    ) VALUES (
        parent_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
        'Parents_SteFaustine@ecolesaintefaustine.fr', crypt('P&yAcQjViJsgHDyQwgRQFS!P', gen_salt('bf')), now(), 
        now(), now(), '{"provider": "email", "providers": ["email"]}', '{}', false
    );
    
    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at)
    VALUES (gen_random_uuid(), parent_id, parent_id::text, format('{"sub": "%s", "email": "%s"}', parent_id::text, 'Parents_SteFaustine@ecolesaintefaustine.fr')::jsonb, 'email', now(), now());
    
    INSERT INTO public.user_roles (id, role) VALUES (parent_id, 'parent');
END $$;
