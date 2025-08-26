// 测试完整的RAG系统功能
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ijrbyfpesocafkkwmfht.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqcmJ5ZnBlc29jYWZra3dtZmh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMDcxNDQsImV4cCI6MjA3MTc4MzE0NH0.ZGjfGxJrPdA0xXliixUjFDK7vapEJKxIs56LorPRImM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRAGSystem() {
  console.log('🔍 测试完整RAG系统...\n');
  
  try {
    // 1. 测试数据库连接
    console.log('1️⃣ 测试数据库连接...');
    const { data: testData, error: testError } = await supabase
      .from('formolly_travel_knowledge')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('❌ 数据库连接失败:', testError.message);
      return;
    }
    console.log('✅ 数据库连接成功');

    // 2. 检查数据状态
    console.log('\n2️⃣ 检查数据状态...');
    const { data: allData, error: dataError } = await supabase
      .from('formolly_travel_knowledge')
      .select('id, content, embedding, source_name')
      .limit(10);
    
    if (dataError) {
      console.error('❌ 数据查询失败:', dataError.message);
      return;
    }
    
    const withEmbedding = allData.filter(item => item.embedding && item.embedding.length > 0);
    console.log(`📊 总记录数: ${allData.length}`);
    console.log(`📊 有向量的记录: ${withEmbedding.length}`);
    console.log(`📊 缺少向量的记录: ${allData.length - withEmbedding.length}`);

    // 3. 测试RAG聊天功能
    console.log('\n3️⃣ 测试RAG聊天功能...');
    const testQuestions = [
      '巴黎地铁怎么买票？',
      '意大利有什么好吃的？',
      '德国购物要注意什么？'
    ];

    for (const question of testQuestions) {
      console.log(`\n🤔 测试问题: "${question}"`);
      
      try {
        const { data: chatData, error: chatError } = await supabase.functions.invoke('rag-chat', {
          body: {
            message: question,
            category: null,
            importance: null
          }
        });

        if (chatError) {
          console.error(`❌ RAG聊天失败:`, chatError.message);
          continue;
        }

        console.log(`✅ 回答成功`);
        console.log(`📊 找到来源: ${chatData.sources?.length || 0} 个`);
        console.log(`💬 回答预览: ${chatData.response.substring(0, 100)}...`);
        
        if (chatData.sources && chatData.sources.length > 0) {
          console.log(`📚 最佳匹配相似度: ${(chatData.sources[0].similarity * 100).toFixed(1)}%`);
        }
      } catch (error) {
        console.error(`❌ 测试问题失败:`, error.message);
      }
    }

    // 4. 测试边缘函数可用性
    console.log('\n4️⃣ 测试所有边缘函数...');
    const functions = [
      'rag-chat',
      'formolly-chat',
      'formolly-chat-simple'
    ];

    for (const funcName of functions) {
      try {
        const { data, error } = await supabase.functions.invoke(funcName, {
          body: { message: '测试' }
        });
        
        if (error) {
          console.log(`❌ ${funcName}: ${error.message}`);
        } else {
          console.log(`✅ ${funcName}: 可用`);
        }
      } catch (error) {
        console.log(`❌ ${funcName}: ${error.message}`);
      }
    }

    console.log('\n🎉 RAG系统测试完成！');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

testRAGSystem();