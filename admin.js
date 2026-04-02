document.addEventListener('DOMContentLoaded', async () => {

    const SUPABASE_BUCKET = 'school_assets';

    // --- SUPABASE SESSION SECURITY ---
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    const { data: roleData, error: roleError } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('id', session.user.id)
        .single();
    
    if (roleError || !roleData || roleData.role !== 'admin') {
        alert("Accès refusé de sécurité : Vous n'avez pas le rôle administrateur.");
        await window.supabaseClient.auth.signOut();
        window.location.href = 'login.html';
        return;
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await window.supabaseClient.auth.signOut();
            window.location.href = 'login.html';
        });
    }
    // ---------------------------------

    const showToast = (message) => {
        const toast = document.getElementById('toast');
        toast.innerHTML = `<i class="ph-fill ph-check-circle"></i> ${message}`;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3500);
    };

    // 1. Charger les données actuelles
    const loadData = async () => {
        const { data, error } = await window.supabaseClient.from('site_content').select('*');
        if (error) {
            console.error("Erreur de chargement:", error);
            return;
        }

        data.forEach(item => {
            if (item.type === 'text') {
                const input = document.getElementById(item.id);
                if (input) {
                    input.value = item.content;
                    if (window.editors && window.editors[item.id]) {
                        window.editors[item.id].value = item.content;
                    }
                }
            } else if (item.type === 'file_url' || item.type === 'image_url') {
                const currentFileEl = document.getElementById(`current-${item.id}`);
                if (currentFileEl && item.content) {
                    const fileName = item.content.split('/').pop().split('?')[0];
                    currentFileEl.innerHTML = `Fichier actuel : <a href="${item.content}" target="_blank" style="color: var(--primary); text-decoration: underline; word-break: break-all;">${fileName}</a>`;
                }
            }
        });
    };

    await loadData();

    // Initialiser l'éditeur Jodit
    if (typeof Jodit !== 'undefined') {
        window.editors = {};
        const textareasToRichText = [
            'dynamic-ecole-content', 'dynamic-projet-content', 'dynamic-racines-content',
            'dynamic-institutrices-content', 'dynamic-direction-content', 'dynamic-locaux-content',
            'dynamic-tarifs-content', 'dynamic-horaires-content', 'dynamic-tenue-content',
            'dynamic-inscription-content', 'dynamic-reinscription-content'
        ];
        
        textareasToRichText.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                window.editors[id] = Jodit.make(el, {
                    language: 'fr',
                    buttons: "bold,italic,underline,strikethrough,|,ul,ol,|,font,fontsize,brush,paragraph,|,link,uploadImage,image,|,align,undo,redo,|,source",
                    height: 300,
                    extraButtons: [
                        {
                            name: 'uploadImage',
                            icon: 'upload',
                            tooltip: 'Télécharger une image depuis le PC',
                            exec: function (editor) {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*';
                                input.onchange = async (e) => {
                                    const file = e.target.files[0];
                                    if (!file) return;

                                    showToast("Téléchargement de l'image en cours...");

                                    try {
                                        const fileExt = file.name.split('.').pop();
                                        const fileName = `editor-img-${Date.now()}.${fileExt}`;
                                        const filePath = `public/editor/${fileName}`;

                                        const { error: uploadError } = await window.supabaseClient.storage
                                            .from(SUPABASE_BUCKET)
                                            .upload(filePath, file);

                                        if (uploadError) throw uploadError;

                                        const { data: publicUrlData } = window.supabaseClient.storage
                                            .from(SUPABASE_BUCKET)
                                            .getPublicUrl(filePath);

                                        const publicUrl = publicUrlData.publicUrl;
                                        
                                        editor.s.insertImage(publicUrl);
                                        showToast("Image insérée avec succès !");

                                    } catch (err) {
                                        console.error("Upload error:", err);
                                        alert("Erreur lors de l'upload: " + err.message);
                                    }
                                };
                                input.click();
                            }
                        }
                    ]
                });
            }
        });
    }

    document.getElementById('refreshBtn').addEventListener('click', loadData);

    // 2. Sauvegarder les textes
    document.getElementById('saveTextBtn').addEventListener('click', async () => {
        const textsToSave = [
            { id: 'site-hero-title', content: document.getElementById('site-hero-title')?.value, type: 'text' },
            { id: 'site-hero-desc', content: document.getElementById('site-hero-desc')?.value, type: 'text' },
            { id: 'dynamic-ecole-content', content: document.getElementById('dynamic-ecole-content')?.value, type: 'text' },
            { id: 'dynamic-projet-content', content: document.getElementById('dynamic-projet-content')?.value, type: 'text' },
            { id: 'dynamic-racines-content', content: document.getElementById('dynamic-racines-content')?.value, type: 'text' },
            { id: 'dynamic-institutrices-content', content: document.getElementById('dynamic-institutrices-content')?.value, type: 'text' },
            { id: 'dynamic-direction-content', content: document.getElementById('dynamic-direction-content')?.value, type: 'text' },
            { id: 'dynamic-locaux-content', content: document.getElementById('dynamic-locaux-content')?.value, type: 'text' },
            { id: 'dynamic-tarifs-content', content: document.getElementById('dynamic-tarifs-content')?.value, type: 'text' },
            { id: 'dynamic-horaires-content', content: document.getElementById('dynamic-horaires-content')?.value, type: 'text' },
            { id: 'dynamic-tenue-content', content: document.getElementById('dynamic-tenue-content')?.value, type: 'text' },
            { id: 'dynamic-inscription-content', content: document.getElementById('dynamic-inscription-content')?.value, type: 'text' },
            { id: 'dynamic-reinscription-content', content: document.getElementById('dynamic-reinscription-content')?.value, type: 'text' },
            { id: 'n1-tag', content: document.getElementById('n1-tag')?.value, type: 'text' },
            { id: 'n1-date', content: document.getElementById('n1-date')?.value, type: 'text' },
            { id: 'n1-title', content: document.getElementById('n1-title')?.value, type: 'text' },
            { id: 'n1-text', content: document.getElementById('n1-text')?.value, type: 'text' },
            { id: 'n2-tag', content: document.getElementById('n2-tag')?.value, type: 'text' },
            { id: 'n2-date', content: document.getElementById('n2-date')?.value, type: 'text' },
            { id: 'n2-title', content: document.getElementById('n2-title')?.value, type: 'text' },
            { id: 'n2-text', content: document.getElementById('n2-text')?.value, type: 'text' },
            { id: 'n3-tag', content: document.getElementById('n3-tag')?.value, type: 'text' },
            { id: 'n3-date', content: document.getElementById('n3-date')?.value, type: 'text' },
            { id: 'n3-title', content: document.getElementById('n3-title')?.value, type: 'text' },
            { id: 'n3-text', content: document.getElementById('n3-text')?.value, type: 'text' }
        ];

        for (const item of textsToSave) {
            if(!item.content) continue;
            
            await window.supabaseClient.from('site_content').upsert({ 
                id: item.id, 
                content: item.content, 
                type: item.type 
            }, { onConflict: 'id' });
        }

        showToast("Textes enregistrés avec succès !");
    });

    // 3. Gérer l'upload de fichiers
    const handleFileUpload = async (fileInputId, destId, statusId, fileTypeCategory) => {
        const input = document.getElementById(fileInputId);
        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const statusLabel = document.getElementById(statusId);
            statusLabel.style.display = "block";
            statusLabel.textContent = "Téléchargement vers Supabase en cours...";
            statusLabel.style.color = "#eab308"; // yellow

            try {
                // Créer un nom unique pour éviter le cache
                const fileExt = file.name.split('.').pop();
                const fileName = `${destId}-${Date.now()}.${fileExt}`;
                const filePath = `public/${fileName}`;

                // Upload au bucket
                const { error: uploadError } = await window.supabaseClient.storage
                    .from(SUPABASE_BUCKET)
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                // Récupérer l'URL publique
                const { data: publicUrlData } = window.supabaseClient.storage
                    .from(SUPABASE_BUCKET)
                    .getPublicUrl(filePath);

                const publicUrl = publicUrlData.publicUrl;

                // Mettre à jour la base de données
                const { error: dbError } = await window.supabaseClient.from('site_content').upsert({
                    id: destId,
                    content: publicUrl,
                    type: fileTypeCategory
                }, { onConflict: 'id' });

                if (dbError) throw dbError;

                statusLabel.style.color = "#22c55e"; // green
                statusLabel.textContent = "✔ Upload terminé et site mis à jour !";
                showToast("Fichier mis à jour !");
                
                // Mettre à jour l'affichage du fichier actuel
                const currentFileEl = document.getElementById(`current-${destId}`);
                if (currentFileEl) {
                    currentFileEl.innerHTML = `Fichier actuel : <a href="${publicUrl}" target="_blank" style="color: var(--primary); text-decoration: underline; word-break: break-all;">${fileName}</a>`;
                }

            } catch (err) {
                console.error("Upload error:", err);
                statusLabel.style.color = "#ef4444"; // red
                statusLabel.textContent = "❌ Erreur lors de l'upload.";
                alert("Erreur lors de l'upload: " + err.message);
            }
        });
    };

    handleFileUpload('uploadHeroBg', 'dynamic-hero-bg', 'heroBgStatus', 'image_url');
    // On mapped dynamic-inscription-pdf with content type file_url
    handleFileUpload('uploadPdf', 'dynamic-inscription-pdf', 'pdfStatus', 'file_url');
    handleFileUpload('uploadPdfRe', 'dynamic-reinscription-pdf', 'pdfStatusRe', 'file_url');

    // Fichiers liés aux actualités
    handleFileUpload('uploadFileN1', 'n1-link', 'statusN1', 'file_url');
    handleFileUpload('uploadFileN2', 'n2-link', 'statusN2', 'file_url');
    handleFileUpload('uploadFileN3', 'n3-link', 'statusN3', 'file_url');

});
