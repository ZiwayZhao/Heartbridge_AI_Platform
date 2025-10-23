import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { knowledgeItems } = await req.json();
    if (!knowledgeItems || !Array.isArray(knowledgeItems)) {
      throw new Error('Invalid knowledge items data');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Process each knowledge item
    for (const item of knowledgeItems) {
      try {
        // 1. Prepare content for embedding
        let contentForEmbedding = '';
        if (item.question && item.answer) {
          contentForEmbedding = `Question: ${item.question}\nAnswer: ${item.answer}`;
        } else {
          contentForEmbedding = item.content || item.question || '';
        }

        if (!contentForEmbedding.trim()) {
          throw new Error('Empty content for embedding');
        }

        // 2. Generate vector embedding using Lovable AI
        if (!LOVABLE_API_KEY) {
          throw new Error('LOVABLE_API_KEY is not configured');
        }

        const embeddingResponse = await fetch('https://ai.gateway.lovable.dev/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'text-embedding-ada-002',
            input: contentForEmbedding
          }),
        });

        if (!embeddingResponse.ok) {
          const errorText = await embeddingResponse.text();
          throw new Error(`Embedding API error (${embeddingResponse.status}): ${errorText.substring(0, 200)}`);
        }

        const embeddingData = await embeddingResponse.json();
        const embedding = embeddingData.data[0].embedding;

        // 3. Prepare database record
        const knowledgeRecord = {
          content: contentForEmbedding,
          entities: item.question && item.answer ? {
            question: item.question,
            answer: item.answer
          } : (item.entities || {}),
          source_name: item.source_name || 'CSV Upload',
          data_type: item.question && item.answer ? 'qa' : (item.data_type || 'text'),
          category: item.category || 'general',
          tags: item.tags || [],
          importance: item.importance || 'medium',
          embedding: embedding,
        };

        // 4. Insert to database
        const { error: insertError } = await supabaseClient
          .from('knowledge_units')
          .insert(knowledgeRecord);

        if (insertError) {
          throw new Error(`Database insert failed: ${insertError.message}`);
        }

        successCount++;

      } catch (error) {
        errorCount++;
        errors.push(`Item ${successCount + errorCount}: ${error.message}`);
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
    console.error('HeartBridge Upload Knowledge Error:', error.message);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
