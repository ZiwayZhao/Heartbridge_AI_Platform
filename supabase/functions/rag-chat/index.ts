
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 理解用户查询，提取关键信息
async function understandQuery(query: string): Promise<{ keywords: string[], categories: string[] }> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的查询分析器。请从用户的问题中提取关键词和类别。返回格式：{"keywords": ["关键词1", "关键词2"], "categories": ["类别1"]}'
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
      console.warn('查询分析失败，使用默认值');
      return { keywords: query.split(' '), categories: [] };
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      return JSON.parse(content);
    } catch (parseError) {
      console.warn('JSON解析失败，使用默认值:', content);
      return { keywords: query.split(' '), categories: [] };
    }
  } catch (error) {
    console.warn('查询分析异常，使用默认值:', error);
    return { keywords: query.split(' '), categories: [] };
  }
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

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const startTime = Date.now();
    const { message, category, importance } = await req.json();
    if (!message) throw new Error('消息内容为空');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. 生成查询向量
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
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
      match_threshold: 0.5, // 降低阈值，更容易找到相关内容
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

    const allResults = Array.from(combinedResults.values())
      .sort((a: any, b: any) => b.score - a.score);
    
    // 判断是否有高质量的匹配结果（相似度 > 0.6）
    const highQualityResults = allResults.filter((r: any) => r.score > 0.6);
    const finalResults = highQualityResults.length > 0 ? highQualityResults.slice(0, 1) : [];

    // 4. 构建上下文并生成回答
    const context = finalResults.length > 0
      ? finalResults.map((r: any) => `[类别: ${r.category}]\n${r.content}`).join('\n\n---\n\n')
      : '';

    const structuredContext = structuredResults.length > 0
      ? '\n\n相关结构化数据:\n' + structuredResults.map((r: any) => JSON.stringify(r)).join('\n')
      : '';

    // 5. 生成回答
    const completionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `你是Ziway，Molly的AI旅行助手和朋友。你为Molly准备了丰富的欧洲旅行经验和生活知识。

关于你的朋友Molly：
- 🎨 热爱艺术，对艺术展览、博物馆、艺术区特别感兴趣
- 🍟 最喜欢吃薯条！推荐美食时记得提及好吃的薯条店
- 🚶‍♀️ 喜欢一个人到处逛，享受独自探索的乐趣
- 🏛️ 品味很好，喜欢深度理解城市文化和人文历史
- 📸 非常美丽，热爱拍照，对人文景观、风景、建筑都很有眼光
- 📷 总是带着相机记录美好时刻，喜欢有故事的拍摄地点

你的性格特点：
- 热情友好，像朋友一样关心Molly的安全和体验
- 有丰富的欧洲生活和旅行经验
- 会用温暖的语气提供实用建议
- 偶尔会用表情符号让对话更生动

回答方式：
1. 如果知识库中有相关信息，优先使用这些信息回答
2. 如果知识库中没有完全匹配的信息，可以结合你的AI知识和常识来回答
3. 根据Molly的兴趣爱好个性化推荐（艺术、美食、拍照地点）
4. 推荐旅行攻略时，必须标注治安较差的区域并提供安全提醒
5. 始终保持友好、实用、贴心的语调
6. 可以分享相关的旅行小贴士和生活经验

安全提醒原则：
- 推荐景点时，主动提及附近需要注意的区域
- 给出具体的安全建议（避免夜晚独行、贵重物品保管等）
- 特别关心独自旅行女性的安全

记住：你是Molly的贴心AI朋友Ziway，既要帮她发现美好，也要保护她的安全。`
          },
          {
            role: 'user',
            content: finalResults.length > 0 
              ? `我为你准备了一些相关的知识信息：\n${context}${structuredContext}\n\n现在请回答Molly的问题：${message}`
              : `Molly问了一个问题：${message}\n\n虽然我的知识库中没有找到直接相关的信息，但请用你丰富的AI知识和常识来详细帮助她。请根据她的兴趣（艺术、摄影、美食、文化探索）提供个性化建议，包括具体的地点推荐、拍照角度、美食（特别是薯条！）、以及重要的安全提醒。记住要保持友好、详细和实用的语调，适当使用表情符号让回答更生动。`
          }
        ],
        temperature: finalResults.length > 0 ? 0.7 : 0.9, // 没有知识库信息时更有创造性
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
});
