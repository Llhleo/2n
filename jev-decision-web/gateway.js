import { WorkerEntrypoint } from "cloudflare:workers";

const OPENROUTER_DECISIONS_URL = "https://openrouter.ai/api/alpha/decisions";
const MODEL = "typesafe/jev-1.13";
const MAX_STATE_CHARS = 20000;
const MCP_VERSION = "2025-06-18";

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      ...extraHeaders,
    },
  });
}

function mcpJson(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

function isAuthorized(request, env) {
  if (!env.WORK_DECISION_TOKEN) return false;
  const auth = request.headers.get("authorization") || "";
  return auth === `Bearer ${env.WORK_DECISION_TOKEN}`;
}

function unauthorizedJson() {
  return json(
    { ok: false, error: "unauthorized" },
    401,
    { "www-authenticate": 'Bearer realm="jev-decision-gateway"' }
  );
}

function buildQuestions(tool) {
  if (tool === "route_next_step") {
    return {
      next_step: {
        type: "choice",
        instructions:
          "Choose the safest and most efficient next action for an AI agent. Prefer verification before declaring success when evidence is incomplete.",
        criteria: {
          CONTINUE:
            "The current step succeeded and the agent should continue to the next planned step.",
          VERIFY:
            "The result appears successful but should be checked before continuing or declaring completion.",
          RETRY:
            "The current step likely failed transiently and should be attempted again.",
          ESCALATE:
            "Progress is blocked by authentication, permissions, missing user action, or ambiguity requiring human input.",
          DONE:
            "The requested task is complete and there is sufficient evidence that no further action is needed."
        }
      }
    };
  }

  if (tool === "evaluate_result") {
    return {
      complete: {
        type: "noul",
        instructions:
          "Is the requested task genuinely complete based on the supplied goal, observed result, and verification evidence? A high probability should require sufficient evidence, not just an apparent success message."
      }
    };
  }

  if (tool === "classify_error") {
    return {
      error_type: {
        type: "choice",
        instructions:
          "Classify the primary cause of this failure so an AI agent can choose an appropriate recovery action.",
        criteria: {
          AUTH:
            "Login, expired session, identity verification, missing credential, or authentication failure.",
          PERMISSION:
            "Authentication succeeded, but permissions, scopes, roles, or access rights are insufficient.",
          NETWORK:
            "Connectivity, DNS, timeout, transport, rate-limit transport behavior, or upstream availability problem.",
          PAGE_STATE:
            "The browser is on an unexpected page, modal, stale state, or UI state that prevents the intended action.",
          APP_ERROR:
            "The target service or application returned an internal or functional error.",
          UNKNOWN:
            "There is not enough evidence to classify the failure reliably."
        }
      }
    };
  }

  return null;
}

function validateState(state) {
  if (state === undefined || state === null) return "state_required";
  let serialized;
  try {
    serialized = typeof state === "string" ? state : JSON.stringify(state);
  } catch {
    return "state_not_serializable";
  }
  if (serialized.length > MAX_STATE_CHARS) return "state_too_large";
  return null;
}

async function callJev(env, state, questions) {
  if (!env.OPENROUTER_API_KEY) {
    const error = new Error("OPENROUTER_API_KEY is not configured");
    error.status = 503;
    throw error;
  }

  const response = await fetch(OPENROUTER_DECISIONS_URL, {
    method: "POST",
    headers: {
      "authorization": `Bearer ${env.OPENROUTER_API_KEY}`,
      "content-type": "application/json",
      "x-title": "jev-decision-gateway"
    },
    body: JSON.stringify({
      model: MODEL,
      state,
      questions
    })
  });

  const raw = await response.text();
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    body = { raw };
  }

  if (!response.ok) {
    const error = new Error(`OpenRouter Decisions API returned HTTP ${response.status}`);
    error.status = response.status;
    error.details = body;
    throw error;
  }

  return body;
}

