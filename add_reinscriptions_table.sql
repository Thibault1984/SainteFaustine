-- Création de la table des réinscriptions
CREATE TABLE IF NOT EXISTS public.reinscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nom_famille TEXT NOT NULL,
    enfants JSONB NOT NULL, -- Liste des enfants : [{prenom: string, classe: string, restauration: string[]}]
    frais_annexes TEXT CHECK (frais_annexes IN ('base', 'majore')) NOT NULL,
    autorisation_image BOOLEAN DEFAULT FALSE,
    mode_reglement TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, validated, rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Activation de la sécurité RLS
ALTER TABLE public.reinscriptions ENABLE ROW LEVEL SECURITY;

-- Les parents peuvent voir leurs propres réinscriptions
CREATE POLICY "Les parents voient leurs propres réinscriptions" 
    ON public.reinscriptions
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Les parents peuvent soumettre une réinscription
CREATE POLICY "Les parents peuvent soumettre une réinscription" 
    ON public.reinscriptions
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Les parents peuvent modifier leur réinscription si elle n'est pas encore validée
CREATE POLICY "Les parents peuvent modifier leur réinscription" 
    ON public.reinscriptions
    FOR UPDATE
    USING (auth.uid() = user_id AND status != 'validated')
    WITH CHECK (auth.uid() = user_id AND status != 'validated');

-- Les admins peuvent tout voir
CREATE POLICY "Les admins peuvent tout voir" 
    ON public.reinscriptions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
