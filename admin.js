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
    window.currentGalleryImages = [];
    const renderAdminGallery = () => {
        const list = document.getElementById('admin-gallery-list');
        if (!list) return;
        list.innerHTML = '';
        if (window.currentGalleryImages.length === 0) {
            list.innerHTML = '<p style="color: #64748b;">Aucune image dans la galerie pour le moment.</p>';
            return;
        }
        window.currentGalleryImages.forEach((img, idx) => {
            list.innerHTML += `
                <div style="display:flex; align-items:center; gap: 1rem; padding: 1rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <img src="${img.url}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 4px;">
                    <div style="flex:1;">
                        <p style="font-weight: 600; margin-bottom: 0.25rem;">${img.caption || 'Sans légende'}</p>
                    </div>
                    <button type="button" class="btn btn-outline" style="color: #ef4444; border-color: #ef4444;" onclick="deleteGalleryImage(${idx})">
                        <i class="ph ph-trash"></i>
                    </button>
                </div>
            `;
        });
    };

    window.deleteGalleryImage = async (idx) => {
        if (!confirm('Voulez-vous vraiment supprimer cette image de la galerie ?')) return;
        window.currentGalleryImages.splice(idx, 1);
        renderAdminGallery();
        
        await window.supabaseClient.from('site_content').upsert({ 
            id: 'gallery-data', 
            content: JSON.stringify(window.currentGalleryImages), 
            type: 'json' 
        }, { onConflict: 'id' });
        showToast("Image supprimée avec succès !");
    };

    const loadData = async () => {
        const { data, error } = await window.supabaseClient.from('site_content').select('*');
        if (error) {
            console.error("Erreur de chargement:", error);
            return;
        }

        data.forEach(item => {
            if (item.id === 'gallery-data') {
                try {
                    window.currentGalleryImages = JSON.parse(item.content);
                } catch(e) { window.currentGalleryImages = []; }
                renderAdminGallery();
                return;
            }
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

    // Gestion de la Galerie (illimitée)
    const uploadNewGalleryImgInput = document.getElementById('uploadNewGalleryImg');
    const newGalleryImgLabel = document.getElementById('newGalleryImgLabel');
    const btnAddGalleryImage = document.getElementById('btnAddGalleryImage');
    const galleryUploadStatus = document.getElementById('galleryUploadStatus');
    const newGalleryCaption = document.getElementById('new-gallery-caption');

    if (uploadNewGalleryImgInput && btnAddGalleryImage && newGalleryCaption) {
        uploadNewGalleryImgInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                newGalleryImgLabel.textContent = file.name;
                btnAddGalleryImage.disabled = false;
            } else {
                newGalleryImgLabel.textContent = "Cliquez pour choisir un fichier";
                btnAddGalleryImage.disabled = true;
            }
        });

        btnAddGalleryImage.addEventListener('click', async () => {
            const file = uploadNewGalleryImgInput.files[0];
            if (!file) return;

            galleryUploadStatus.style.display = "block";
            galleryUploadStatus.textContent = "Téléchargement en cours...";
            galleryUploadStatus.style.color = "#eab308";
            btnAddGalleryImage.disabled = true;

            try {
                const fileExt = file.name.split('.').pop();
                const fileName = `gallery-${Date.now()}.${fileExt}`;
                const filePath = `public/gallery/${fileName}`;

                const { error: uploadError } = await window.supabaseClient.storage
                    .from(SUPABASE_BUCKET)
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: publicUrlData } = window.supabaseClient.storage
                    .from(SUPABASE_BUCKET)
                    .getPublicUrl(filePath);

                const publicUrl = publicUrlData.publicUrl;

                window.currentGalleryImages.push({
                    url: publicUrl,
                    caption: newGalleryCaption.value.trim()
                });

                const { error: dbError } = await window.supabaseClient.from('site_content').upsert({
                    id: 'gallery-data',
                    content: JSON.stringify(window.currentGalleryImages),
                    type: 'json'
                }, { onConflict: 'id' });

                if (dbError) throw dbError;

                galleryUploadStatus.style.color = "#22c55e";
                galleryUploadStatus.textContent = "✔ Image ajoutée !";
                showToast("Image ajoutée à la galerie !");
                
                uploadNewGalleryImgInput.value = "";
                newGalleryCaption.value = "";
                newGalleryImgLabel.textContent = "Cliquez pour choisir un fichier";
                setTimeout(() => { galleryUploadStatus.style.display = "none"; }, 3000);
                
                renderAdminGallery();
            } catch (err) {
                console.error("Upload error:", err);
                galleryUploadStatus.style.color = "#ef4444";
                galleryUploadStatus.textContent = "❌ Erreur de l'upload.";
                alert("Erreur: " + err.message);
                btnAddGalleryImage.disabled = false;
            }
        });
    }

});
