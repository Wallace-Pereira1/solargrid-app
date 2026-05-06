import { supabase } from '../lib/supabase';

export const postService = {
  async getFeed() {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id, title, body,
        profiles (id, name, username, company_name)
      `)
      .order('id', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};