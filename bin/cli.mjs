#!/usr/bin/env node
import { DkgV10HttpClient } from '../src/dkg-client.mjs';
import { buildResearchAssertion, fetchArxivMetadata } from '../src/ingestor.mjs';

const args = process.argv.slice(2);
const command = args[0] || 'help';

async function main() {
  const client = new DkgV10HttpClient();
  const graph = process.env.DKG_CONTEXT_GRAPH || 'autoresearch-wiki';

  if (command === 'ingest') {
    const arxivId = args[1];
    const dryRun = args.includes('--dry-run');
    if (!arxivId) {
      console.error('Usage: dkg-arxiv-autoresearch ingest <arxivId> [--dry-run]');
      process.exit(1);
    }
    const meta = await fetchArxivMetadata(arxivId);
    const assertion = buildResearchAssertion({ ...meta, contextGraph: graph });
    const assertionName = `arxiv-${meta.arxivId.replace(/[^a-zA-Z0-9_-]/g, '-')}`;

    if (dryRun) {
      console.log(JSON.stringify({ status: 'dry-run', layer: 'WM', assertionName, assertion }, null, 2));
      return;
    }

    await client.ensureContextGraph(graph, 'Autoresearch & LLM-Wiki Context Graph');
    await client.createWorkingMemoryAssertion(assertionName, graph);
    const writeReceipt = await client.writeWorkingMemoryTriples(assertionName, assertion);
    console.log(JSON.stringify({ status: 'ingested-wm', assertionName, contextGraph: graph, writeReceipt }, null, 2));
    return;
  }

  if (command === 'promote') {
    const assertionName = args[1];
    const rationale = args.slice(2).join(' ') || 'Corroborated research claims verified for Shared Working Memory wiki synthesis.';
    if (!assertionName) {
      console.error('Usage: dkg-arxiv-autoresearch promote <assertionName> [rationale]');
      process.exit(1);
    }
    const receipt = await client.promoteToSharedWorkingMemory(assertionName, graph, rationale);
    console.log(JSON.stringify({ status: 'promoted-swm', assertionName, contextGraph: graph, receipt }, null, 2));
    return;
  }

  if (command === 'query') {
    const keyword = args[1] || '';
    const escaped = keyword.replace(/["\\]/g, '');
    const sparql = `
      PREFIX schema: <https://schema.org/>
      PREFIX prov: <http://www.w3.org/ns/prov#>
      SELECT ?paper ?title ?claimText WHERE {
        ?paper a schema:ScholarlyArticle ;
               schema:headline ?title .
        OPTIONAL {
          ?claim prov:wasDerivedFrom ?paper ;
                 schema:text ?claimText .
        }
        ${escaped ? `FILTER(CONTAINS(LCASE(STR(?title)), LCASE("${escaped}")) || CONTAINS(LCASE(STR(?claimText)), LCASE("${escaped}")))` : ''}
      }
      LIMIT 25
    `.trim();
    const res = await client.queryContextGraph(graph, sparql);
    console.log(JSON.stringify({ contextGraph: graph, results: res }, null, 2));
    return;
  }

  console.log(`dkg-arxiv-autoresearch v0.1.0 — OriginTrail DKG v10 Autoresearch & LLM-Wiki CLI

Commands:
  dkg-arxiv-autoresearch ingest <arxiv-id> [--dry-run]   Fetch arXiv paper, extract PROV-O claims, and write to Working Memory (WM)
  dkg-arxiv-autoresearch promote <assertion-name>        Promote a validated WM assertion to Shared Working Memory (SWM)
  dkg-arxiv-autoresearch query [keyword]                 Run grounded SPARQL retrieval over the bound Context Graph
`);
}

main().catch((err) => {
  console.error('[dkg-arxiv-autoresearch error]', err.message);
  process.exit(1);
});
