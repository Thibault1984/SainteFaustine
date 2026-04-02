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
});
