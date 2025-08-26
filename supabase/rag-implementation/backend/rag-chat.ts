// RAG聊天实现
import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 理解用户查询，提取关键信息
async function understandQuery(query: string): Promise<{ keywords: string[], categories: string[] }> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的查询分析器。请从用户的问题中提取关键词和类别。以JSON格式返回结果。'
        },
        {
          role: 'user',
          content: query
        }
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error('查询分析失败');
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

// 搜索结构化数据
async function searchStructuredData(supabaseClient: any, categories: string[]) {
  if (!categories.length) return [];

  const { data, error } = await supabaseClient
    .from('structured_data')
    .select('*')
    .in('category', categories)
    .limit(5);

  if (error) console.warn('结构化数据搜索失败:', error);
  return data || [];
}

// 主处理函数
export async function handleRequest(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();
    const { message, category, importance } = await req.json();
    if (!message) throw new Error('消息内容为空');

    const supabaseClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. 生成查询向量
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: message
      }),
    });

    if (!embeddingResponse.ok) {
      throw new Error('生成查询向量失败');
    }

    const { data: [{ embedding: queryEmbedding }] } = await embeddingResponse.json();

    // 2. 并行执行搜索
    // 2a. 向量搜索
    const vectorSearchPromise = supabaseClient.rpc('search_knowledge_units', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: 10,
      filter_category: category === 'all' ? null : category,
      filter_importance: importance === 'all' ? null : importance,
    });

    // 2b. 关键词与类别提取
    const { keywords, categories } = await understandQuery(message);
    const keywordSearchTerms = [...new Set([...keywords])].filter(Boolean);

    // 2c. 关键词搜索
    let keywordSearchPromise = null;
    if (keywordSearchTerms.length > 0) {
      const keywordFilter = keywordSearchTerms.map(term => `keywords.cs.{"${term}"}`).join(',');
      keywordSearchPromise = supabaseClient
        .from('knowledge_units')
        .select('id, content, category, importance, labels')
        .or(keywordFilter)
        .limit(10);
    }

    // 2d. 结构化数据搜索
    const structuredSearchPromise = searchStructuredData(supabaseClient, categories);

    // 3. 结果融合与去重
    const [vectorResults, keywordResults, structuredResults] = await Promise.all([
      vectorSearchPromise,
      keywordSearchPromise,
      structuredSearchPromise
    ]);

    if (vectorResults.error) throw new Error(`向量搜索失败: ${vectorResults.error.message}`);
    if (keywordResults?.error) console.warn(`关键词搜索失败: ${keywordResults.error.message}`);

    const combinedResults = new Map();
    
    // 添加向量搜索结果
    (vectorResults.data || []).forEach((item: any) => {
      combinedResults.set(item.id, { ...item, score: item.similarity });
    });

    // 添加关键词搜索结果
    (keywordResults?.data || []).forEach((item: any) => {
      if (!combinedResults.has(item.id)) {
        combinedResults.set(item.id, { ...item, score: 0.7 });
      } else {
        combinedResults.get(item.id).score += 0.1; // 提升同时出现在两种搜索中的结果的分数
      }
    });

    const finalResults = Array.from(combinedResults.values())
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 8);

    // 4. 构建上下文并生成回答
    const context = finalResults
      .map((r: any) => `[类别: ${r.category}]\n${r.content}`)
      .join('\n\n---\n\n');

    const structuredContext = structuredResults.length > 0
      ? '\n\n相关结构化数据:\n' + structuredResults.map((r: any) => JSON.stringify(r)).join('\n')
      : '';

    // 5. 生成回答
    const completionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的AI助手。请基于提供的上下文信息回答用户的问题。如果上下文中没有相关信息，请明确告知。'
          },
          {
            role: 'user',
            content: `上下文信息:\n${context}${structuredContext}\n\n用户问题: ${message}`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!completionResponse.ok) {
      throw new Error('生成回答失败');
    }

    const completionData = await completionResponse.json();
    const response = completionData.choices[0].message.content;

    // 6. 记录查询日志
    await supabaseClient.from('rag_query_logs').insert({
      query: message,
      retrieved_units_count: finalResults.length,
      response,
      processing_time_ms: Date.now() - startTime
    });

    return new Response(
      JSON.stringify({
        response,
        sources: finalResults.map((r: any) => ({
          content: r.content,
          similarity: r.score,
          category: r.category
        })),
        retrievedCount: finalResults.length,
        processingTime: Date.now() - startTime
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('RAG处理错误:', error);
    return new Response(
      JSON.stringify({
        error: error.message || '处理请求失败'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}
