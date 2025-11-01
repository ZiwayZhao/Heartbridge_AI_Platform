import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useReindexKnowledge = () => {
  const [isReindexing, setIsReindexing] = useState(false);

  const reindexKnowledge = async () => {
    setIsReindexing(true);
    const toastId = toast.loading('正在重新索引知识库...');

    try {
      const { data, error } = await supabase.functions.invoke('reindex-knowledge', {
        body: {}
      });

      if (error) throw error;

      if (data.success) {
        toast.success(
          `知识库重新索引完成！成功：${data.successCount}，失败：${data.errorCount}`,
          { id: toastId }
        );
      } else {
        throw new Error(data.error || '重新索引失败');
      }

      return data;
    } catch (error) {
      console.error('Reindex error:', error);
      toast.error(
        error instanceof Error ? error.message : '重新索引知识库时出错',
        { id: toastId }
      );
      throw error;
    } finally {
      setIsReindexing(false);
    }
  };

  return {
    reindexKnowledge,
    isReindexing,
  };
};
