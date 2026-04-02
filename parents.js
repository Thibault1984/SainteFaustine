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
});
