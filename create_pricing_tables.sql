-- Tables pour les tarifs structurés

-- Table Scolarité
CREATE TABLE IF NOT EXISTS public.tarifs_scolarite (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    saison TEXT NOT NULL,
    rang_enfant INTEGER NOT NULL,
    description TEXT NOT NULL,
    montant_mensuel DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Table Restauration
CREATE TABLE IF NOT EXISTS public.tarifs_restauration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    saison TEXT NOT NULL,
    jours_semaine INTEGER NOT NULL,
    trimestre INTEGER NOT NULL,
    prix_standard DECIMAL(10, 2) NOT NULL,
    prix_surveillance DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.tarifs_scolarite ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarifs_restauration ENABLE ROW LEVEL SECURITY;

-- Politiques de lecture pour tout le monde
CREATE POLICY "Lecture publique tarifs_scolarite" ON public.tarifs_scolarite FOR SELECT USING (true);
CREATE POLICY "Lecture publique tarifs_restauration" ON public.tarifs_restauration FOR SELECT USING (true);

-- Politiques d'écriture pour les admins
CREATE POLICY "Admins peuvent tout faire sur tarifs_scolarite" 
ON public.tarifs_scolarite FOR ALL 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins peuvent tout faire sur tarifs_restauration" 
ON public.tarifs_restauration FOR ALL 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE id = auth.uid() AND role = 'admin'));

-- Insertion des données initiales (Saison 2026-2027)
INSERT INTO public.tarifs_scolarite (saison, rang_enfant, description, montant_mensuel)
VALUES 
('2026-2027', 1, '1er enfant', 205.00),
('2026-2027', 2, '2ème enfant (- 10 %)', 185.00),
('2026-2027', 3, '3ème enfant (- 30 %)', 144.00),
('2026-2027', 4, '4ème enfant (- 40 %)', 123.00),
('2026-2027', 5, '5ème enfant (- 50 %)', 103.00),
('2026-2027', 6, '6ème enfant (- 50 %)', 103.00);

INSERT INTO public.tarifs_restauration (saison, jours_semaine, trimestre, prix_standard, prix_surveillance)
VALUES 
('2026-2027', 4, 1, 90.00, 130.00), ('2026-2027', 4, 2, 75.00, 115.00), ('2026-2027', 4, 3, 65.00, 105.00),
('2026-2027', 3, 1, 70.00, 100.00), ('2026-2027', 3, 2, 60.00, 90.00),  ('2026-2027', 3, 3, 45.00, 75.00),
('2026-2027', 2, 1, 50.00, 70.00),  ('2026-2027', 2, 2, 40.00, 60.00),  ('2026-2027', 2, 3, 30.00, 50.00),
('2026-2027', 1, 1, 25.00, 35.00),  ('2026-2027', 1, 2, 20.00, 35.00),  ('2026-2027', 1, 3, 15.00, 25.00);
