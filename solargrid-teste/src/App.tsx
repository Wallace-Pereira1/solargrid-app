import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { todoService } from './services/todoService';
import { postService } from './services/postService';
import type { Todo } from './services/todoService';
import styles from './App.module.css';

function App() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [feed, setFeed] = useState<any[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [activeTab, setActiveTab] = useState<'feed' | 'todos'>('feed');
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Estados de Filtro
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('autor');
  const [searchTodo, setSearchTodo] = useState('');
  const [todoFilterType, setTodoFilterType] = useState<'id' | 'title'>('title');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadAllData();
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadAllData();
    });

    return () => authListener.subscription.unsubscribe();
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
      console.error("Erro ao carregar dados:", err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert('Erro ao acessar: ' + error.message);
    setLoading(false);
  };

  // --- SINCRONIZAÇÃO ---
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

  const handleSyncTodos = async () => {
    setLoading(true);
    try {
      await todoService.syncExternalTodos();
      await loadAllData();
      alert('Tarefas sincronizadas!');
    } catch (err) {
      alert('Erro na sincronização de tarefas.');
    } finally {
      setLoading(false);
    }
  };

  // --- LIMPEZA ---
  const handleClearFeed = async () => {
    if (!window.confirm("Limpar todo o Feed?")) return;
    setLoading(true);
    try {
      await postService.clearFeed();
      setFeed([]);
      alert("Feed limpo!");
    } finally { setLoading(false); }
  };

  const handleClearTodos = async () => {
    if (!window.confirm("Limpar todas as tarefas?")) return;
    setLoading(true);
    try {
      await todoService.clearTodos();
      setTodos([]);
      alert("Tarefas limpas!");
    } finally { setLoading(false); }
  };

  // --- FILTROS ---
  const filteredFeed = feed.filter(post => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    if (filterType === 'autor') return post.profiles?.name?.toLowerCase().includes(term);
    return post.title?.toLowerCase().includes(term);
  });

  const filteredTodos = todos.filter(todo => {
    const term = searchTodo.toLowerCase().trim();
    let matchesText = true;
    if (term) {
      if (todoFilterType === 'id') matchesText = todo.id.toString().includes(term);
      else matchesText = todo.title.toLowerCase().includes(term);
    }
    let matchesStatus = true;
    if (statusFilter === 'completed') matchesStatus = todo.completed === true;
    if (statusFilter === 'pending') matchesStatus = todo.completed === false;
    return matchesText && matchesStatus;
  });

  if (!session) {
    return (
      <div className={styles.loginWrapper}>
        <div className={styles.loginCard}>
          <div className={styles.logo} style={{ color: '#0b1b35', marginBottom: '20px' }}>
            SolarGrid <span style={{ color: '#e1b12c' }}>Social</span>
          </div>
          <form onSubmit={handleLogin}>
            <input type="email" placeholder="E-mail" className={styles.loginInput} value={email} onChange={e => setEmail(e.target.value)} required />
            <input type="password" placeholder="Senha" className={styles.loginInput} value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="submit" className={styles.btnLogin} disabled={loading}>{loading ? 'Acessando...' : 'Acessar'}</button>
          </form>
        </div>
      </div>
    );
  }

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
                  <label className={styles.radioLabel}><input type="radio" checked={filterType === 'autor'} onChange={() => setFilterType('autor')} /> Autor</label>
                  <label className={styles.radioLabel}><input type="radio" checked={filterType === 'titulo'} onChange={() => setFilterType('titulo')} /> Título</label>
                </div>
                <button onClick={handleSyncFeed} disabled={loading} className={styles.btnSync}>🔄 Sincronizar Feed</button>
              </div>
              <input type="text" placeholder={`Pesquisar por ${filterType}...`} className={styles.searchInput} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </section>

            {filteredFeed.map(post => (
              <article key={post.id} className={styles.card}>
                <div className={styles.authorHeader}>
                  <img src={`https://picsum.photos/seed/${post.profiles?.id}/300/300`} alt="avatar" className={styles.avatarImg} />
                  <div>
                    <h4 className={styles.authorName}>{post.profiles?.name}</h4>
                    <span className={styles.companyName}>{post.profiles?.company_name || 'Partner'}</span>
                  </div>
                </div>
                <h3 className={styles.postTitle}>{post.title}</h3>
                <p className={styles.postBody}>{post.body}</p>
              </article>
            ))}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
              <button onClick={handleClearFeed} disabled={loading} className={styles.btnClear}>🗑️ Limpar Feed</button>
            </div>
          </>
        ) : (
          <section className={styles.card}>
            <div className={styles.cardHeader} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3>Tarefas Persistentes</h3>
              <button onClick={handleSyncTodos} disabled={loading} className={styles.btnSync}>🔄 Sincronizar Tarefas</button>
            </div>

            <div className={styles.todoFilterBar}>
              <div className={styles.filterGroup}>
                <label className={styles.radioLabel}><input type="radio" checked={todoFilterType === 'id'} onChange={() => setTodoFilterType('id')} /> ID</label>
                <label className={styles.radioLabel}><input type="radio" checked={todoFilterType === 'title'} onChange={() => setTodoFilterType('title')} /> Título</label>
              </div>
              <div className={styles.statusToggleGroup}>
                <button className={statusFilter === 'all' ? styles.activeStatusBtn : styles.statusBtn} onClick={() => setStatusFilter('all')}>Todos</button>
                <button className={statusFilter === 'completed' ? styles.activeStatusBtn : styles.statusBtn} onClick={() => setStatusFilter('completed')}>Check</button>
                <button className={statusFilter === 'pending' ? styles.activeStatusBtn : styles.statusBtn} onClick={() => setStatusFilter('pending')}>Pendente</button>
              </div>
            </div>

            <input type="text" placeholder={`Filtrar por ${todoFilterType}...`} className={styles.searchInput} value={searchTodo} onChange={(e) => setSearchTodo(e.target.value)} style={{ marginBottom: '20px' }} />
            
            <table className={styles.todoTable}>
              <thead><tr><th>ID</th><th>Título</th><th>Status</th></tr></thead>
              <tbody>
                {filteredTodos.map(todo => (
                  <tr key={todo.id}>
                    <td>{todo.id}</td>
                    <td className={styles.todoTitleCell}>{todo.title}</td>
                    <td><span className={todo.completed ? styles.statusDone : styles.statusPending}>{todo.completed ? '✓ Concluído' : 'Pendente'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
              <button onClick={handleClearTodos} disabled={loading} className={styles.btnClear}>🗑️ Limpar Tarefas</button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;