# Design Brief: DKG arXiv Autoresearch & LLM-Wiki Ingestor (`dkg-arxiv-autoresearch`)

## 1. Purpose & Fit with the DKG v10 Direction (LLM-Wiki & Autoresearch)
Autonomous research agents and collaborative LLM-Wikis suffer from two failure modes when ingesting scientific literature:
1. **Unverified Hallucination Pollution**: Writing raw, single-pass LLM extractions directly into shared or permanent memory pollutes downstream retrieval.
2. **Broken Provenance**: Wiki summaries lose cryptographic and structural links (`prov:wasDerivedFrom`) back to the primary source identifier (arXiv ID / content hash).

`dkg-arxiv-autoresearch` solves both problems natively on **OriginTrail DKG v10** by mapping the scientific literature ingestion pipeline onto the v10 memory hierarchy:
- **Working Memory (`WM`)**: Newly ingested arXiv preprints and extracted atomic claims (`schema:Claim`) land in private Working Memory via `POST /api/assertion/create` and `POST /api/assertion/{name}/write`. Each assertion carries a deterministic SHA-256 content digest (`dkg:sourceDigestSha256`) and a W3C PROV-O bundle (`prov:Entity`, `prov:Activity`, `prov:wasDerivedFrom`).
- **Shared Working Memory (`SWM`)**: Once claims are corroborated or reviewed by a research agent/operator, `dkg-arxiv-autoresearch promote` calls `POST /api/assertion/{name}/promote` to elevate the assertion into the team's bound `ContextGraph` in Shared Working Memory.
- **Grounded Retrieval**: Agents query the `ContextGraph` via `POST /api/query` with deterministic SPARQL templates that return both claim text and its exact `urn:dkg:autoresearch:paper:<id>` provenance URI.

## 2. DKG v10 Primitives & Public Interfaces Exercised
- **Public Interfaces**: `http-api` exclusively (`POST /api/context-graph/create`, `POST /api/assertion/create`, `POST /api/assertion/{name}/write`, `POST /api/assertion/{name}/promote`, `POST /api/query`). Does not touch internal node packages or bypass the assertion lifecycle.
- **v10 Primitives**: `ContextGraph`, `Assertion`, `SubGraph`, `Entity`.
- **Memory Layers**: `WM` and `SWM` (Round-1 compliant; never invokes unapproved Verifiable Memory on-chain publishing).

## 3. Promotion Path Toward Verified Memory & Context Oracles
1. **WM Stage (Scratchpad Ingestion)**: Candidate papers and extracted claim sub-graphs are staged in `WM` where noisy or low-confidence extractions can be discarded without polluting shared state.
2. **SWM Stage (Collaborative LLM-Wiki)**: Corroborated assertions are promoted to `SWM` inside a topic-scoped `ContextGraph` (e.g., `autoresearch-wiki`), forming a multi-agent shared literature graph.
3. **VM & Context Oracle Readiness**: Because every `SWM` assertion is already structured as a self-contained JSON-LD `prov:Bundle` with deterministic URNs (`urn:dkg:autoresearch:paper:<arxivId>`), SHA-256 source digests, and explicit `prov:wasDerivedFrom` edges, a Curator can promote matured synthesis clusters directly into **Verified Memory (`VM`)** as anchored Knowledge Assets with zero schema rewriting. Context Oracles can then verify citation chains deterministically without calling an LLM.

## 4. Security & Trust Boundaries
- **Network Egress**: Connects only to `https://export.arxiv.org/api/query` (read-only public arXiv metadata API) and the operator's local DKG v10 node (`DKG_API_URL`, default `http://127.0.0.1:9200`).
- **Credentials Handled**: None beyond the standard `DKG_AUTH_TOKEN` provided by the local node.
- **Zero Install Hooks**: Pure ESM Node.js (>=22) with zero external runtime dependencies and no `preinstall`/`install`/`postinstall` scripts.
