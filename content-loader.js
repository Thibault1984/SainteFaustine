document.addEventListener('DOMContentLoaded', async () => {
    if (!window.supabaseClient) {
        console.error("Supabase client not initialized.");
        return;
    }

    try {
        // Fetch all site content
        const { data: contentData, error } = await window.supabaseClient
            .from('site_content')
            .select('*');

        if (error) {
            console.error("Error fetching site content:", error);
            return;
        }

        if (contentData && contentData.length > 0) {
            contentData.forEach(item => {
                const elementId = item.id;
                const element = document.getElementById(elementId);
                
                // Cas spécifique pour les dates clés
                if (elementId === 'dates-data') {
                    const datesGrid = document.getElementById('dynamic-dates-grid');
                    if (datesGrid && item.content) {
                        try {
                            const dates = JSON.parse(item.content);
                            datesGrid.innerHTML = '';
                            if (dates.length === 0) {
                                datesGrid.innerHTML = '<div class="no-dates-msg">Aucune date clé n\'est enregistrée pour l\'instant.</div>';
                            } else {
                                dates.sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(dateItem => {
                                    const dateObj = new Date(dateItem.date);
                                    const day = dateObj.toLocaleDateString('fr-FR', { day: '2-digit' });
                                    const monthYear = dateObj.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
                                    
                                    const cardObj = document.createElement('div');
                                    cardObj.className = 'date-card reveal';
                                    cardObj.innerHTML = `
                                        <div class="date-badge">
                                            <span class="day">${day}</span>
                                            <span class="month-year">${monthYear}</span>
                                        </div>
                                        <div class="date-info">
                                            <div class="date-theme">${dateItem.theme}</div>
                                            <h3 class="date-desc">${dateItem.description || ''}</h3>
                                        </div>
                                    `;
                                    datesGrid.appendChild(cardObj);
                                });
                            }
                        } catch(e) {
                            console.error("Erreur de format pour dates-data JSON", e);
                        }
                    }
                    return;
                }

                // Cas spécifique pour la galerie d'images
                if (elementId === 'gallery-data') {
                    const galleryGrid = document.getElementById('dynamic-gallery-grid');
                    if (galleryGrid && item.content) {
                        try {
                            const images = JSON.parse(item.content);
                            galleryGrid.innerHTML = '';
                            images.forEach((img, index) => {
                                // Alternance automatique des tailles (large, normal, normal, wide)
                                let extraClass = '';
                                if (index % 4 === 0) extraClass = 'large';
                                else if (index % 4 === 3) extraClass = 'wide';

                                const itemDiv = document.createElement('div');
                                itemDiv.className = `gallery-item ${extraClass}`;

                                const imgEl = document.createElement('img');
                                imgEl.src = img.url;
                                imgEl.alt = img.caption || 'Galerie';

                                itemDiv.addEventListener('click', () => {
                                    const lbImg = document.getElementById('lightbox-img');
                                    const lb = document.getElementById('lightbox');
                                    if (lbImg && lb) {
                                        lbImg.src = img.url;
                                        lb.classList.add('show');
                                    }
                                });

                                const captionDiv = document.createElement('div');
                                captionDiv.className = 'gallery-caption';
                                captionDiv.textContent = img.caption || '';

                                itemDiv.appendChild(imgEl);
                                itemDiv.appendChild(captionDiv);
                                galleryGrid.appendChild(itemDiv);
                            });
                        } catch (e) {
                            console.error("Erreur de format pour gallery-data JSON", e);
                        }
                    }
                    return;
                }

                // Si l'élément existe dans la page courante
                if (element) {
                    if (item.type === 'text') {
                        element.innerHTML = item.content;
                    } else if (item.type === 'image_url') {
                        element.src = item.content;
                    } else if (item.type === 'file_url') {
                        element.href = item.content;
                        // On cherche aussi s'il y a d'autres éléments utilisant ce lien dynamique
                        // comme dynamic-inscription-pdf-1, dynamic-inscription-pdf-2
                    }
                }
                
                // Cas spécifique pour le dossier d'inscription qui a de multiples liens
                if (elementId === 'dynamic-inscription-pdf') {
                    const link1 = document.getElementById('dynamic-inscription-pdf-1');
                    const link2 = document.getElementById('dynamic-inscription-pdf-2');
                    if (link1) link1.href = item.content;
                    if (link2) link2.href = item.content;
                }
            });
        }
    } catch (err) {
        console.error("Unexpected error loading content:", err);
    }
    
    // Fermeture de la Lightbox
    const lbContainer = document.getElementById('lightbox');
    if (lbContainer) {
        lbContainer.addEventListener('click', () => {
            lbContainer.classList.remove('show');
        });
    }
});
