INSERT INTO public.site_content (id, section, type, content)
VALUES
(
    'dynamic-inscription-content',
    'inscriptions',
    'text',
    '<p>L''admission de nouveaux élèves est prononcée en fonction de la date de réception du dossier complet et des places disponibles. Un entretien préalable avec l''équipe de direction est systématiquement organisé.</p><ul style="margin-left: 1.5rem; margin-top: 1rem;"><li>Télécharger et remplir le dossier ci-dessous.</li><li>Joindre l''ensemble des pièces justificatives demandées.</li><li>Prendre rendez-vous avec la direction au 06 27 57 62 57.</li></ul>'
),
(
    'dynamic-reinscription-content',
    'inscriptions',
    'text',
    '<p>Pour les familles ayant déjà des enfants scolarisés dans notre établissement, une procédure simplifiée est mise en place. La priorité vous est accordée sous réserve du retour du dossier dans les délais impartis.</p><ul style="margin-left: 1.5rem; margin-top: 1rem;"><li>Télécharger le formulaire de réinscription simplifié.</li><li>Le remettre rempli au secrétariat de l''école ou à l''enseignant de votre enfant.</li></ul>'
)
ON CONFLICT (id) DO UPDATE 
SET content = EXCLUDED.content;
