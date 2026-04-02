const SUPABASE_URL = 'https://adxonmwoutgmdxyitpri.supabase.co';
const SUPABASE_KEY = 'sb_publishable_XcWj9_yMT_N1Fl4zNBO4gA_zP_qdd-c';

// Initialize Supabase. `supabase` will be available globally for scripts loaded after this one.
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
