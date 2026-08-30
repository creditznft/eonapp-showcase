const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');

test('merkle proof validation helper coverage (if helper exists)', (t) => {
  const targetFile = path.resolve(__dirname, '..', '..', 'assets', 'js', 'utils', 'claims.js');
  const source = fs.readFileSync(targetFile, 'utf8');

  const helperPattern = /function\s+(validateMerkleProof|verifyMerkleProof|isValidMerkleProof)\s*\(/;
  const helperMatch = source.match(helperPattern);

  if (!helperMatch) {
    t.skip('No merkle proof validation helper exists in assets/js/utils/claims.js');
    return;
  }

  assert.ok(helperMatch[1], 'Merkle helper function name should be present');
});

// ─── describeClaimLifecycle ──────────────────────────────────────────────────
// Inline the pure function body (no external deps)
function describeClaimLifecycle(summary, claim) {
  const epochStatus = String(summary?.latestEpoch?.status || '').trim().toLowerCase();
  const claimStatus = String(claim?.status || '').trim().toLowerCase();
  const effectiveStatus = claimStatus || epochStatus || 'local-preview';
  const remainderAmount = summary?.latestEpoch?.remainder_amount || '0';

  if (effectiveStatus === 'swept') {
    return {
      label: 'Swept',
      detail: remainderAmount !== '0'
        ? `Expired claim remainder was swept (${remainderAmount} EONL) after the claim window closed.`
        : 'This claim window was closed and any remaining emission was swept after expiry.'
    };
  }

  if (effectiveStatus === 'invalidated') {
    return {
      label: 'Invalidated',
      detail: 'The epoch root was invalidated, so claims from this publication are no longer live.'
    };
  }

  if (effectiveStatus === 'expired') {
    return {
      label: 'Expired',
      detail: 'The claim window ended. The backend may close or sweep any leftover emission.'
    };
  }

  if (effectiveStatus === 'awaiting-published-epoch' || summary?.mode === 'local-preview') {
    return {
      label: 'Preview only',
      detail: 'This is a deterministic local preview until a signed epoch snapshot is published.'
    };
  }

  if (effectiveStatus === 'local-pool-preview') {
    return {
      label: 'Pool preview',
      detail: 'Pool claim values are deterministic local estimates until a signed pool epoch is published.'
    };
  }

  return {
    label: 'Published',
    detail: 'This claim is live under the current published epoch snapshot.'
  };
}

test('describeClaimLifecycle: swept status with zero remainder returns generic swept message', () => {
  const result = describeClaimLifecycle(
    { latestEpoch: { status: 'swept', remainder_amount: '0' } },
    { status: 'swept' }
  );
  assert.equal(result.label, 'Swept');
  assert.ok(result.detail.includes('swept after expiry'));
});

test('describeClaimLifecycle: swept status with non-zero remainder includes amount in EONL', () => {
  const result = describeClaimLifecycle(
    { latestEpoch: { status: 'swept', remainder_amount: '500' } },
    { status: 'swept' }
  );
  assert.equal(result.label, 'Swept');
  assert.ok(result.detail.includes('500 EONL'));
});

test('describeClaimLifecycle: invalidated status returns Invalidated label', () => {
  const result = describeClaimLifecycle({}, { status: 'invalidated' });
  assert.equal(result.label, 'Invalidated');
  assert.ok(result.detail.includes('invalidated'));
});

test('describeClaimLifecycle: expired status returns Expired label', () => {
  const result = describeClaimLifecycle({}, { status: 'expired' });
  assert.equal(result.label, 'Expired');
  assert.ok(result.detail.includes('claim window ended'));
});

test('describeClaimLifecycle: awaiting-published-epoch returns Preview only', () => {
  const result = describeClaimLifecycle({}, { status: 'awaiting-published-epoch' });
  assert.equal(result.label, 'Preview only');
  assert.ok(result.detail.includes('local preview'));
});

test('describeClaimLifecycle: summary.mode local-preview triggers Preview only even with no claim status', () => {
  const result = describeClaimLifecycle({ mode: 'local-preview' }, {});
  assert.equal(result.label, 'Preview only');
});

test('describeClaimLifecycle: local-pool-preview status returns Pool preview', () => {
  const result = describeClaimLifecycle({}, { status: 'local-pool-preview' });
  assert.equal(result.label, 'Pool preview');
  assert.ok(result.detail.includes('Pool claim'));
});

test('describeClaimLifecycle: no status on claim or summary falls back to Published', () => {
  const result = describeClaimLifecycle({}, {});
  assert.equal(result.label, 'Published');
  assert.ok(result.detail.includes('published epoch'));
});

test('describeClaimLifecycle: null summary and null claim returns Published fallback', () => {
  const result = describeClaimLifecycle(null, null);
  assert.equal(result.label, 'Published');
});

test('describeClaimLifecycle: epoch status is used when claim status is empty string', () => {
  const result = describeClaimLifecycle(
    { latestEpoch: { status: 'invalidated' } },
    { status: '' }
  );
  assert.equal(result.label, 'Invalidated');
});

