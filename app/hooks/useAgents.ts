import { useState, useEffect } from "react";
import { supabaseServer } from "~/supabase/supabaseServer";

export interface Agent {
  id: string;
  desarrollo_id: string;
  rol?: string;
  camino_atencion?: string;
  uso_multimedia?: string;
  cierre?: string;
  flujo_atencion?: string;
  reglas_respuesta?: string;
  faq?: string;
  informacion_proyecto?: string;
  modelos?: string;
  tutoriales_credito?: string;
  version?: number;
  created_at?: string;
  updated_at?: string;
}

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener agentes desde la tabla prompt_agentes
      const { data, error } = await supabaseServer
        .from('prompt_agentes')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      setAgents(data || []);
    } catch (err) {
      console.error('Error fetching agents:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar agentes');
    } finally {
      setLoading(false);
    }
  };

  const createAgent = async (agentData: Omit<Agent, 'id' | 'updated_at'>) => {
    try {
      const { data, error } = await supabaseServer
        .from('prompt_agentes')
        .insert([agentData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Actualizar la lista de agentes
      setAgents(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error creating agent:', err);
      throw err;
    }
  };

  const updateAgent = async (id: string, agentData: Partial<Agent>) => {
    try {
      const { data, error } = await supabaseServer
        .from('prompt_agentes')
        .update(agentData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Actualizar la lista de agentes
      setAgents(prev => 
        prev.map(agent => agent.id === id ? data : agent)
      );
      return data;
    } catch (err) {
      console.error('Error updating agent:', err);
      throw err;
    }
  };

  const deleteAgent = async (id: string) => {
    try {
      const { error } = await supabaseServer
        .from('prompt_agentes')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Actualizar la lista de agentes
      setAgents(prev => prev.filter(agent => agent.id !== id));
    } catch (err) {
      console.error('Error deleting agent:', err);
      throw err;
    }
  };

  return {
    agents,
    loading,
    error,
    fetchAgents,
    createAgent,
    updateAgent,
    deleteAgent
  };
}
