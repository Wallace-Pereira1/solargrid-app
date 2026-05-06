import { supabase } from '../lib/supabase';

export const postService = {
  // Busca o Feed completo com os dados do Perfil associados
  async getFeed() {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id, 
        title, 
        body,
        profiles (
          id, 
          name, 
          username, 
          company_name
        )
      `)
      .order('id', { ascending: false });

    if (error) {
      console.error("Erro ao buscar feed:", error.message);
      throw error;
    }
    
    return data || [];
  },

  // Limpa todas as tabelas relacionadas ao Feed
  // Importante: Deletar em ordem para não quebrar chaves estrangeiras (Foreign Keys)
  async clearFeed(): Promise<void> {
    try {
      // 1. Limpa comentários
      const { error: errComments } = await supabase.from('comments').delete().neq('id', 0);
      if (errComments) throw errComments;

      // 2. Limpa posts
      const { error: errPosts } = await supabase.from('posts').delete().neq('id', 0);
      if (errPosts) throw errPosts;

      // 3. Limpa perfis
      const { error: errProfiles } = await supabase.from('profiles').delete().neq('id', 0);
      if (errProfiles) throw errProfiles;

    } catch (error) {
      console.error("Erro ao limpar tabelas do feed:", error);
      throw error;
    }
  }
};