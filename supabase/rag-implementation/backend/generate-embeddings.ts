// 向量生成服务
import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmbeddingRequest {
  knowledgeUnitId?: string;
  content?: string;
  batchProcess?: boolean;
}

export async function handleRequest(req: Request) {
  console.log('向量生成服务被调用');

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let reqBody;
  try {
    reqBody = await req.json();
  } catch (e) {
    console.error('解析请求体失败:', e);
    return new Response(
      JSON.stringify({ error: '无效的JSON格式' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    console.log('请求体:', reqBody);
    const { knowledgeUnitId, batchProcess }: EmbeddingRequest = reqBody;

    // 批量处理模式
    if (batchProcess) {
      console.log('开始批量处理...');
      const { data: unprocessedUnits, error } = await supabaseClient
        .from('knowledge_units')
        .select('id, content')
        .is('embedding', null)
        .limit(50);

      if (error) {
        throw new Error('获取待处理知识单元失败: ' + error.message);
      }

      console.log(`找到 ${unprocessedUnits?.length || 0} 个待处理单元`);

      let processedCount = 0;

      for (const unit of unprocessedUnits || []) {
        try {
          await supabaseClient
            .from('knowledge_units')
            .update({ embedding_status: 'processing', embedding_error: null })
            .eq('id', unit.id);

          const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'text-embedding-ada-002',
              input: unit.content,
            }),
          });

          if (!embeddingResponse.ok) {
            const errorBody = await embeddingResponse.text();
            throw new Error(`OpenAI API请求失败: ${errorBody}`);
          }

          const embeddingData = await embeddingResponse.json();
          const embedding = embeddingData.data[0].embedding;

          await supabaseClient
            .from('knowledge_units')
            .update({ embedding, embedding_status: 'completed' })
            .eq('id', unit.id);

          processedCount++;
          await new Promise(resolve => setTimeout(resolve, 100)); // 避免API限制
        } catch (unitError) {
          console.error(`处理知识单元 ${unit.id} 失败:`, unitError);
          await supabaseClient
            .from('knowledge_units')
            .update({ embedding_status: 'failed', embedding_error: unitError.message })
            .eq('id', unit.id);
        }
      }

      return new Response(
        JSON.stringify({
          message: `成功处理 ${processedCount} 个知识单元`,
          processedCount,
          totalFound: unprocessedUnits?.length || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 单个知识单元处理
    console.log(`处理单个知识单元: ${knowledgeUnitId}`);
    if (!knowledgeUnitId) {
      throw new Error("需要知识单元ID来更新状态");
    }

    console.log(`更新单元 ${knowledgeUnitId} 的状态为'processing'`);
    await supabaseClient
      .from('knowledge_units')
      .update({ embedding_status: 'processing', embedding_error: null })
      .eq('id', knowledgeUnitId);

    console.log(`获取单元 ${knowledgeUnitId} 的内容`);
    const { data: unit, error: fetchError } = await supabaseClient
      .from('knowledge_units')
      .select('content')
      .eq('id', knowledgeUnitId)
      .single();

    if (fetchError) throw fetchError;
    const textToProcess = unit?.content;

    if (!textToProcess) {
      throw new Error('没有找到要处理的内容');
    }
    console.log(`要处理的内容: "${textToProcess.substring(0, 50)}..."`);

    console.log('调用OpenAI API生成向量...');
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: textToProcess,
      }),
    });

    if (!embeddingResponse.ok) {
      const errorBody = await embeddingResponse.text();
      console.error(`单元 ${knowledgeUnitId} 的OpenAI API请求失败: ${errorBody}`);
      throw new Error(`生成向量失败: ${errorBody}`);
    }

    const embeddingData = await embeddingResponse.json();
    const embedding = embeddingData.data[0].embedding;

    console.log(`成功接收向量，更新单元 ${knowledgeUnitId}`);
    await supabaseClient
      .from('knowledge_units')
      .update({ embedding, embedding_status: 'completed' })
      .eq('id', knowledgeUnitId);

    console.log(`单元 ${knowledgeUnitId} 处理完成`);

    return new Response(
      JSON.stringify({
        message: '向量生成成功'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('生成向量错误:', error);
    const knowledgeUnitId = reqBody?.knowledgeUnitId;
    if (knowledgeUnitId) {
      await supabaseClient
        .from('knowledge_units')
        .update({ embedding_status: 'failed', embedding_error: error.message })
        .eq('id', knowledgeUnitId);
    }
    return new Response(
      JSON.stringify({
        error: error.message || '向量生成失败'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}
