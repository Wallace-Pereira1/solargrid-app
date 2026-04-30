import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import styles from './App.module.css';

function App() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [feed, setFeed] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('autor');
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) buildFeed();
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) buildFeed();
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const buildFeed = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id, title, body,
          profiles (id, name, username, company_name),
          comments (id, body, author_email)
        `)
        .order('id', { ascending: false });

      if (error) throw error;
      setFeed(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDatabase = async () => {
    setLoading(true);
    try {
      const [u, p, c] = await Promise.all([
        fetch('https://jsonplaceholder.typicode.com/users').then(r => r.json()),
        fetch('https://jsonplaceholder.typicode.com/posts').then(r => r.json()),
        fetch('https://jsonplaceholder.typicode.com/comments').then(r => r.json())
      ]);

      await supabase.from('comments').delete().neq('id', 0);
      await supabase.from('posts').delete().neq('id', 0);
      await supabase.from('profiles').delete().neq('id', 0);

      await supabase.from('profiles').insert(u.map((user: any) => ({
        id: user.id, name: user.name, username: user.username,
        email: user.email, company_name: user.company.name, website: user.website
      })));

      await supabase.from('posts').insert(p.map((post: any) => ({
        id: post.id, user_id: post.userId, title: post.title, body: post.body
      })));

      await supabase.from('comments').insert(c.map((comment: any) => ({
        post_id: comment.postId, author_name: comment.name,
        author_email: comment.email, body: comment.body
      })));

      await buildFeed();
      alert('SolarGrid Sincronizado!');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert('Erro: ' + error.message);
  };

  const filteredFeed = feed.filter(post => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    switch (filterType) {
      case 'autor':
        return (post.profiles?.name?.toLowerCase().includes(term) || post.profiles?.username?.toLowerCase().includes(term));
      case 'empresa':
        return post.profiles?.company_name?.toLowerCase().includes(term);
      case 'comentario':
        return post.comments?.some((c: any) => (c.body || "").toLowerCase().includes(term));
      default: return true;
    }
  });

  if (!session) {
    return (
      <div className={styles.loginWrapper}>
        <div className={styles.loginCard}>
          <h2 style={{ color: '#0b1b35', marginBottom: '20px' }}>SolarGrid Login</h2>
          <form onSubmit={handleLogin}>
            <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} className={styles.loginInput} required />
            <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} className={styles.loginInput} required />
            <button type="submit" className={styles.btnLogin}>Acessar</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${isDarkMode ? styles.darkMode : ''}`}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <span>SolarGrid</span>
            <small>Social</small>
          </div>
          <div className={styles.navActions}>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className={styles.btnMode}>
              {isDarkMode ? '☀️ Claro' : '🌙 Escuro'}
            </button>
            <button onClick={handleUpdateDatabase} disabled={loading} className={styles.btnSync}>
              {loading ? 'Aguarde...' : 'Sincronizar'}
            </button>
            <button onClick={() => supabase.auth.signOut()} className={styles.btnLogout}>Sair</button>
          </div>
        </div>
      </header>

      <main className={styles.mainContent}>
        <section className={styles.card}>
          <div className={styles.filterGroup}>
            {['@autor', 'empresa', 'comentario'].map(type => (
              <label key={type} className={styles.radioLabel}>
                <input type="radio" name="filter" checked={filterType === type} onChange={() => setFilterType(type)} />
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </label>
            ))}
          </div>
          <input 
            type="text" 
            placeholder={`Filtrar por ${filterType}...`} 
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </section>

        {loading && feed.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text)' }}>Carregando dados...</p>
        ) : (
          filteredFeed.map(post => (
            <article key={post.id} className={styles.card}>
              <div className={styles.authorArea}>
                <div className={styles.avatar}>{post.profiles?.name?.[0]}</div>
                <div>
                  <h4 className={styles.authorName}>{post.profiles?.name} <span>@{post.profiles?.username}</span></h4>
                  <div className={styles.companyName}>{post.profiles?.company_name}</div>
                </div>
              </div>
              <h3 className={styles.postTitle}>{post.title}</h3>
              <p className={styles.postBody}>{post.body}</p>
            </article>
          ))
        )}
      </main>

      <footer className={styles.footer}>
        <p><strong>SolarGrid Social v2.0</strong></p>
        <p>Desenvolvido por <span>Wallace</span>, solicitado por <span>Vicente</span></p>
      </footer>
    </div>
  );
}

export default App;