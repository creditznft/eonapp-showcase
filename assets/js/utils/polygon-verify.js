/**
 * polygon-verify.js — Decentralised Polygon TX confirmation polling
 *
 * Polls the public Polygon RPC directly (no Polygonscan API key required).
 * Uses eth_getTransactionReceipt which is free and works without authentication.
 *
 * Architecture: 100% client-side, zero backend dependency.
 */

const POLYGON_RPC_URLS = [
  'https://polygon-rpc.com',
  'https://rpc-mainnet.matic.network',
  'https://rpc-mainnet.maticvigil.com'
];
const POLL_INTERVAL_MS  = 3_000;   // 3 seconds
const TIMEOUT_MS        = 120_000; // 2 minutes max

/**
 * Poll for a Polygon transaction receipt until confirmed or timeout.
 *
 * @param {string} txHash - 0x-prefixed transaction hash
 * @param {{ onPoll?: (attempt: number) => void }} [opts]
 * @returns {Promise<{ confirmed: boolean, blockNumber: string|null, status: string|null, txHash: string, error?: string }>}
 */
export async function waitForTxConfirmation(txHash, opts = {}) {
  if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
    return { confirmed: false, blockNumber: null, status: null, txHash, error: 'Invalid tx hash format.' };
  }

  const started = Date.now();
  let attempt = 0;
  let rpcIndex = 0;

  while (Date.now() - started < TIMEOUT_MS) {
    attempt++;
    opts.onPoll?.(attempt);

    const rpcUrl = POLYGON_RPC_URLS[rpcIndex % POLYGON_RPC_URLS.length];

    try {
      const resp = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: attempt,
          method: 'eth_getTransactionReceipt',
          params: [txHash]
        }),
        signal: AbortSignal.timeout(8_000)
      });

      if (resp.ok) {
        const json = await resp.json();
        const receipt = json?.result;

        if (receipt?.blockNumber) {
          const confirmed = receipt.status === '0x1';
          return {
            confirmed,
            blockNumber: parseInt(receipt.blockNumber, 16).toString(),
            status: confirmed ? 'success' : 'reverted',
            txHash
          };
        }
        // Receipt is null — tx still pending, keep polling
      }
    } catch (_err) {
      // RPC call failed — rotate to next endpoint and retry
      rpcIndex++;
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  return {
    confirmed: false,
    blockNumber: null,
    status: 'timeout',
    txHash,
    error: 'Transaction still pending after 2 minutes. Check Polygonscan for final status.'
  };
}

/**
 * Quick one-shot receipt check (non-polling). Returns null if pending.
 *
 * @param {string} txHash
 * @returns {Promise<{ confirmed: boolean, blockNumber: string|null, status: string|null } | null>}
 */
export async function checkTxReceipt(txHash) {
  if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) return null;
  for (const rpcUrl of POLYGON_RPC_URLS) {
    try {
      const resp = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getTransactionReceipt', params: [txHash] }),
        signal: AbortSignal.timeout(5_000)
      });
      if (!resp.ok) continue;
      const json = await resp.json();
      const receipt = json?.result;
      if (receipt?.blockNumber) {
        return {
          confirmed: receipt.status === '0x1',
          blockNumber: parseInt(receipt.blockNumber, 16).toString(),
          status: receipt.status === '0x1' ? 'success' : 'reverted'
        };
      }
      return null; // pending
    } catch {
      // try next RPC
    }
  }
  return null;
}
