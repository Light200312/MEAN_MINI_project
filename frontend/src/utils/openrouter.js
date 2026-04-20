export async function callOpenRouter(messages) {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OpenRouter API key not found. Please add VITE_OPENROUTER_API_KEY to .env"
    );
  }

  // Convert our chat format → OpenRouter format
  const formattedMessages = messages.map((msg) => {
    if (msg.role === "user" && msg.image) {
      return {
        role: "user",
        content: [
          { type: "text", text: msg.text || "" },
          {
            type: "image_url",
            image_url: { url: msg.image },
          },
        ],
      };
    }

    return {
      role: msg.role,
      content: msg.text || msg.content || "",
    };
  });

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin,
      },
      body: JSON.stringify({
        model: "openrouter/auto",
        temperature: 0.7,
        messages: formattedMessages,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.error?.message || `OpenRouter error: ${response.status}`
    );
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}