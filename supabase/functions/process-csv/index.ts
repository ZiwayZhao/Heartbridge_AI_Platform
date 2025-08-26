import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface KnowledgeUnit {
  content: string;
  category?: string;
  importance?: string;
  labels?: string[];
  keywords?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const knowledgeUnits: KnowledgeUnit[] = await req.json();

    if (!Array.isArray(knowledgeUnits) || knowledgeUnits.length === 0) {
      throw new Error('无效的知识单元数据');
    }

    // 验证必要字段
    knowledgeUnits.forEach((unit, index) => {
      if (!unit.content || typeof unit.content !== 'string') {
        throw new Error(`第 ${index + 1} 条数据缺少有效的content字段`);
      }
    });

    // 准备插入数据
    const unitsToInsert = knowledgeUnits.map(unit => ({
      content: unit.content,
      category: unit.category || 'general',
      importance: unit.importance || 'medium',
      labels: unit.labels || [],
      keywords: unit.keywords || [],
      embedding_status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // 批量插入数据
    const { data, error } = await supabaseClient
      .from('knowledge_units')
      .insert(unitsToInsert)
      .select('id');

    if (error) {
      throw error;
    }

    // 触发向量生成
    if (data) {
      const ids = data.map(item => item.id);
      for (const id of ids) {
        try {
          await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-embeddings`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ knowledgeUnitId: id }),
          });
        } catch (e) {
          console.error(`为知识单元 ${id} 生成向量时出错:`, e);
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: '知识单元已成功导入',
        count: unitsToInsert.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('处理CSV数据错误:', error);
    return new Response(
      JSON.stringify({
        error: error.message || '处理CSV数据时发生错误'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})
