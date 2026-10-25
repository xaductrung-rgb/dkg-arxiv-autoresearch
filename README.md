# dkg-arxiv-autoresearch

**OriginTrail DKG v10 Autoresearch & LLM-Wiki Ingestion CLI** — ingests scientific literature from arXiv into DKG v10 **Working Memory (`WM`)** as W3C PROV-O + Schema.org JSON-LD assertions, promotes corroborated findings into **Shared Working Memory (`SWM`)** within a bound `ContextGraph`, and serves deterministic grounded queries with citation provenance.

## Features
- **DKG v10 Native Lifecycle (`WM` → `SWM`)**: Uses only supported DKG v10 HTTP API endpoints (`/api/context-graph/create`, `/api/assertion/create`, `/api/assertion/{name}/write`, `/api/assertion/{name}/promote`, `/api/query`).
- **PROV-O Citation Provenance**: Every extracted claim node (`schema:Claim`) links back to its source article entity (`urn:dkg:autoresearch:paper:<arxivId>`) via `prov:wasDerivedFrom` and includes a SHA-256 content digest (`dkg:sourceDigestSha256`).
- **Zero External Dependencies & Zero Install Scripts**: Built on Node.js >=22 native `fetch` and `node:crypto`.

## Quick Start

```bash
git clone https://github.com/xaductrung-rgb/dkg-arxiv-autoresearch.git
cd dkg-arxiv-autoresearch
node --test test/ingestor.test.mjs

# Preview JSON-LD assertion without a running node
node ./bin/cli.mjs ingest 2305.10601 --dry-run

# Connect to local DKG v10 node
export DKG_API_URL="http://127.0.0.1:9200"
export DKG_AUTH_TOKEN="<your-local-node-token>"
export DKG_CONTEXT_GRAPH="autoresearch-wiki"

# 1. Ingest into Working Memory (WM)
node ./bin/cli.mjs ingest 2305.10601

# 2. Promote from WM to Shared Working Memory (SWM)
node ./bin/cli.mjs promote arxiv-2305-10601 "Reviewed for LLM-Wiki synthesis"

# 3. Query the Context Graph
node ./bin/cli.mjs query "reasoning"
```

## Architecture & Documentation
- [Architecture & Design Brief (`DESIGN.md`)](./DESIGN.md)
- [Acceptance Walkthrough (`docs/acceptance-transcript.md`)](./docs/acceptance-transcript.md)

## License
Apache-2.0
