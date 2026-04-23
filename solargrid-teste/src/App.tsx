import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

function App() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Estado para o Feed unificado
  const [feed, setFeed] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) buildFeed();
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) buildFeed();
    });
  }, []);

  // FUNÇÃO MESTRE: Monta o Feed relacionando os IDs
  const buildFeed = async () => {
    const { data, error } = await supabase.from('api_data').select('*');
    if (error || !data) return;

    // 1. Organiza os dados crus por tipo
    const users = data.filter(d => d.content.type === 'user').map(d => d.content);
    const posts = data.filter(d => d.content.type === 'post').map(d => d.content);
    const comments = data.filter(d => d.content.type === 'comment').map(d => d.content);

    // 2. Relaciona os dados (Tipo Reddit)
    const structuredFeed = posts.map(post => {
      return {
        ...post,
        author: users.find(u => u.id === post.userId), // Acha o autor do post
        replies: comments.filter(c => c.postId === post.id) // Acha os comentários do post
      };
    });

    setFeed(structuredFeed);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert('Erro: ' + error.message);
  };

  const handleUpdateDatabase = async () => {
    setLoading(true);
    try {
      const [u, p, c] = await Promise.all([
        fetch('https://jsonplaceholder.typicode.com/users').then(r => r.json()),
        fetch('https://jsonplaceholder.typicode.com/posts').then(r => r.json()),
        fetch('https://jsonplaceholder.typicode.com/comments').then(r => r.json())
      ]);

      const payload = [
        ...u.map((i: any) => ({ content: { type: 'user', ...i } })),
        ...p.map((i: any) => ({ content: { type: 'post', ...i } })),
        ...c.map((i: any) => ({ content: { type: 'comment', ...i } }))
      ];

      await supabase.from('api_data').delete().neq('id', 0);
      await supabase.from('api_data').insert(payload);
      
      await buildFeed();
      alert('Feed sincronizado!');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div style={{ padding: '50px', background: '#121212', minHeight: '100vh', color: 'white' }}>
        <h2>Login SolarGrid Feed</h2>
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ padding: '10px', display: 'block', marginBottom: '10px', width: '300px' }} />
          <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} style={{ padding: '10px', display: 'block', marginBottom: '10px', width: '300px' }} />
          <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer' }}>Entrar</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', background: '#121212', minHeight: '100vh', color: '#e8eaed', fontFamily: 'sans-serif' }}>
      <header style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '20px' }}>
        <h1 style={{ color: '#0070f3' }}>SolarGrid Social</h1>
        <div>
          <button onClick={handleUpdateDatabase} disabled={loading} style={{ marginRight: '10px', background: '#0070f3', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '20px', cursor: 'pointer' }}>
            {loading ? 'Sincronizando...' : '🔄 Atualizar Feed'}
          </button>
          <button onClick={() => supabase.auth.signOut()} style={{ background: 'transparent', color: '#aaa', border: '1px solid #333', padding: '10px 15px', borderRadius: '20px', cursor: 'pointer' }}>Sair</button>
        </div>
      </header>

      <main style={{ maxWidth: '800px', margin: '20px auto' }}>
        {feed.map((post) => (
          <div key={post.id} style={{ background: '#1e1e1e', border: '1px solid #333', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
            {/* Header do Post: Autor */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', gap: '10px' }}>
              <div style={{ width: '35px', height: '35px', background: '#0070f3', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {post.author?.name[0]}
              </div>
              <div>
                <span style={{ fontWeight: 'bold', display: 'block' }}>u/{post.author?.username || 'User_'+post.userId}</span>
                <small style={{ color: '#888' }}>{post.author?.company?.name}</small>
              </div>
            </div>

            {/* Conteúdo do Post */}
            <h2 style={{ fontSize: '18px', margin: '10px 0' }}>{post.title}</h2>
            <p style={{ color: '#ccc', lineHeight: '1.5' }}>{post.body}</p>

            {/* Seção de Comentários (Reddit Style) */}
            <div style={{ marginTop: '20px', paddingLeft: '15px', borderLeft: '2px solid #333' }}>
              <h4 style={{ fontSize: '14px', color: '#888', marginBottom: '10px' }}>💬 {post.replies.length} Comentários</h4>
              {post.replies.slice(0, 3).map((comment: any) => (
                <div key={comment.id} style={{ marginBottom: '15px', fontSize: '14px', background: '#252525', padding: '10px', borderRadius: '6px' }}>
                  <span style={{ fontWeight: 'bold', color: '#0070f3' }}>{comment.email.split('@')[0]}: </span>
                  <span>{comment.body}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}

export default App;