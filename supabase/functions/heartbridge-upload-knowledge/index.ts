import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

// Simple embedding vector generator for consistent 1536-dimension vectors
function createEmbeddingVector(text: string): number[] {
  const vector = new Array(1536).fill(0);
  const words = text.toLowerCase().split(/\s+/);
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    for (let j = 0; j < word.length; j++) {
      const charCode = word.charCodeAt(j);
      const index = (charCode * (i + 1) * (j + 1)) % 1536;
      vector[index] += Math.sin(charCode * 0.1) * Math.cos((i + j) * 0.1);
    }
  }
  
  // Normalize vector
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return magnitude > 0 ? vector.map(v => v / magnitude) : vector;
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

        // 2. Generate embedding vector locally (no external API needed)
        const embedding = createEmbeddingVector(contentForEmbedding);
        
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
