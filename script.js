document.addEventListener('DOMContentLoaded', async () => {

    // --- SESSION ET DÉCONNEXION GLOBALE ---
    if (window.supabaseClient) {
        try {
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            if (session) {
                const navActions = document.querySelector('.nav-actions');
                if (navActions) {
                    // Check role for dashboard link
                    let dashboardLink = '#';
                    const { data: roleData } = await window.supabaseClient
                        .from('user_roles')
                        .select('role')
                        .eq('id', session.user.id)
                        .single();
                    
                    if (roleData) {
                        if (roleData.role === 'admin') dashboardLink = 'admin-content.html';
                        if (roleData.role === 'parent') dashboardLink = 'parents.html';
                    }

                    // Rewrite the nav actions
                    navActions.innerHTML = `
                        <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                            <a href="${dashboardLink}" class="btn btn-outline" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;"><i class="ph ph-user-circle"></i> Mon Espace</a>
                            <button id="globalLogoutBtn" class="btn btn-outline" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; cursor:pointer; background: transparent;"><i class="ph ph-sign-out"></i> Déconnexion</button>
                        </div>
                        <a href="https://www.helloasso.com/associations/action-sociale-citoyenne-educative-du-poitou/formulaires/1" target="_blank" class="btn btn-primary d-none-mobile"><i class="ph ph-heart"></i> Faire un don</a>
                    `;

                    document.getElementById('globalLogoutBtn').addEventListener('click', async () => {
                        await window.supabaseClient.auth.signOut();
                        window.location.reload();
                    });
                }
            }
        } catch(e) {
            console.error("Erreur de session", e);
        }
    }
    // --------------------------------------
    
    // --- CMS / DYNAMIC DATA HYDRATION ---
    const localStore = localStorage.getItem('siteSainteFaustineData');
    if (localStore) {
        try {
            const data = JSON.parse(localStore);
            
            // Hero
            if(data.heroTitle) document.getElementById('site-hero-title').innerHTML = data.heroTitle;
            if(data.heroDesc) document.getElementById('site-hero-desc').innerHTML = data.heroDesc;
            
            // News
            data.news.forEach((item, index) => {
                const i = index + 1;
                const idTag = document.getElementById(`n${i}-tag`);
                const idDate = document.getElementById(`n${i}-date`);
                const idTitle = document.getElementById(`n${i}-title`);
                const idText = document.getElementById(`n${i}-text`);
                
                if(idTag) idTag.textContent = item.tag;
                if(idDate) idDate.textContent = item.date;
                if(idTitle) idTitle.textContent = item.title;
                if(idText) idText.textContent = item.text;
            });
        } catch(e) {
            console.error("Error loading CMS data", e);
        }
    }
    // ------------------------------------

    // 1. Navbar scroll effect
    const navbar = document.getElementById('navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // 2. Reveal on scroll animation
    const revealElements = document.querySelectorAll('.reveal');

    const revealOnScroll = () => {
        const windowHeight = window.innerHeight;
        const revealPoint = 100; // Trigger slightly before the element is fully in view

        revealElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            
            if (elementTop < windowHeight - revealPoint) {
                element.classList.add('active');
            }
        });
    };

    // Initial check on load
    revealOnScroll();

    // Listen on scroll
    window.addEventListener('scroll', revealOnScroll);

    // 3. Simple Mobile Menu Toggle
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    
    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            alert('Menu mobile cliqué ! Fonctionnalité à développer.');
        });
    }

    // 4. Smooth scrolling for internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});
