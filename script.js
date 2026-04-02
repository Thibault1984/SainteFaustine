document.addEventListener('DOMContentLoaded', () => {

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
