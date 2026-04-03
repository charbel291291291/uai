import { GoogleGenAI } from '@google/genai';

// ============================================================================
// VERCEL EDGE FUNCTION FOR GEMINI AI
// ============================================================================
// This runs server-side ONLY - API key never exposed to client
// ============================================================================

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Only allow POST
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Verify API key exists
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[Edge Function] Missing GEMINI_API_KEY');
      return new Response(
        JSON.stringify({ 
          error: 'AI service unavailable',
          code: 'MISSING_API_KEY'
        }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const body = await request.json();
    const { message, conversationHistory = [] } = body;

    // Validate input
    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ 
          error: 'Message is required and must be a string',
          code: 'INVALID_INPUT'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Input length limit (prevent DoS)
    if (message.length > 5000) {
      return new Response(
        JSON.stringify({ 
          error: 'Message too long (max 5000 characters)',
          code: 'INPUT_TOO_LONG'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize Gemini (NEW SDK)
    const genAI = new GoogleGenAI({ apiKey });

    // Build prompt with conversation history
    let prompt = message;
    if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      const historyText = conversationHistory
        .map((msg: any) => `${msg.role}: ${msg.content}`)
        .join('\n');
      prompt = `${historyText}\nassistant: ${message}`;
    }

    // Call Gemini API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      const response = await genAI.models.generateContent({
        model: 'gemini-pro',
        contents: prompt,
      });
      clearTimeout(timeoutId);

      const text = response.text;

      // Success response
      return new Response(
        JSON.stringify({
          success: true,
          message: text,
          timestamp: new Date().toISOString(),
          model: 'gemini-pro',
        }),
        {
          status: 200,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        }
      );
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        return new Response(
          JSON.stringify({ 
            error: 'Request timed out',
            code: 'TIMEOUT'
          }),
          {
            status: 504,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      throw error;
    }
  } catch (error: any) {
    console.error('[Edge Function] Error:', error);

    // Handle Gemini API errors
    if (error.message?.includes('API key')) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid API key configuration',
          code: 'INVALID_API_KEY'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generic error
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process AI request',
        code: 'INTERNAL_ERROR'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}
