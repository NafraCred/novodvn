// assets/core.js
// Cliente Supabase e helpers compartilhados para o front-end
// Versão completa e autossuficiente para uso em páginas estáticas

// Importa Supabase via CDN (ESM)
import { createClient } from "https://esm.sh/@supabase/supabase-js"

// Configuração do seu projeto Supabase (use apenas a anon/publishable key no front-end)
const SUPABASE_URL = "https://lgynnopjdcvporaplwbb.supabase.co"
const SUPABASE_KEY = "sb_publishable_o4qtolGvFdYJpaAkCV-WvQ_G2TS1dkq"

// Cria o cliente garantindo persistência de sessão e auto refresh do token
// IMPORTANTE: storage = sessionStorage -> a sessão expira ao fechar a aba/navegador.
// Navegar entre páginas (sem fechar) mantém o login normalmente.
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: window.sessionStorage
  }
})

/* ===========================
   DEBUG / SESSÃO / AUTENTICAÇÃO
   =========================== */

/**
 * DEBUG: imprime sessão e usuário no console
 * Use apenas em desenvolvimento.
 */
export async function debugSession() {
  try {
    const sess = await supabase.auth.getSession()
    console.log('DEBUG supabase.getSession ->', sess)
    const user = await supabase.auth.getUser()
    console.log('DEBUG supabase.getUser ->', user)
  } catch (err) {
    console.error('DEBUG erro ao obter sessão/usuário:', err)
  }
}

/**
 * Força salvar a sessão localmente (útil apenas para diagnóstico)
 * Recebe um objeto session retornado pelo signInWithPassword (res.data.session)
 */
export async function forceSetSession(session) {
  try {
    if (!session) return null
    const { error } = await supabase.auth.setSession(session)
    if (error) console.warn('forceSetSession erro:', error)
    return { ok: !error, error }
  } catch (err) {
    console.error('forceSetSession catch:', err)
    return { ok: false, error: err }
  }
}

/**
 * Observabilidade: loga mudanças de autenticação
 * (útil para ver onAuthStateChange em tempo real)
 */
supabase.auth.onAuthStateChange((event, session) => {
  console.log('onAuthStateChange ->', event, session)
})

/**
 * Helper: faz signOut e limpa storages locais usados pela aplicação
 */
export async function signOutAndClear() {
  try {
    await supabase.auth.signOut()
  } catch (err) {
    console.error('Erro ao deslogar:', err)
  } finally {
    try {
      sessionStorage.clear()
    } catch (e) { /* ignore */ }
  }
}

/* ===========================
   CRUD GENÉRICO E HELPERS
   =========================== */

/**
 * Função genérica para salvar/ler dados
 * - Se value === undefined: retorna todos os registros da tabela
 * - Se value definido: insere o registro
 */
export async function store(table, value) {
  if (value === undefined) {
    const { data, error } = await supabase.from(table).select('*')
    if (error) {
      console.error(error)
      alert("Erro ao buscar dados: " + error.message)
      return null
    }
    return data
  } else {
    const { data, error } = await supabase.from(table).insert([value])
    if (error) {
      console.error(error)
      alert("Erro ao salvar: " + error.message)
      return null
    }
    alert("Registro salvo com sucesso!")

    // 🔄 Atualiza automaticamente se existir função de atualização global
    if (typeof window[`carregar${capitalize(table)}`] === "function") {
      try { window[`carregar${capitalize(table)}`]() } catch (e) { /* ignore */ }
    }

    return data
  }
}

/**
 * Função genérica para atualizar dados
 */
export async function update(table, id, value) {
  const { data, error } = await supabase
    .from(table)
    .update(value)
    .eq("id", id)

  if (error) {
    console.error(error)
    alert("Erro ao atualizar: " + error.message)
    return null
  }
  alert("Registro atualizado com sucesso!")

  // 🔄 Atualiza automaticamente se existir função de atualização global
  if (typeof window[`carregar${capitalize(table)}`] === "function") {
    try { window[`carregar${capitalize(table)}`]() } catch (e) { /* ignore */ }
  }

  return data
}

// Helper para capitalizar nome da tabela (ex.: contratos -> Contratos)
function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/* ===========================
   REALTIME
   =========================== */

/**
 * Realtime listener para uma tabela
 * callback(payload) será chamado em cada mudança
 */
export function enableRealtime(table, callback) {
  try {
    supabase
      .channel(`${table}-changes`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, payload => {
        console.log(`Mudança detectada em ${table}:`, payload)
        if (typeof callback === "function") {
          try { callback(payload) } catch (e) { console.error('callback realtime erro:', e) }
        }
      })
      .subscribe()
  } catch (err) {
    console.error('enableRealtime erro:', err)
  }
}

/* ===========================
   PERFIL / USUÁRIOS
   =========================== */

/**
 * Helper utilitário: busca perfil na tabela 'usuarios' pelo email
 * Retorna objeto perfil ou null
 */
export async function fetchPerfilByEmail(email) {
  if (!email) return null
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id,nome,email,categoria,vendedor_id')
      .eq('email', email)
      .single()
    if (error) {
      // não tratar como erro crítico; pode não existir perfil
      console.warn('fetchPerfilByEmail warn:', error.message)
      return null
    }
    return data || null
  } catch (err) {
    console.error('fetchPerfilByEmail erro:', err)
    return null
  }
}

/* ===========================
   UTILITÁRIOS ADICIONAIS
   =========================== */

/**
 * Helper para obter sessão atual (retorna session.data.session ou null)
 */
export async function getCurrentSession() {
  try {
    const { data } = await supabase.auth.getSession()
    return data?.session ?? null
  } catch (err) {
    console.error('getCurrentSession erro:', err)
    return null
  }
}

/**
 * Helper para obter usuário atual (retorna user ou null)
 */
export async function getCurrentUser() {
  try {
    const { data } = await supabase.auth.getUser()
    return data?.user ?? null
  } catch (err) {
    console.error('getCurrentUser erro:', err)
    return null
  }
}
