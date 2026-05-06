import { supabase } from '../lib/supabase';

export async function syncTodos() {
  // 1. Puxa da API externa
  const res = await fetch('https://jsonplaceholder.typicode.com/todos');
  const data = await res.json();
  
  // 2. Prepara os dados (Tratando userId -> user_id)
  const payload = data.slice(0, 20).map((t: any) => ({
    id: t.id,
    user_id: t.userId, 
    title: t.title,
    completed: t.completed
  }));

  // 3. Limpa e joga no banco
  await supabase.from('todos').delete().neq('id', 0);
  const { error } = await supabase.from('todos').insert(payload);

  if (error) throw error;
  return payload;
}