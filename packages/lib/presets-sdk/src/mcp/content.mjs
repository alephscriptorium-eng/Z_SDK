export function jsonContent(payload) {
  return { content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }] };
}

function extractPromptText(result) {
  if (typeof result === 'string') return result;
  return result?.messages?.[0]?.content?.text ?? String(result);
}

export function renderPromptText(entry, args = {}) {
  return extractPromptText(entry.render(args || {}));
}

export function promptMessages(text) {
  return {
    messages: [
      {
        role: 'user',
        content: { type: 'text', text }
      }
    ]
  };
}

export function toPromptMessages(result) {
  if (typeof result === 'string') return promptMessages(result);
  if (result?.messages) return result;
  return promptMessages(String(result));
}
