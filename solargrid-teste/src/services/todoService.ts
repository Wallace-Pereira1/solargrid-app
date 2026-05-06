import { supabase } from '../lib/supabase';

// Interface para garantir tipagem forte no projeto
export interface Todo {
  id: number;
  user_id: number;
  title: string;
  completed: boolean;
}

export const todoService = {
  /**
   * Busca as tarefas que já estão salvas no seu banco de dados Supabase.
   */
  async getPersistedTodos(): Promise<Todo[]> {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error("Erro ao buscar tarefas do banco:", error.message);
      throw error;
    }
    
    return data || [];
  },

  /**
   * Sincroniza dados da API externa com o seu banco de dados.
   * Aplica a lógica de "Limpa e Carrega".
   */
  async syncExternalTodos(): Promise<void> {
    try {
      // 1. Busca os dados na API do JSONPlaceholder
      const response = await fetch('https://jsonplaceholder.typicode.com/todos');
      if (!response.ok) throw new Error('Erro ao conectar com a API externa');
      
      const externalData = await response.json();
      
      // 2. Mapeia os dados convertendo userId para user_id (padrão do seu banco)
      const payload = externalData.slice(0, 20).map((t: any) => ({
        id: t.id,
        user_id: t.userId, // <--- Conversão crucial para evitar o erro PGRST204
        title: t.title,
        completed: t.completed
      }));

      // 3. Limpa a tabela atual antes de inserir os novos (Evita duplicatas)
      const { error: deleteError } = await supabase.from('todos').delete().neq('id', 0);
      if (deleteError) throw deleteError;

      // 4. Insere os 20 itens mapeados no Supabase
      const { error: insertError } = await supabase.from('todos').insert(payload);
      if (insertError) throw insertError;

    } catch (error) {
      console.error("Erro no processo de sincronização:", error);
      throw error;
    }
  },

  /**
   * Limpa permanentemente todos os registros da tabela 'todos'.
   */
  async clearTodos(): Promise<void> {
    const { error } = await supabase
      .from('todos')
      .delete()
      .neq('id', 0); // Deleta tudo onde o ID não é zero (ou seja, tudo)

    if (error) {
      console.error("Erro ao limpar a tabela de tarefas:", error.message);
      throw error;
    }
  }
};