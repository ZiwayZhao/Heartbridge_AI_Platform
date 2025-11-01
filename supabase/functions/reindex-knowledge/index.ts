import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

// Generate embedding using OpenAI API
async function createEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float',
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

    console.log('Starting knowledge base reindexing...');

    // Get all knowledge units
    const { data: knowledgeUnits, error: fetchError } = await supabaseClient
      .from('knowledge_units')
      .select('id, content');

    if (fetchError) {
      throw new Error(`Failed to fetch knowledge units: ${fetchError.message}`);
    }

    console.log(`Found ${knowledgeUnits?.length || 0} knowledge units to reindex`);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Process each knowledge unit
    for (const unit of knowledgeUnits || []) {
      try {
        console.log(`Processing unit ${unit.id}...`);
        
        // Generate new embedding
        const embedding = await createEmbedding(unit.content);
        
        // Update the knowledge unit with new embedding
        const { error: updateError } = await supabaseClient
          .from('knowledge_units')
          .update({ embedding })
          .eq('id', unit.id);

        if (updateError) {
          throw new Error(`Update failed: ${updateError.message}`);
        }

        successCount++;
        console.log(`✓ Successfully reindexed unit ${unit.id}`);

      } catch (error) {
        errorCount++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Unit ${unit.id}: ${errorMessage}`);
        console.error(`✗ Error processing unit ${unit.id}:`, errorMessage);
      }
    }

    console.log(`Reindexing complete: ${successCount} success, ${errorCount} errors`);

    return new Response(JSON.stringify({
      success: true,
      total: knowledgeUnits?.length || 0,
      successCount,
      errorCount,
      errors: errors.slice(0, 10),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Reindex Knowledge Error:', errorMessage);
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
