import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireAuth, isGuardOk } from "@/lib/auth/requireAuth";
import { combinedRateLimit } from "@/lib/security/rateLimit";
import { enforceCsrfProtection } from "@/lib/security/csrf";
import {
  aiChatRequestSchema,
  validateInput,
  formatZodError,
  parseJsonBodyWithinLimit,
  REQUEST_BODY_LIMITS,
} from "@/lib/security/validation";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/ai/systemPrompt";

/**
 * POST /api/ai/chat - AI-powered regex assistant (streaming)
 *
 * Uses a "bring your own key" model: the client sends an Anthropic API key
 * via the `X-Anthropic-Key` header. The key is used for the single request and
 * is not persisted server-side. Application code does not log the header value, but
 * infrastructure or CDN access logs may still record HTTP headers depending on your host.
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit (AI-specific tier) — IP first
    const rateLimitResponse = await combinedRateLimit(request, "ai_chat");
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const csrfError = enforceCsrfProtection(request);
    if (csrfError) {
      return csrfError;
    }

    // Require authentication
    const guard = await requireAuth();
    if (!isGuardOk(guard)) {
      return guard;
    }

    const userRateLimitResponse = await combinedRateLimit(request, "ai_chat", {
      userId: guard.user.id,
      skipIpCheck: true,
    });
    if (userRateLimitResponse) {
      return userRateLimitResponse;
    }

    // Read API key from request header (BYOK)
    const apiKey = request.headers.get("x-anthropic-key");
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "api_key_required",
          message:
            "An Anthropic API key is required. Add your key in the Copilot settings to use AI features.",
        },
        { status: 401 }
      );
    }

    if (!apiKey.startsWith("sk-ant-") || apiKey.length < 20) {
      return NextResponse.json(
        {
          error: "invalid_api_key",
          message:
            "The API key format is invalid. Anthropic keys start with sk-ant-.",
        },
        { status: 401 }
      );
    }

    const parsedBody = await parseJsonBodyWithinLimit(
      request,
      REQUEST_BODY_LIMITS.AI_CHAT_BYTES
    );
    if (!parsedBody.ok) {
      return NextResponse.json(parsedBody.body, { status: parsedBody.status });
    }

    const body = parsedBody.data;

    const validation = validateInput(aiChatRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json(formatZodError(validation.error), {
        status: 400,
      });
    }

    const { action, context, message, conversationHistory } = validation.data;

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
          console.error(
            "AI chat stream error:",
            err instanceof Error ? err.message : "Unknown error"
          );
          controller.enqueue(
            encoder.encode(
              JSON.stringify({ error: "stream_error" }) + "\n"
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
    console.error("AI chat error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "internal_error", message: "Failed to process AI request" },
      { status: 500 }
    );
  }
}
