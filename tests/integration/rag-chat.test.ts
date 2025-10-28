/**
 * RAG Chat Integration Test
 * 
 * 测试 HeartBridge RAG 聊天功能的完整流程
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

describe('RAG Chat Integration Tests', () => {
  let supabase: any;

  beforeAll(() => {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  });

  test('Knowledge units should have embeddings', async () => {
    const { data, error } = await supabase
      .from('knowledge_units')
      .select('id, embedding')
      .limit(10);

    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);
    
    // 检查是否有embedding
    const hasEmbeddings = data.every((item: any) => item.embedding !== null);
    expect(hasEmbeddings).toBe(true);
  });

  test('Chat function should return response for known question', async () => {
    const testQuestion = '孩子情绪好转时家长如何回应？';
    
    const { data, error } = await supabase.functions.invoke('heartbridge-chat', {
      body: {
        message: testQuestion,
        category: 'all',
        importance: 'all'
      }
    });

    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data.response).toBeTruthy();
    expect(data.sources).toBeTruthy();
    expect(data.retrievedCount).toBeGreaterThan(0);
    
    console.log('Test Question:', testQuestion);
    console.log('Retrieved Count:', data.retrievedCount);
    console.log('Response:', data.response.substring(0, 200) + '...');
  });

  test('Chat function should handle unknown questions gracefully', async () => {
    const testQuestion = '完全不相关的问题about quantum physics';
    
    const { data, error } = await supabase.functions.invoke('heartbridge-chat', {
      body: {
        message: testQuestion,
        category: 'all',
        importance: 'all'
      }
    });

    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data.response).toBeTruthy();
    
    console.log('Unknown Question Response:', data.response.substring(0, 200) + '...');
  });

  test('Vector search function should return similar knowledge units', async () => {
    // 创建一个测试embedding（使用知识库中存在的问题）
    const testEmbedding = new Array(1536).fill(0.001);
    
    const { data, error } = await supabase.rpc('search_knowledge_units', {
      query_embedding: testEmbedding,
      match_threshold: 0.1, // 降低阈值以便测试
      match_count: 5
    });

    expect(error).toBeNull();
    expect(data).toBeTruthy();
    
    console.log('Vector Search Results:', data.length, 'items found');
    if (data.length > 0) {
      console.log('First Result:', {
        content: data[0].content.substring(0, 100) + '...',
        similarity: data[0].similarity,
        category: data[0].category
      });
    }
  });
});