function toolDefinitions() {
  const stateSchema = {
    description:
      "Structured task state or concise natural-language evidence for Jev to evaluate. Keep only decision-relevant context.",
    oneOf: [
      { type: "string" },
      { type: "object", additionalProperties: true },
      { type: "array" }
    ]
  };

  return [
    {
      name: "route_next_step",
      description:
        "Use Jev to choose the next agent action: CONTINUE, VERIFY, RETRY, ESCALATE, or DONE, with calibrated probabilities and confidence.",
      inputSchema: {
        type: "object",
        properties: { state: stateSchema },
        required: ["state"],
        additionalProperties: false
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    {
      name: "evaluate_result",
      description:
        "Use Jev to estimate whether a task is genuinely complete from the supplied goal, result, and verification evidence.",
      inputSchema: {
        type: "object",
        properties: { state: stateSchema },
        required: ["state"],
        additionalProperties: false
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    {
      name: "classify_error",
      description:
        "Use Jev to classify the primary failure cause as AUTH, PERMISSION, NETWORK, PAGE_STATE, APP_ERROR, or UNKNOWN.",
      inputSchema: {
        type: "object",
        properties: { state: stateSchema },
        required: ["state"],
        additionalProperties: false
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true
      }
    }
  ];
}

async function runTool(env, tool, state) {
  const questions = buildQuestions(tool);
  if (!questions) {
    const error = new Error("unknown_tool");
    error.code = -32602;
    throw error;
  }

  const stateError = validateState(state);
  if (stateError) {
    const error = new Error(stateError);
    error.code = -32602;
    throw error;
  }

  return callJev(env, state, questions);
}

async function handleMcp(request, env) {
  if (!isAuthorized(request, env)) {
    return mcpJson(
      {
        jsonrpc: "2.0",
        error: { code: -32001, message: "Unauthorized" },
        id: null
      },
      401
    );
  }

  if (request.method === "GET") {
    return new Response(null, {
      status: 405,
      headers: { "allow": "POST" }
    });
  }

  if (request.method !== "POST") {
    return mcpJson(
      {
        jsonrpc: "2.0",
        error: { code: -32600, message: "Invalid Request" },
        id: null
      },
      405
    );
  }

  let message;
  try {
    message = await request.json();
  } catch {
    return mcpJson({
      jsonrpc: "2.0",
      error: { code: -32700, message: "Parse error" },
      id: null
    }, 400);
  }

  const id = Object.prototype.hasOwnProperty.call(message, "id") ? message.id : null;
  const method = message?.method;

  if (method === "notifications/initialized" && id === null) {
    return new Response(null, { status: 202 });
  }

  if (method === "initialize") {
    const requested = message?.params?.protocolVersion;
    return mcpJson({
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: requested || MCP_VERSION,
        capabilities: {
          tools: { listChanged: false }
        },
        serverInfo: {
          name: "jev-decision-gateway",
          title: "Jev Decision Gateway",
          version: "1.0.0"
        },
        instructions:
          "Use Jev only for ambiguous semantic decisions, routing, completion verification, and error classification. Do not call it for deterministic arithmetic or facts already known with certainty."
      }
    });
  }

  if (method === "ping") {
    return mcpJson({ jsonrpc: "2.0", id, result: {} });
  }

  if (method === "tools/list") {
    return mcpJson({
      jsonrpc: "2.0",
      id,
      result: { tools: toolDefinitions() }
    });
  }

  if (method === "tools/call") {
    const name = message?.params?.name;
    const state = message?.params?.arguments?.state;

    try {
      const result = await runTool(env, name, state);
      return mcpJson({
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify(result)
            }
          ],
          structuredContent: result,
          isError: false
        }
      });
    } catch (error) {
      const details = error?.details || null;
      const payload = {
        error: String(error?.message || error),
        upstreamStatus: error?.status || null,
        details
      };
      return mcpJson({
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify(payload)
            }
          ],
          structuredContent: payload,
          isError: true
        }
      });
    }
  }

  return mcpJson({
    jsonrpc: "2.0",
    id,
    error: { code: -32601, message: "Method not found" }
  }, 404);
}



