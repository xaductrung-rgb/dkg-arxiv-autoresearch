import crypto from 'node:crypto';

/**
 * Converts an arXiv paper or research note into a deterministic PROV-O + Schema.org
 * JSON-LD Assertion suitable for DKG v10 Working Memory (WM) and Shared Working Memory (SWM).
 */
export function buildResearchAssertion({
  arxivId,
  title,
  authors = [],
  publishedAt,
  abstractText,
  claims = [],
  contextGraph = 'autoresearch-wiki'
}) {
  if (!arxivId || !title || !abstractText) {
    throw new Error('arxivId, title, and abstractText are required to build a DKG v10 assertion.');
  }
  const normalizedId = String(arxivId).trim().replace(/[^a-zA-Z0-9._-]/g, '-');
  const sourceUri = `https://arxiv.org/abs/${normalizedId}`;
  const digestSha256 = crypto
    .createHash('sha256')
    .update(`${normalizedId}|${title}|${abstractText}`, 'utf8')
    .digest('hex');

  const entityId = `urn:dkg:autoresearch:paper:${normalizedId}`;
  const activityId = `urn:dkg:autoresearch:ingestion:${digestSha256.slice(0, 16)}`;

  const claimNodes = claims.map((claimText, idx) => {
    const claimHash = crypto.createHash('sha256').update(claimText, 'utf8').digest('hex').slice(0, 12);
    return {
      '@id': `urn:dkg:autoresearch:claim:${normalizedId}:${idx + 1}-${claimHash}`,
      '@type': ['prov:Entity', 'schema:Claim'],
      'schema:text': claimText,
      'prov:wasDerivedFrom': { '@id': entityId },
      'prov:wasGeneratedBy': { '@id': activityId }
    };
  });

  return {
    '@context': {
      schema: 'https://schema.org/',
      prov: 'http://www.w3.org/ns/prov#',
      dcterms: 'http://purl.org/dc/terms/',
      dkg: 'https://origintrail.io/ns/dkg/v10#'
    },
    '@id': `urn:dkg:context-graph:${contextGraph}:assertion:${normalizedId}`,
    '@type': ['dkg:Assertion', 'prov:Bundle'],
    'dkg:contextGraph': contextGraph,
    'dkg:sourceDigestSha256': digestSha256,
    '@graph': [
      {
        '@id': entityId,
        '@type': ['schema:ScholarlyArticle', 'prov:Entity'],
        'dcterms:identifier': normalizedId,
        'schema:url': sourceUri,
        'schema:headline': title,
        'schema:author': authors.map((name) => ({ '@type': 'schema:Person', 'schema:name': name })),
        'schema:datePublished': publishedAt || new Date().toISOString().slice(0, 10),
        'schema:abstract': abstractText,
        'dkg:contentHash': `sha256:${digestSha256}`
      },
      {
        '@id': activityId,
        '@type': 'prov:Activity',
        'prov:used': { '@id': entityId },
        'prov:endedAtTime': new Date().toISOString(),
        'schema:description': 'Deterministic arXiv metadata and claim extraction into DKG v10 Working Memory'
      },
      ...claimNodes
    ]
  };
}

/**
 * Fetches live paper metadata from the public arXiv Atom API (http/https export.arxiv.org).
 */
export async function fetchArxivMetadata(arxivId) {
  const cleanId = String(arxivId).trim().replace(/^arxiv:/i, '');
  const url = `https://export.arxiv.org/api/query?id_list=${encodeURIComponent(cleanId)}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'dkg-arxiv-autoresearch/0.1.0' } });
  if (!res.ok) {
    throw new Error(`arXiv API returned HTTP ${res.status}`);
  }
  const xml = await res.text();
  const entries = xml.split('<entry>');
  if (entries.length < 2) {
    throw new Error(`No arXiv entry found for ID ${cleanId}`);
  }
  const entryXml = entries[1];
  const titleMatch = entryXml.match(/<title>([\s\S]*?)<\/title>/);
  const summaryMatch = entryXml.match(/<summary>([\s\S]*?)<\/summary>/);
  const publishedMatch = entryXml.match(/<published>([\s\S]*?)<\/published>/);
  const authorMatches = [...entryXml.matchAll(/<author>\s*<name>([\s\S]*?)<\/name>/g)];

  const title = (titleMatch?.[1] || cleanId).replace(/\s+/g, ' ').trim();
  const abstractText = (summaryMatch?.[1] || '').replace(/\s+/g, ' ').trim();
  const publishedAt = (publishedMatch?.[1] || '').trim().slice(0, 10);
  const authors = authorMatches.map((m) => m[1].trim()).filter(Boolean);

  const sentences = abstractText
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 30)
    .slice(0, 3);

  return {
    arxivId: cleanId,
    title,
    authors,
    publishedAt,
    abstractText,
    claims: sentences
  };
}
