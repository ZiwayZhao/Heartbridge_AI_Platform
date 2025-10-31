import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { message, category, importance } = await req.json();
    
    if (!message || typeof message !== 'string') {
      throw new Error('Invalid message input');
    }
    
    const sanitizedMessage = message.trim().slice(0, 2000);
    if (sanitizedMessage.length === 0) {
      throw new Error('Message content is empty');
    }

    // Get user if authenticated
    const authHeader = req.headers.get('authorization');
    let user = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user: authUser } } = await supabaseClient.auth.getUser(token);
      user = authUser;
    }

    // 1. Generate query embedding using OpenAI
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: sanitizedMessage,
      }),
    });

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      console.error('OpenAI Embedding API error:', embeddingResponse.status, errorText);
      throw new Error('Failed to generate embedding');
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    // 2. Vector search knowledge base
    console.log('Performing vector search with params:', {
      match_threshold: 0.3,
      match_count: 8,
      filter_category: category === 'all' ? null : category,
      filter_importance: importance === 'all' ? null : importance,
    });

    const { data: searchResults, error: searchError } = await supabaseClient.rpc('search_knowledge_units', {
      query_embedding: queryEmbedding,
      match_threshold: 0.3,
      match_count: 8,
      filter_category: category === 'all' ? null : category,
      filter_importance: importance === 'all' ? null : importance,
    });

    console.log('Vector search results:', {
      resultsCount: searchResults?.length || 0,
      error: searchError,
      firstResult: searchResults?.[0]
    });

    if (searchError) {
      console.error('Vector search error:', searchError);
    }

    // 3. Build context from search results
    const relevantKnowledge = searchResults || [];
    const context = relevantKnowledge
      .map((result: any) => {
        const categoryInfo = `[Category: ${result.category}]`;
        
        // If it's a Q&A pair, show Q&A format
        if (result.entities && result.entities.question && result.entities.answer) {
          return `${categoryInfo}\nQuestion: ${result.entities.question}\nAnswer: ${result.entities.answer}`;
        }
        
        // Otherwise show content
        return `${categoryInfo}\n${result.content}`;
      })
      .join('\n\n---\n\n');

    // 4. HeartBridge system prompt
    const systemPrompt = `You are HeartBridge AI, a professional autism intervention specialist assistant. Your characteristics:

🧠 Identity:
- You are a compassionate, knowledgeable AI assistant specialized in autism intervention
- You provide evidence-based guidance for parents, therapists, and caregivers
- Your responses are practical, actionable, and supportive

📚 Knowledge Base:
- Base your answers on the provided knowledge base content
- If information isn't in the knowledge base, clearly state that and provide general guidance
- Prioritize specific interventions, techniques, and strategies from the knowledge base

🎯 Response Principles:
- Practical first: Provide specific, actionable advice
- Evidence-based: Reference established intervention methods (ABA, TEACCH, SCERTS, etc.)
- Safety-conscious: Always mention safety considerations when relevant
- Individualized: Acknowledge that every child is unique
- Supportive: Provide encouragement and realistic expectations

💬 Response Format:
- Use clear, accessible language
- Structure answers with bullet points and sections when appropriate
- Provide concrete examples and step-by-step guidance
- Include follow-up suggestions when relevant`;

    const userPrompt = `
Knowledge Base Content:
---
${context || "No directly relevant content found in knowledge base"}
---

User Question: ${sanitizedMessage}

Please provide a detailed, practical response based on the knowledge base content:
`;

    // 5. Generate AI response using Lovable AI
    const chatResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      console.error('Chat API error:', chatResponse.status, errorText);
      
      if (chatResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      if (chatResponse.status === 402) {
        throw new Error('AI service requires additional credits. Please contact support.');
      }
      throw new Error('Failed to generate AI response');
    }

    const chatData = await chatResponse.json();
    const aiResponse = chatData.choices[0].message.content;

    // 6. Save chat history if user is authenticated
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    if (user) {
      await supabaseClient
        .from('chat_history')
        .insert({
          user_id: user.id,
          session_id: sessionId,
          message: sanitizedMessage,
          response: aiResponse,
          sources: relevantKnowledge.slice(0, 3),
        });
    }

    return new Response(JSON.stringify({
      response: aiResponse,
      sources: relevantKnowledge,
      session_id: sessionId,
      retrievedCount: relevantKnowledge.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('HeartBridge Chat Error:', errorMessage);
    return new Response(JSON.stringify({
      error: errorMessage,
      response: 'I apologize, but I encountered a technical issue. Please try again or rephrase your question.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