// Web-only RPC: no public HTTP route, keeps the OpenRouter secret in this Worker.
function cleanWebInput(mode, input) {
  if (!["choice", "noul", "score"].includes(mode) || !input || typeof input !== "object") throw new Error("invalid_input");
  const str = (v, max) => {
    if (typeof v !== "string" || v.length > max) throw new Error("invalid_input");
    return v.trim();
  };
  const question = str(input.question, 400), context = str(input.context || "", 1600);
  if (!question) throw new Error("invalid_input");
  const state = { question, context };
  if (mode === "noul") {
    state.support = str(input.support || "", 1600);
    state.against = str(input.against || "", 1600);
    state.uncertainty = str(input.uncertainty || "", 1600);
    return { state, questions: { judgment: { type: "noul", instructions: "Based only on the given context, evidence and uncertainty, how likely is the proposition in question to be true? Do not assume missing facts." } } };
  }
  const items = input.items;
  const min = mode === "choice" ? 2 : 3, max = mode === "choice" ? 8 : 10;
  if (!Array.isArray(items) || items.length < min || items.length > max) throw new Error("invalid_input");
  const names = new Set();
  state.items = items.map(item => {
    const name = str(item?.name, 80);
    const detail = str(item?.[mode === "choice" ? "criteria" : "meaning"] || "", 400);
    if (!name || names.has(name)) throw new Error("invalid_input");
    names.add(name);
    return { name, detail };
  });
  if (mode === "score") {
    state.criteria = str(input.criteria || "", 1600);
    return { state, questions: { judgment: { type: "score", instructions: "Evaluate the item in question against the ordered scale. Use the background and evaluation criteria only. The levels are ordered from lowest to highest.", criteria: state.items.map(x => x.name + ": " + (x.detail || x.name)) } } };
  }
  return { state, questions: { judgment: { type: "choice", instructions: "Choose the most suitable candidate for the user's question based on the stated background and criteria. Return one of the listed option names.", criteria: Object.fromEntries(state.items.map(x => [x.name, x.detail || x.name])) } } };
}
async function getKeyUsage(env) {
  const r = await fetch("https://openrouter.ai/api/v1/key", { headers: { authorization: `Bearer ${env.OPENROUTER_API_KEY}` } });
  if (!r.ok) return null;
  const d = (await r.json()).data || {};
  return { usage: d.usage ?? null, usage_daily: d.usage_daily ?? null, usage_weekly: d.usage_weekly ?? null, usage_monthly: d.usage_monthly ?? null, limit: d.limit ?? null, limit_remaining: d.limit_remaining ?? null };
}

export class JevDecisionService extends WorkerEntrypoint {
  async decision(tool, state) {
    return runTool(this.env, tool, state);
  }
  async webDecision(mode, input) {
    const { state, questions } = cleanWebInput(mode, input);
    const raw = await callJev(this.env, state, questions);
    const key_usage = await getKeyUsage(this.env).catch(() => null);
    return { raw, key_usage };
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
      return json({
        ok: true,
        service: "jev-decision-gateway",
        backend: "openrouter",
        model: MODEL,
        mcp: "/mcp",
        decisionApi: "/decision",
        configured: {
          openRouterKey: Boolean(env.OPENROUTER_API_KEY),
          accessToken: Boolean(env.WORK_DECISION_TOKEN)
        },
        ready: Boolean(env.OPENROUTER_API_KEY && env.WORK_DECISION_TOKEN)
      });
    }

    if (url.pathname === "/mcp") {
      return handleMcp(request, env);
    }

    if (url.pathname === "/decision") {
      if (request.method !== "POST") {
        return json({ ok: false, error: "method_not_allowed" }, 405, { allow: "POST" });
      }

      if (!isAuthorized(request, env)) {
        return unauthorizedJson();
      }

      let input;
      try {
        input = await request.json();
      } catch {
        return json({ ok: false, error: "invalid_json" }, 400);
      }

      const tool = input?.tool;
      const state = input?.state;

      try {
        const result = await runTool(env, tool, state);
        return json({ ok: true, tool, result });
      } catch (error) {
        const status =
          Number.isInteger(error?.status) && error.status >= 400 && error.status < 600
            ? error.status
            : error?.code === -32602
              ? 400
              : 502;

        return json({
          ok: false,
          error: String(error?.message || error),
          upstreamStatus: error?.status || null,
          details: error?.details || null
        }, status);
      }
    }

    return json({ ok: false, error: "not_found" }, 404);
  }
};
