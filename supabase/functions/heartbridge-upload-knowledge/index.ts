import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

// Category mapping: 将CSV中的category映射到数据库允许的值
function mapCategoryToDb(csvCategory: string): string {
  const categoryMap: Record<string, string> = {
    'Functional Communication Training': 'communication',
    'Teaching Waiting Skills': 'behavior',
    'Emotional Regulation': 'behavior',
    'Social Skills Training': 'social_skills',
    'Sensory Activities': 'sensory',
    'Behavioral Intervention': 'intervention',
    'ABA Techniques': 'intervention',
  };
  
  const normalized = csvCategory.trim();
  return categoryMap[normalized] || 'general';
}

// Generate embedding using OpenAI API
async function createEmbeddingVector(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI Embedding API error:', response.status, errorText);
    throw new Error('Failed to generate embedding');
  }

  const data = await response.json();
  return data.data[0].embedding;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { knowledgeItems } = await req.json();
    if (!knowledgeItems || !Array.isArray(knowledgeItems)) {
      throw new Error('Invalid knowledge items data');
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Process each knowledge item
    for (const item of knowledgeItems) {
      try {
        // 1. Prepare content for embedding
        let contentForEmbedding = '';
        const entities: any = {};
        
        if (item.question && item.answer) {
          contentForEmbedding = `Question: ${item.question}\nAnswer: ${item.answer}`;
          entities.question = item.question;
          entities.answer = item.answer;
          if (item.id) entities.id = item.id;
          if (item.category) entities.category = item.category; // 保存原始category
        } else {
          contentForEmbedding = item.content || '';
        }

        if (!contentForEmbedding.trim()) {
          throw new Error('Empty content for embedding');
        }

        // 2. Generate embedding vector using OpenAI API
        const embedding = await createEmbeddingVector(contentForEmbedding);
        
        console.log(`Generated embedding for item: ${item.id || 'unknown'}`);

        // 3. Prepare database record with proper category mapping
        const knowledgeRecord = {
          content: contentForEmbedding,
          entities: Object.keys(entities).length > 0 ? entities : null,
          source_name: item.source_name || 'CSV Upload',
          data_type: item.question && item.answer ? 'qa' : 'text',
          category: mapCategoryToDb(item.category || ''), // 映射category到数据库允许的值
          tags: item.tags || [],
          importance: item.importance || 'medium',
          embedding: embedding,
        };

        // 4. Insert to database
        const { error: insertError } = await supabaseClient
          .from('knowledge_units')
          .insert(knowledgeRecord);

        if (insertError) {
          console.error(`Database insert error for item ${item.id}:`, insertError);
          throw new Error(`Database insert failed: ${insertError.message}`);
        }

        successCount++;
        console.log(`Successfully uploaded item ${successCount}: ${item.id || 'unknown'}`);

      } catch (error) {
        errorCount++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Item ${successCount + errorCount}: ${errorMessage}`);
        console.error(`Error processing knowledge item:`, error);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      processed: knowledgeItems.length,
      successCount,
      errorCount,
      errors: errors.slice(0, 10),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('HeartBridge Upload Knowledge Error:', errorMessage);
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
