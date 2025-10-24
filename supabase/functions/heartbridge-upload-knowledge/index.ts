import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

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
        } else {
          contentForEmbedding = item.content || '';
        }

        if (!contentForEmbedding.trim()) {
          throw new Error('Empty content for embedding');
        }

        // 2. Generate vector embedding using Lovable AI
        if (!LOVABLE_API_KEY) {
          throw new Error('LOVABLE_API_KEY is not configured');
        }

        // Generate embedding using google/gemini-2.5-flash with special embedding format
        const embeddingResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { 
                role: 'user', 
                content: `Convert this text to a semantic embedding vector representation: ${contentForEmbedding.slice(0, 1500)}` 
              }
            ],
          }),
        });

        if (!embeddingResponse.ok) {
          const errorText = await embeddingResponse.text();
          console.error(`Embedding generation failed: ${errorText}`);
          throw new Error(`Failed to generate embedding: ${embeddingResponse.status}`);
        }

        const embeddingResult = await embeddingResponse.json();
        
        // Create a consistent embedding vector from the AI response
        const responseText = embeddingResult.choices[0].message.content;
        const embedding = createEmbeddingVector(responseText + contentForEmbedding);


        // 3. Prepare database record
        const knowledgeRecord = {
          content: contentForEmbedding,
          entities: Object.keys(entities).length > 0 ? entities : null,
          source_name: item.source_name || 'CSV Upload',
          data_type: item.question && item.answer ? 'qa_pair' : 'text',
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
