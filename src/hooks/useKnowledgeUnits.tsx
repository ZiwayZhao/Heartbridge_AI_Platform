
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type KnowledgeUnit = Database['public']['Tables']['knowledge_units']['Row'];

export function useKnowledgeUnits() {
  const [units, setUnits] = useState<KnowledgeUnit[]>([]);
  const { toast } = useToast();

  const loadKnowledgeUnits = useCallback(async () => {
    try {
      console.log('Loading knowledge units...');
      
      const { data, error } = await supabase
        .from('knowledge_units')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Knowledge units loading error:', error);
        
        let errorMessage = `Failed to load knowledge units: ${error.message}`;
        if (error.message.includes('Load failed')) {
          errorMessage = 'Network connection issue, unable to load knowledge data';
        }
        
        toast({
          title: "Loading Failed",
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }

      console.log(`Successfully loaded ${data?.length || 0} knowledge units`);
      setUnits(data || []);
      
    } catch (error: any) {
      console.error('Knowledge units loading exception:', error);
      toast({
        title: "Loading Exception",
        description: "Network connection unstable, please check and retry",
        variant: "destructive"
      });
    }
  }, [toast]);

  return {
    units,
    setUnits,
    loadKnowledgeUnits
  };
}
