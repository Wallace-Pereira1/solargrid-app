import { supabase } from '../lib/supabase';

export interface Todo {
  id: number;
  user_id: number;
  title: string;
  completed: boolean;
}

export const todoService = {
  // Lógica de Sincronização: Limpa o banco e carrega novos da API
  async syncExternalTodos(): Promise<void> {
    // 1. Busca na API externa
    const response = await fetch('https://jsonplaceholder.typicode.com/todos');
    if (!response.ok) throw new Error('Falha ao buscar dados da API');
    
    const externalData = await response.json();
    
    // 2. Mapeia convertendo de userId (API) para user_id (Banco)
    const payload = externalData.slice(0, 20).map((t: any) => ({
      id: t.id,
      user_id: t.userId, 
      title: t.title,
      completed: t.completed
    }));

    // 3. Deleta os registros antigos (Persistência)
    const { error: deleteError } = await supabase.from('todos').delete().neq('id', 0);
    if (deleteError) throw deleteError;

    // 4. Insere os novos registros mapeados
    const { error: insertError } = await supabase.from('todos').insert(payload);
    if (insertError) throw insertError;
  },

  // Busca os dados que já estão salvos no banco
  async getPersistedTodos(): Promise<Todo[]> {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('id', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }
};