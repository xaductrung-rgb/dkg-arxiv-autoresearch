# Acceptance Walkthrough & Verification Transcript

## 1. Environment & Unit Verification
```bash
$ git clone https://github.com/xaductrung-rgb/dkg-arxiv-autoresearch.git
$ cd dkg-arxiv-autoresearch
$ node --test test/ingestor.test.mjs
✔ buildResearchAssertion produces valid PROV-O + Schema.org JSON-LD with deterministic sha256 digest (2.41ms)
ℹ tests 1
ℹ pass 1
ℹ fail 0
```

## 2. Dry-Run PROV-O Assertion Generation (Working Memory Payload)
```bash
$ node ./bin/cli.mjs ingest 2305.10601 --dry-run
{
  "status": "dry-run",
  "layer": "WM",
  "assertionName": "arxiv-2305-10601",
  "assertion": {
    "@context": {
      "schema": "https://schema.org/",
      "prov": "http://www.w3.org/ns/prov#",
      "dcterms": "http://purl.org/dc/terms/",
      "dkg": "https://origintrail.io/ns/dkg/v10#"
    },
    "@id": "urn:dkg:context-graph:autoresearch-wiki:assertion:2305.10601",
    "@type": ["dkg:Assertion", "prov:Bundle"],
    "dkg:contextGraph": "autoresearch-wiki"
  }
}
```

## 3. Live Node Ingestion (WM) -> Promotion (SWM) -> Grounded Query
```bash
$ export DKG_API_URL="http://127.0.0.1:9200"
$ export DKG_CONTEXT_GRAPH="autoresearch-wiki"

# Step 1: Ingest paper into Working Memory (WM)
$ node ./bin/cli.mjs ingest 2305.10601
{
  "status": "ingested-wm",
  "assertionName": "arxiv-2305-10601",
  "contextGraph": "autoresearch-wiki"
}

# Step 2: Promote corroborated assertion from WM to Shared Working Memory (SWM)
$ node ./bin/cli.mjs promote arxiv-2305-10601 "Claims verified against primary benchmark tables"
{
  "status": "promoted-swm",
  "assertionName": "arxiv-2305-10601",
  "contextGraph": "autoresearch-wiki"
}

# Step 3: Query grounded claims from the bound Context Graph
$ node ./bin/cli.mjs query "Tree of Thoughts"
```
