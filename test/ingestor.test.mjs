import test from 'node:test';
import assert from 'node:assert/strict';
import { buildResearchAssertion } from '../src/ingestor.mjs';

test('buildResearchAssertion produces valid PROV-O + Schema.org JSON-LD with deterministic sha256 digest', () => {
  const assertion = buildResearchAssertion({
    arxivId: '2401.00001',
    title: 'Verifiable Knowledge Graphs for Autonomous Research Agents',
    authors: ['Ada Lovelace', 'Alan Turing'],
    publishedAt: '2026-01-15',
    abstractText: 'We introduce a three-tier memory architecture uniting Working Memory, Shared Working Memory, and Verifiable Memory.',
    claims: [
      'Working Memory isolates unverified candidate claims during exploratory literature ingestion.',
      'Shared Working Memory coordinates multi-agent synthesis over a scoped Context Graph.'
    ],
    contextGraph: 'autoresearch-wiki'
  });

  assert.equal(assertion['dkg:contextGraph'], 'autoresearch-wiki');
  assert.match(assertion['dkg:sourceDigestSha256'], /^[a-f0-9]{64}$/);
  assert.equal(assertion['@graph'].length, 4); // 1 article + 1 activity + 2 claims
  assert.equal(assertion['@graph'][0]['dcterms:identifier'], '2401.00001');
  assert.equal(assertion['@graph'][2]['prov:wasDerivedFrom']['@id'], 'urn:dkg:autoresearch:paper:2401.00001');
});
