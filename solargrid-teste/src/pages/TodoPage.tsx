import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import styles from './TodoPage.module.css';

interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

export function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Busca dados do Supabase (Persistência)
  async function loadFromDatabase() {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('id', { ascending: true });
    
    if (!error) setTodos(data || []);
  }

  // Lógica de "Limpar e Carregar" solicitada pelo Vicente
  async function handleSync() {
    setIsSyncing(true);
    try {
      // 1. Fetch na API externa
      const res = await fetch('https://jsonplaceholder.typicode.com/todos');
      const data = await res.json();
      const payload = data.slice(0, 20); // Pegando 20 itens para o teste

      // 2. Limpa a tabela existente (.neq('id', 0) garante que deleta tudo)
      await supabase.from('todos').delete().neq('id', 0);

      // 3. Insere os novos dados de forma persistente
      const { error } = await supabase.from('todos').insert(payload);

      if (error) throw error;
      
      await loadFromDatabase();
      alert('Tabela limpa e sincronizada com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro na sincronização.');
    } finally {
      setIsSyncing(false);
    }
  }

  useEffect(() => {
    loadFromDatabase();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Tarefas Persistentes</h2>
        <button 
          className={styles.syncButton} 
          onClick={handleSync} 
          disabled={isSyncing}
        >
          {isSyncing ? 'Processando...' : '🔄 Limpar e Carregar Banco'}
        </button>
      </div>

      <table className={styles.todoTable}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Título</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {todos.map(todo => (
            <tr key={todo.id}>
              <td>{todo.id}</td>
              <td>{todo.title}</td>
              <td>
                <span className={todo.completed ? styles.done : styles.pending}>
                  {todo.completed ? '✅ Concluído' : '⏳ Pendente'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}