import { test, expect } from '@playwright/test';

/**
 * E2E Tests — Post-Quantum Cryptography (PQC)
 * ============================================
 * Tests for pq-signing.js, pq-hybrid-kem.js, content-signing.js, secure-keystore.js
 */

test.describe('PQC — ML-DSA-65 Signing', () => {
  test('should generate PQ signing key pair in sessionStorage', async ({ page }) => {
    await page.goto('/build');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async () => {
      const mod = await import('/assets/js/utils/pq-signing.js');
      const keyPair = await mod.generateSigningKeyPair();
      const pub = await keyPair.exportPublicKey(); // exportPublicKey is async
      return {
        hasMlDsaPub: typeof pub.mlDsa === 'string' && pub.mlDsa.length === 3904, // 1952 bytes hex
        hasEcdsaPub: typeof pub.ecdsa === 'string' && pub.ecdsa.length === 130,  // 65 bytes hex (uncompressed)
        algorithm: pub.algorithm,
      };
    });

    expect(result.hasMlDsaPub).toBe(true);
    expect(result.hasEcdsaPub).toBe(true);
    expect(result.algorithm).toBe('hybrid-ml-dsa-65+ecdsa-p256-v1');
  });

  test('should sign and verify a message round-trip', async ({ page }) => {
    await page.goto('/build');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async () => {
      const mod = await import('/assets/js/utils/pq-signing.js');
      const keyPair = await mod.generateSigningKeyPair();
      const message = new TextEncoder().encode('Hello PQC E2E Test');
      const sig = await mod.sign(keyPair, message);
      const pub = await keyPair.exportPublicKey(); // exportPublicKey is async
      const verifyResult = await mod.verify(sig, message, pub);
      return {
        sigHasMlDsa: typeof sig.mlDsa === 'string' && sig.mlDsa.length > 0,
        sigHasEcdsa: typeof sig.ecdsa === 'string' && sig.ecdsa.length > 0,
        valid: verifyResult.valid,
        mlDsaValid: verifyResult.mlDsaValid,
        ecdsaValid: verifyResult.ecdsaValid,
      };
    });

    expect(result.sigHasMlDsa).toBe(true);
    expect(result.sigHasEcdsa).toBe(true);
    expect(result.valid).toBe(true);
    expect(result.mlDsaValid).toBe(true);
    expect(result.ecdsaValid).toBe(true);
  });

  test('should reject verification with tampered message', async ({ page }) => {
    await page.goto('/build');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async () => {
      const mod = await import('/assets/js/utils/pq-signing.js');
      const keyPair = await mod.generateSigningKeyPair();
      const original = new TextEncoder().encode('Original message');
      const tampered = new TextEncoder().encode('Tampered message!');
      const sig = await mod.sign(keyPair, original);
      const pub = await keyPair.exportPublicKey(); // exportPublicKey is async
      const verifyResult = await mod.verify(sig, tampered, pub);
      return { valid: verifyResult.valid };
    });

    expect(result.valid).toBe(false);
  });

  test('should persist key pair across same-session reloads (sessionStorage)', async ({ page }) => {
    await page.goto('/build');
    await page.waitForLoadState('networkidle');

    const pub1 = await page.evaluate(async () => {
      const mod = await import('/assets/js/utils/pq-signing.js');
      // getOrCreateKeyPair returns PQSigningKeyPair directly; exportPublicKey is async
      const keyPair = await mod.getOrCreateKeyPair('session-persist-test', 'e2e-test-pw');
      const pub = await keyPair.exportPublicKey();
      return pub.mlDsa.slice(0, 64); // first 32 bytes as hex
    });

    // Reload without clearing session (sessionStorage persists within same tab)
    await page.reload();
    await page.waitForLoadState('networkidle');

    const pub2 = await page.evaluate(async () => {
      const mod = await import('/assets/js/utils/pq-signing.js');
      const keyPair = await mod.getOrCreateKeyPair('session-persist-test', 'e2e-test-pw');
      const pub = await keyPair.exportPublicKey();
      return pub.mlDsa.slice(0, 64);
    });

    expect(pub1).toBe(pub2);
  });
});

test.describe('PQC — ML-KEM-768 Hybrid KEM', () => {
  test('should generate a valid hybrid key pair (1216 byte public key)', async ({ page }) => {
    await page.goto('/build');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async () => {
      const mod = await import('/assets/js/utils/pq-hybrid-kem.js?t=' + Date.now());
      const kp = await mod.generateKeyPair();
      return {
        // publicKeyRaw is the combined 1216-byte Uint8Array (kyber 1184 + x25519 32)
        publicKeyLen: kp.publicKeyRaw.length,
        hasPrivateKey: kp.privateKey !== null,
      };
    });

    expect(result.publicKeyLen).toBe(1216); // 1184 (kyber) + 32 (x25519)
    expect(result.hasPrivateKey).toBe(true);
  });

  test('should encapsulate and decapsulate shared secret (KEM round-trip)', async ({ page }) => {
    await page.goto('/build');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async () => {
      const mod = await import('/assets/js/utils/pq-hybrid-kem.js?t=' + Date.now());
      const recipientKP = await mod.generateKeyPair();
      // encapsulate takes publicKeyRaw (the 1216-byte combined Uint8Array)
      const { ciphertext, sharedSecret: ss1 } = await mod.encapsulate(recipientKP.publicKeyRaw);
      const ss2 = await mod.decapsulate(ciphertext, recipientKP.privateKey);
      // Both sides should derive identical 32-byte shared secret
      const match = ss1.length === 32 && ss2.length === 32
        && ss1.every((/** @type {number} */ v, /** @type {number} */ i) => v === ss2[i]);
      return { match, ss1Len: ss1.length, ss2Len: ss2.length };
    });

    expect(result.ss1Len).toBe(32);
    expect(result.ss2Len).toBe(32);
    expect(result.match).toBe(true);
  });
});

test.describe('PQC — Content Signing', () => {
  test('should sign and verify an asset with content-signing.js', async ({ page }) => {
    await page.goto('/build');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async () => {
      const mod = await import('/assets/js/utils/content-signing.js');
      const asset = { id: 'test-asset-1', name: 'Test NFT', type: 'nft', rarity: 'rare' };
      const sigBundle = await mod.ContentSigning.signAsset('0xCreatorAddress', asset);
      const verifyResult = await mod.ContentSigning.verifyAsset(asset, sigBundle);
      return {
        hasSig: typeof sigBundle.signature?.mlDsa === 'string',
        valid: verifyResult.valid,
        mlDsaValid: verifyResult.mlDsaValid,
      };
    });

    expect(result.hasSig).toBe(true);
    expect(result.valid).toBe(true);
    expect(result.mlDsaValid).toBe(true);
  });
});
