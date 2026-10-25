/**
 * DKG v10 Public HTTP API Client
 * Uses only supported public HTTP endpoints on the local DKG v10 node.
 */
export class DkgV10HttpClient {
  constructor({ apiUrl = process.env.DKG_API_URL || 'http://127.0.0.1:9200', authToken = process.env.DKG_AUTH_TOKEN || '' } = {}) {
    this.apiUrl = apiUrl.replace(/\/+$/, '');
    this.authToken = authToken;
  }

  headers() {
    const h = {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    };
    if (this.authToken) {
      h.Authorization = `Bearer ${this.authToken}`;
    }
    return h;
  }

  async request(method, endpoint, payload) {
    const url = `${this.apiUrl}${endpoint}`;
    const res = await fetch(url, {
      method,
      headers: this.headers(),
      body: payload !== undefined ? JSON.stringify(payload) : undefined
    });
    const text = await res.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = { raw: text }; }
    if (!res.ok) {
      throw new Error(`DKG HTTP ${res.status} on ${method} ${endpoint}: ${text}`);
    }
    return parsed;
  }

  async ensureContextGraph(graphName, description) {
    return this.request('POST', '/api/context-graph/create', {
      name: graphName,
      description
    });
  }

  async createWorkingMemoryAssertion(name, contextGraph) {
    return this.request('POST', '/api/assertion/create', {
      name,
      contextGraph,
      layer: 'WM'
    });
  }

  async writeWorkingMemoryTriples(name, jsonLdAssertion) {
    return this.request('POST', `/api/assertion/${encodeURIComponent(name)}/write`, {
      format: 'json-ld',
      content: jsonLdAssertion
    });
  }

  async promoteToSharedWorkingMemory(name, targetContextGraph, rationale) {
    return this.request('POST', `/api/assertion/${encodeURIComponent(name)}/promote`, {
      targetLayer: 'SWM',
      contextGraph: targetContextGraph,
      rationale
    });
  }

  async queryContextGraph(contextGraph, sparqlQuery) {
    return this.request('POST', '/api/query', {
      contextGraph,
      query: sparqlQuery
    });
  }
}
