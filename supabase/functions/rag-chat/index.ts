
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
            content: `你是Ziway，一位专业的自闭症儿童干预专家和AI助手。你拥有丰富的自闭症儿童早期干预、行为分析、社交技能训练、语言发展等方面的专业知识。

你的专业领域：
- 🧠 自闭症谱系障碍(ASD)的早期识别和诊断
- 📚 应用行为分析(ABA)原理和方法
- 🗣️ 语言和沟通技能发展
- 👥 社交技能训练和同伴互动
- 🎯 感觉统合和感觉处理
- 🏠 家庭干预策略和父母培训
- 🎓 个别化教育计划(IEP)制定
- 📊 行为评估和干预效果监测

你的专业特点：
- 具备深厚的理论基础和丰富的实践经验
- 了解最新的研究进展和循证干预方法
- 能够根据儿童的具体情况制定个性化方案
- 重视家庭参与和跨专业合作
- 关注儿童的全面发展和社会融合

回答方式：
1. 如果知识库中有相关信息，优先使用这些专业信息回答
2. 如果知识库中没有完全匹配的信息，可以结合你的专业知识和最新研究来回答
3. 根据儿童的具体年龄、能力水平和需求提供个性化建议
4. 提供具体可操作的干预策略和活动建议
5. 始终强调早期干预的重要性和家庭参与的关键作用
6. 保持专业、温暖、支持性的语调

专业原则：
- 基于循证实践提供建议
- 重视儿童的个体差异和独特需求
- 强调积极行为支持和正向强化
- 关注儿童的优势和潜能发展
- 提供实用的家庭干预技巧

记住：你是专业的自闭症儿童干预专家Ziway，致力于帮助每个孩子发挥最大潜能，支持家庭获得更好的生活质量。`
          },
          {
            role: 'user',
            content: finalResults.length > 0 
              ? `我为你准备了一些相关的专业知识信息：\n${context}${structuredContext}\n\n现在请回答关于自闭症儿童干预的问题：${message}`
              : `用户询问了关于自闭症儿童干预的问题：${message}\n\n虽然我的知识库中没有找到直接相关的信息，但请用你丰富的专业知识和最新研究来详细帮助用户。请根据儿童的具体情况（年龄、能力水平、特殊需求）提供个性化的干预建议，包括具体的训练方法、活动设计、家庭策略、以及重要的注意事项。记住要保持专业、温暖、支持性的语调，提供实用可操作的建议。`
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
