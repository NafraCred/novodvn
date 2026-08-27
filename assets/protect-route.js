// assets/protect-route.js
import { supabase } from './core.js';

/**
 * protectRoute
 * - Verifica sessão Supabase (getSession)
 * - Fallback para sessionStorage (legacy)
 * - Redireciona para /login.html se não autenticado
 * - Retorna { type, session } ou { type, legacyId }
 */
export async function protectRoute() {
  try {
    const { data } = await supabase.auth.getSession();
    const session = data?.session ?? null;
    if (session) {
      // sincroniza sessionStorage com metadata (opcional)
      try {
        const user = session.user;
        if (user) {
          if (user.user_metadata?.nome) sessionStorage.setItem('userNome', user.user_metadata.nome);
          if (user.user_metadata?.categoria) sessionStorage.setItem('userCategoria', String(user.user_metadata.categoria).toLowerCase());
        }
      } catch (e) { /* ignore */ }
      return { type: 'supabase', session };
    }

    // fallback legacy (se você usa sessionStorage)
    const legacyId = sessionStorage.getItem('userId');
    if (legacyId) return { type: 'legacy', legacyId };

    // nada encontrado: redireciona para login
    window.location.href = '/login.html';
    return null;
  } catch (err) {
    console.error('protectRoute erro:', err);
    const legacyId = sessionStorage.getItem('userId');
    if (legacyId) return { type: 'legacy', legacyId };
    window.location.href = '/login.html';
    return null;
  }
}
