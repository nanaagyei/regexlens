import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireAuth, isGuardOk } from "@/lib/auth/requireAuth";
import { combinedRateLimit } from "@/lib/security/rateLimit";
import {
  aiChatRequestSchema,
  validateInput,
  formatZodError,
} from "@/lib/security/validation";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/ai/systemPrompt";

/**
 * POST /api/ai/chat - AI-powered regex assistant (streaming)
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit (AI-specific tier)
    const rateLimitResponse = await combinedRateLimit(request, "ai_chat");
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Require authentication
    const guard = await requireAuth();
    if (!isGuardOk(guard)) {
      return guard;
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "invalid_json", message: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const validation = validateInput(aiChatRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json(formatZodError(validation.error), {
        status: 400,
      });
    }

    const { action, context, message, conversationHistory } = validation.data;

    // Check for API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "configuration_error",
          message: "AI features are not configured. Please contact support.",
        },
        { status: 503 }
      );
    }

    const client = new Anthropic({ apiKey });

    // Build messages
    const systemPrompt = buildSystemPrompt(context);
    const userPrompt = buildUserPrompt(action, message);

    const messages: Anthropic.MessageParam[] = [];

    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      for (const msg of conversationHistory) {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    // Add current user message
    messages.push({
      role: "user",
      content: userPrompt,
    });

    // Stream response
    const stream = await client.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    // Convert to ReadableStream for Next.js response
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const chunk = JSON.stringify({ text: event.delta.text }) + "\n";
              controller.enqueue(encoder.encode(chunk));
            }
          }
          // Send done signal
          controller.enqueue(
            encoder.encode(JSON.stringify({ done: true }) + "\n")
          );
          controller.close();
        } catch (err) {
          const errorMsg =
            err instanceof Error ? err.message : "Stream error";
          controller.enqueue(
            encoder.encode(
              JSON.stringify({ error: errorMsg }) + "\n"
            )
          );
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json(
      { error: "internal_error", message: "Failed to process AI request" },
      { status: 500 }
    );
  }
}
