document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    let email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('error-msg');
    const spinner = document.getElementById('spinner');
    const btnText = document.getElementById('btn-text');

    // UI state loading
    errorMsg.style.display = 'none';
    spinner.style.display = 'inline-block';
    btnText.style.display = 'none';

    // Supabase a besoin d'un format email. Si l'utilisateur entre juste "Admin2012", on rajoute le domaine silencieusement.
    if (!email.includes('@')) {
        email = email + '@ecolesaintefaustine.fr';
    }

    // 1. Attempt sign in with Supabase
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (authError) {
        // Show auth error
        errorMsg.style.display = 'block';
        errorMsg.textContent = "Erreur de connexion : " + authError.message;
        spinner.style.display = 'none';
        btnText.style.display = 'inline-block';
        return;
    }

    // 2. Vérification du rôle depuis la table SQL user_roles
    const userId = authData.user.id;
    const { data: roleData, error: roleError } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('id', userId)
        .single();

    if (roleError || !roleData) {
        // L'utilisateur n'a pas de rôle dans la bdd ou la table n'a pas été créée correctement
        await supabaseClient.auth.signOut();
        errorMsg.style.display = 'block';
        errorMsg.textContent = "Accès refusé : Aucun rôle défini dans la table user_roles pour cet utilisateur. Avez-vous exécuté le script SQL ?";
        spinner.style.display = 'none';
        btnText.style.display = 'inline-block';
        return;
    }

    // 3. Routage en fonction du rôle (Admin ou Parent)
    if (roleData.role === 'admin') {
        window.location.href = 'admin-content.html';
    } else if (roleData.role === 'parent') {
        window.location.href = 'parents.html';
    } else {
        await supabaseClient.auth.signOut();
        errorMsg.style.display = 'block';
        errorMsg.textContent = "Erreur interne : Rôle inconnu ('" + roleData.role + "').";
        spinner.style.display = 'none';
        btnText.style.display = 'inline-block';
    }
});
