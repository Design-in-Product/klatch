/**
 * Auxiliary LLM client for AAXT scaffolded probing.
 *
 * Uses OpenAI's chat completions API (GPT-4o-mini by default) for probe
 * generation and response scoring. Falls back to Anthropic Haiku if
 * OPENAI_API_KEY is not set.
 *
 * Uses raw fetch — no SDK dependency.
 */

export type AuxiliaryProvider = 'openai' | 'anthropic';

interface AuxiliaryConfig {
  provider: AuxiliaryProvider;
  model: string;
  apiKey: string;
}

function getConfig(): AuxiliaryConfig {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    return {
      provider: 'openai',
      model: process.env.AAXT_AUXILIARY_MODEL || 'gpt-4o-mini',
      apiKey: openaiKey,
    };
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    return {
      provider: 'anthropic',
      model: 'claude-haiku-4-5-20251001',
      apiKey: anthropicKey,
    };
  }

  throw new Error('No API key available for auxiliary LLM. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.');
}

/**
 * Send a prompt to the auxiliary LLM and get a text response.
 * Expects JSON output — caller is responsible for parsing.
 */
export async function queryAuxiliary(systemPrompt: string, userPrompt: string): Promise<string> {
  const config = getConfig();

  if (config.provider === 'openai') {
    return queryOpenAI(config, systemPrompt, userPrompt);
  } else {
    return queryAnthropic(config, systemPrompt, userPrompt);
  }
}

/** Get which provider is configured (for diagnostics) */
export function getAuxiliaryInfo(): { provider: AuxiliaryProvider; model: string } {
  const config = getConfig();
  return { provider: config.provider, model: config.model };
}

async function queryOpenAI(config: AuxiliaryConfig, systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI API error (${res.status}): ${body}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

async function queryAnthropic(config: AuxiliaryConfig, systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic API error (${res.status}): ${body}`);
  }

  const data = await res.json();
  return data.content[0].text;
}
