document.addEventListener('DOMContentLoaded', async () => {
    // --- SUPABASE SESSION SECURITY ---
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    // Checking if the user has the 'parent' (or 'admin') role
    const { data: roleData, error } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('id', session.user.id)
        .single();
    
    // An admin can also access the parents section to see how it looks
    if (error || !roleData || (roleData.role !== 'parent' && roleData.role !== 'admin')) {
        alert("Accès refusé : Cet espace est strictement réservé aux parents de l'école.");
        await supabaseClient.auth.signOut();
        window.location.href = 'login.html';
        return;
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await supabaseClient.auth.signOut();
            window.location.href = 'login.html';
        });
    }

    // --- RE-INSCRIPTION MODAL LOGIC ---
    const modal = document.getElementById('reinscriptionModal');
    const openBtn = document.getElementById('reinscriptionBtn');
    const closeBtn = document.getElementById('closeModalBtn');
    const addEnfantBtn = document.getElementById('addEnfantBtn');
    const enfantsContainer = document.getElementById('enfantsContainer');
    const form = document.getElementById('reinscriptionForm');
    
    let currentReinscriptionId = null;

    if (openBtn && modal) {
        openBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // Check for existing re-inscription
            try {
                const { data, error } = await supabaseClient
                    .from('reinscriptions')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .neq('status', 'validated')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (data) {
                    currentReinscriptionId = data.id;
                    populateForm(data);
                } else {
                    currentReinscriptionId = null;
                    form.reset();
                    enfantsContainer.innerHTML = '';
                    addEnfantRow();
                }
            } catch (err) {
                console.error('Error fetching existing reinscription:', err);
            }

            modal.classList.add('active');
        });
    }

    function populateForm(data) {
        form.reset();
        enfantsContainer.innerHTML = '';
        
        document.getElementById('nomFamille').value = data.nom_famille;
        
        // Check radio for frais_annexes
        const radio = form.querySelector(`input[name="fraisAnnexes"][value="${data.frais_annexes}"]`);
        if (radio) radio.checked = true;
        
        // Select modeReglement
        form.querySelector('select[name="modeReglement"]').value = data.mode_reglement;
        
        // Check autorisationImage
        document.getElementById('autorisationImage').checked = data.autorisation_image;

        // Populate children
        data.enfants.forEach((enfant, idx) => {
            addEnfantRow();
            const row = enfantsContainer.children[idx];
            row.querySelector('[name="prenom"]').value = enfant.prenom;
            row.querySelector('[name="classe"]').value = enfant.classe;
            
            // Check restauration checkboxes
            enfant.restauration.forEach(day => {
                const cb = row.querySelector(`input[name="restauration"][value="${day}"]`);
                if (cb) cb.checked = true;
            });
        });
    }

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }

    // Close on backdrop click
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    function addEnfantRow() {
        const index = enfantsContainer.children.length;
        const row = document.createElement('div');
        row.className = 'enfant-row';
        row.innerHTML = `
            <div class="enfant-header">
                <h4>Enfant n°${index + 1}</h4>
                ${index > 0 ? `<button type="button" class="remove-enfant"><i class="ph ph-trash"></i></button>` : ''}
            </div>
            <div class="form-grid">
                <div class="form-section">
                    <label>Prénom</label>
                    <input type="text" name="prenom" required placeholder="Prénom">
                </div>
                <div class="form-section">
                    <label>Classe (2026-2027)</label>
                    <select name="classe" required>
                        <option value="PS">Petite Section</option>
                        <option value="MS">Moyenne Section</option>
                        <option value="GS">Grande Section</option>
                        <option value="CP">CP</option>
                        <option value="CE1">CE1</option>
                        <option value="CE2">CE2</option>
                        <option value="CM1">CM1</option>
                        <option value="CM2">CM2</option>
                    </select>
                </div>
            </div>
            <div class="form-section">
                <label>Jours de restauration (cantine)</label>
                <div class="checkbox-group">
                    <label><input type="checkbox" name="restauration" value="Lundi"> Lun</label>
                    <label><input type="checkbox" name="restauration" value="Mardi"> Mar</label>
                    <label><input type="checkbox" name="restauration" value="Jeudi"> Jeu</label>
                    <label><input type="checkbox" name="restauration" value="Vendredi"> Ven</label>
                </div>
            </div>
        `;
        
        if (index > 0) {
            row.querySelector('.remove-enfant').addEventListener('click', () => {
                row.remove();
                updateEnfantLabels();
            });
        }
        
        enfantsContainer.appendChild(row);
    }

    function updateEnfantLabels() {
        Array.from(enfantsContainer.children).forEach((row, idx) => {
            row.querySelector('h4').textContent = `Enfant n°${idx + 1}`;
        });
    }

    if (addEnfantBtn) {
        addEnfantBtn.addEventListener('click', addEnfantRow);
    }

    // Form Submission
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('submitFormBtn');
            const originalText = submitBtn.innerHTML;
            
            try {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="ph ph-circle-notch animate-spin"></i> Envoi en cours...';

                const formData = new FormData(form);
                const nomFamille = formData.get('nomFamille');
                const fraisAnnexes = formData.get('fraisAnnexes');
                const modeReglement = formData.get('modeReglement');
                const autorisationImage = formData.get('autorisationImage') === 'on';

                const enfants = [];
                const rows = enfantsContainer.querySelectorAll('.enfant-row');
                rows.forEach(row => {
                    const prenom = row.querySelector('[name="prenom"]').value;
                    const classe = row.querySelector('[name="classe"]').value;
                    const restauration = Array.from(row.querySelectorAll('[name="restauration"]:checked')).map(cb => cb.value);
                    enfants.push({ prenom, classe, restauration });
                });

                const reinscriptionData = {
                    user_id: session.user.id,
                    nom_famille: nomFamille,
                    enfants: enfants,
                    frais_annexes: fraisAnnexes,
                    autorisation_image: autorisationImage,
                    mode_reglement: modeReglement
                };

                let result;
                if (currentReinscriptionId) {
                    result = await supabaseClient
                        .from('reinscriptions')
                        .update(reinscriptionData)
                        .eq('id', currentReinscriptionId);
                } else {
                    result = await supabaseClient
                        .from('reinscriptions')
                        .insert([reinscriptionData]);
                }

                if (result.error) throw result.error;

                alert(currentReinscriptionId ? 'Votre réinscription a été mise à jour !' : 'Votre réinscription a été enregistrée avec succès !');
                modal.classList.remove('active');
                form.reset();
                enfantsContainer.innerHTML = '';
                
            } catch (err) {
                console.error('Erreur lors de la réinscription:', err);
                alert('Une erreur est survenue lors de l\'envoi du formulaire. Veuillez réessayer.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }
});
