
import { createClient } from '@supabase/supabase-js';
import { SelfImprovement } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL is required');
}

if (!supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY is required');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'daily_log',
  },
});

export const getSelfImprovements = async (): Promise<SelfImprovement[]> => {
  const { data, error } = await supabase
    .from('self_improvements')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
};

import { User } from '../types';

export const addSelfImprovement = async (
  user: User,
  improvement_text: string,
  motivational_subtitle: string
): Promise<SelfImprovement> => {
  const { data, error } = await supabase
    .from('self_improvements')
    .insert([{ user_text: user, improvement_text, motivational_subtitle }])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};

export const updateSelfImprovement = async (
  id: string,
  updates: Partial<SelfImprovement>
): Promise<SelfImprovement> => {
  const { data, error } = await supabase
    .from('self_improvements')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};

export const deleteSelfImprovement = async (id: string): Promise<void> => {
  const { error } = await supabase.from('self_improvements').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

export const toggleSelfImprovement = async (
  id: string,
  completed: boolean
): Promise<SelfImprovement> => {
  return updateSelfImprovement(id, { completed });
};
