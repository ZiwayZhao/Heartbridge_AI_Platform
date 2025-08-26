import { createClient } from '@supabase/supabase-js'

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

export async function handleRequest(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
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
          await fetch(`${process.env.SUPABASE_URL}/functions/v1/generate-embeddings`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
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
}
