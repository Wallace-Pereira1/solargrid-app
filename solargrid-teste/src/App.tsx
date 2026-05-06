import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { todoService } from './services/todoService';
import { postService } from './services/postService';
import type { Todo } from './services/todoService';
import styles from './App.module.css';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [feed, setFeed] = useState<any[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [activeTab, setActiveTab] = useState<'feed' | 'todos'>('feed');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('autor');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadAllData();
    });
  }, []);

  const loadAllData = async () => {
    try {
      const [postsData, todosData] = await Promise.all([
        postService.getFeed(),
        todoService.getPersistedTodos()
      ]);
      setFeed(postsData);
      setTodos(todosData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSyncTodos = async () => {
    setLoading(true);
    try {
      await todoService.syncExternalTodos();
      await loadAllData();
      alert('Tarefas sincronizadas!');
    } catch (err) {
      alert('Erro na sincronização.');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncFeed = async () => {
    setLoading(true);
    try {
      const [u, p] = await Promise.all([
        fetch('https://jsonplaceholder.typicode.com/users').then(r => r.json()),
        fetch('https://jsonplaceholder.typicode.com/posts').then(r => r.json())
      ]);

      await supabase.from('posts').delete().neq('id', 0);
      await supabase.from('profiles').delete().neq('id', 0);

      await supabase.from('profiles').insert(u.map((user: any) => ({
        id: user.id, name: user.name, username: user.username,
        email: user.email, company_name: user.company.name
      })));

      await supabase.from('posts').insert(p.map((post: any) => ({
        id: post.id, user_id: post.userId, title: post.title, body: post.body
      })));

      await loadAllData();
      alert('Feed sincronizado!');
    } catch (err) {
      alert('Erro ao sincronizar feed.');
    } finally {
      setLoading(false);
    }
  };

  const filteredFeed = feed.filter(post => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    if (filterType === 'autor') return post.profiles?.name?.toLowerCase().includes(term);
    return post.title?.toLowerCase().includes(term);
  });

  if (!session) return null;

  return (
    <div className={`${styles.container} ${isDarkMode ? styles.darkMode : ''}`}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>SolarGrid <span>Social</span></div>
          <nav className={styles.nav}>
            <button onClick={() => setActiveTab('feed')} className={activeTab === 'feed' ? styles.activeTab : styles.btnNav}>Feed</button>
            <button onClick={() => setActiveTab('todos')} className={activeTab === 'todos' ? styles.activeTab : styles.btnNav}>Tarefas</button>
          </nav>
          <div className={styles.navActions}>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className={styles.btnMode}>{isDarkMode ? '☀️' : '🌙'}</button>
            <button onClick={() => supabase.auth.signOut()} className={styles.btnLogout}>Sair</button>
          </div>
        </div>
      </header>

      <main className={styles.mainContent}>
        {activeTab === 'feed' ? (
          <>
            <section className={styles.filterCard}>
              <div className={styles.filterHeader}>
                <div className={styles.filterGroup}>
                  <label><input type="radio" checked={filterType === 'autor'} onChange={() => setFilterType('autor')} /> Autor</label>
                  <label><input type="radio" checked={filterType === 'titulo'} onChange={() => setFilterType('titulo')} /> Título</label>
                </div>
                <button onClick={handleSyncFeed} className={styles.btnSync}>🔄 Sincronizar Feed</button>
              </div>
              <input 
                type="text" 
                placeholder={`Pesquisar por ${filterType}...`} 
                className={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </section>

            {filteredFeed.map(post => (
  <article key={post.id} className={styles.card}>
    <div className={styles.authorHeader}>
      {/* Avatar Redondo com Foto Real */}
      <img 
        src={`https://picsum.photos/seed/${post.profiles?.id}/300/300`} 
        alt={post.profiles?.name}
        className={styles.avatarImg}
      />
      <div>
        <h4 className={styles.authorName}>{post.profiles?.name}</h4>
        <span className={styles.companyName}>{post.profiles?.company_name || 'SolarGrid Partner'}</span>
      </div>
    </div>
    <h3 className={styles.postTitle}>{post.title}</h3>
    <p className={styles.postBody}>{post.body}</p>
  </article>
))}
          </>
        ) : (
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>Tarefas Persistentes</h3>
              <button onClick={handleSyncTodos} className={styles.btnSync}>🔄 Sincronizar Tarefas</button>
            </div>
            {/* ... dentro do seu main, na condição da aba 'todos' ... */}
<table className={styles.todoTable}>
  <thead>
    <tr>
      <th>ID</th>
      <th>User ID</th> {/* Nova coluna adicionada aqui */}
      <th>Título</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    {todos.map(todo => (
      <tr key={todo.id}>
        <td>{todo.id}</td>
        <td>{todo.user_id}</td> {/* Exibindo o valor que vem do banco */}
        <td className={styles.todoTitleCell}>{todo.title}</td>
        <td>
          <span className={todo.completed ? styles.statusDone : styles.statusPending}>
            {todo.completed ? '✓ Concluído' : 'Pendente'}
          </span>
        </td>
      </tr>
    ))}
  </tbody>
</table>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;