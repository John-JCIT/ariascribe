import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Error handler function from Vercel AI SDK docs
function errorHandler(error: unknown) {
  if (error == null) {
    return "unknown error";
  }
  if (typeof error === "string") {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return JSON.stringify(error);
}

export async function POST(req: Request) {
  console.log("POST /api/chat called");
  try {
    const { messages } = await req.json();
    console.log("Received messages:", messages);

    const apiKey = "";

    if (!apiKey) {
      console.error("OpenAI API key is not configured.");
      return new Response("OpenAI API key is not configured.", { status: 500 });
    }

    const openai = createOpenAI({
      apiKey,
    });
    console.log("OpenAI instance created");

    console.log("Calling streamText with gpt-3.5-turbo...");
    const result = await streamText({
      model: openai("gpt-3.5-turbo"), // Use gpt-3.5-turbo
      system: "You are a helpful assistant.",
      messages,
    });
    console.log("streamText call completed, result:", result);

    console.log("Returning data stream response with error handler...");
    // Pass the error handler to expose error messages
    return result.toDataStreamResponse({
      getErrorMessage: errorHandler,
    });
  } catch (error: unknown) {
    // This catch block might not be reached if the error happens *during* streaming
    // The errorHandler passed to toDataStreamResponse is more likely to catch stream errors
    console.error("Error in /api/chat (POST function scope):", error);
    const errorMessage = errorHandler(error); // Use the handler here too
    return new Response(`Error: ${errorMessage}`, { status: 500 });
  }
}
