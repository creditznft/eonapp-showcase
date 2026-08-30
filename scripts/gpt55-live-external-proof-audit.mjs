#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createHmac } from 'node:crypto';
import dotenv from 'dotenv';

const ROOT = process.cwd();
dotenv.config({ path: path.join(ROOT, '.env.local') });
dotenv.config();

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return Object.fromEntries(
    fs.readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .filter((line) => /^[A-Za-z_][A-Za-z0-9_]*=/.test(line))
      .map((line) => {
        const idx = line.indexOf('=');
        return [line.slice(0, idx), line.slice(idx + 1)];
      })
  );
}

const localEnv = parseEnvFile(path.join(ROOT, '.env.local'));

const REPORT_DIR = path.join(ROOT, 'reports', 'session10', 'live', 'external-proof-audit');
fs.mkdirSync(REPORT_DIR, { recursive: true });

const REPORT_JSON = path.join(REPORT_DIR, 'gpt55-live-external-proof-audit.json');
const REPORT_MD = path.join(REPORT_DIR, 'gpt55-live-external-proof-audit.md');

function envValue(...names) {
  for (const name of names) {
    const value = String((localEnv[name] ?? process.env[name] ?? '')).trim();
    if (value) return value;
  }
  return '';
}

function boolFromEnv(name) {
  return envValue(name) === '1';
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function sanitizeCloudflareEnvVars(envVars = {}, keys = []) {
  return Object.fromEntries(
    keys
      .filter((key) => envVars[key])
      .map((key) => [key, {
        configured: true,
        type: envVars[key].type || 'unknown'
      }])
  );
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let body = null;
  try {
    body = JSON.parse(text);
  } catch {
    body = { rawSnippet: text.slice(0, 300) };
  }
  return { status: response.status, ok: response.ok, body };
}

function buildSignedTelegramInitData(botToken) {
  const params = new URLSearchParams();
  params.set('auth_date', String(Math.floor(Date.now() / 1000)));
  params.set('query_id', 'AAHdF6IQAAAAAN0XohDhrOrc');
  params.set('user', JSON.stringify({
    id: 777000123,
    first_name: 'Codex',
    username: 'codex_live_probe',
    language_code: 'en'
  }));

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const hash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  params.set('hash', hash);
  return params.toString();
}

function buildNowPaymentsAuthHeaders(apiKey) {
  const token = String(apiKey || '').trim().replace(/^Bearer\s+/i, '');
  const looksLikeJwt = token.split('.').length === 3;
  return looksLikeJwt
    ? { Authorization: `Bearer ${token}` }
    : { 'x-api-key': token };
}

function recordCheck(target, id, ok, detail, extra = {}) {
  target.push({ id, ok: Boolean(ok), detail, ...extra });
}

async function run() {
  const checks = [];
  const warnings = [];
  const pending = [];

  const baseUrl = envValue('EONAPP_PUBLIC_URL', 'EONAPP_SITE_URL') || 'https://eonapp.ch';
  const cloudflareAccountId = envValue('CLOUDFLARE_ACCOUNT_ID', 'EON_CLOUDFLARE_ACCOUNT_ID');
  const cloudflareToken = envValue('CLOUDFLARE_API_TOKEN', 'EON_CLOUDFLARE_API_KEY');
  const cloudflareProject = envValue('CLOUDFLARE_PAGES_PROJECT') || 'eonapp-ch';
  const telegramBotToken = envValue('TELEGRAM_BOT_TOKEN');
  const telegramChannel = envValue('TELEGRAM_CHANNEL_USERNAME') || 'EonApps';
  const adRewardSecret = envValue('AD_REWARD_POSTBACK_SECRET');
  const monetagZoneId = envValue('MONETAG_REWARDED_ZONE_ID') || '11111741';
  const nowpaymentsApiKey = envValue('NOWPAYMENTS_API_KEY');

  const flags = {
    realPaymentAllowed: boolFromEnv('EON_ALLOW_REAL_PAYMENT_TEST'),
    realChainWriteAllowed: boolFromEnv('EON_ALLOW_REAL_CHAIN_WRITE'),
    maxPaymentTestUsd: envValue('EON_MAX_PAYMENT_TEST_USD') || '1.00',
    maxGasTestUsd: envValue('EON_MAX_GAS_TEST_USD') || '5.00'
  };

  const evidence = {
    browserMatrix: readJsonIfExists(path.join(ROOT, 'reports', 'session10', 'live', 'browser-matrix', 'w136-browser-proof-summary.json')),
    httpProof: readJsonIfExists(path.join(ROOT, 'reports', 'session10', 'live', 'http-proof', 'http-proof.json')),
    vaultRestore: readJsonIfExists(path.join(ROOT, 'reports', 'session10', 'live', 'vault-restore-drill', 'W103_UPDATE_SAFE_PERSISTENCE_PROOF.json'))
  };

  const endpointPreflight = {
    adStatus: await fetchJson(`${baseUrl}/api/ad-rewards/status?ymid=codex-preflight-check`, { headers: { accept: 'application/json' } }),
    nowpaymentsStatus: await fetchJson(`${baseUrl}/api/nowpayments/status?plan_id=supporter`, { headers: { accept: 'application/json' } })
  };

  recordCheck(checks, 'prod-ad-status-route', endpointPreflight.adStatus.status === 200 && endpointPreflight.adStatus.body?.privacy?.rawIpStored === false, 'Production ad-rewards status endpoint responds with value-only privacy-safe shape.');
  recordCheck(checks, 'prod-nowpayments-status-route', endpointPreflight.nowpaymentsStatus.status === 200 && endpointPreflight.nowpaymentsStatus.body?.payment_status === 'not_found', 'Production NOWPayments status endpoint responds cleanly for a lookup miss.');

  let cloudflare = { ok: false };
  if (cloudflareAccountId && cloudflareToken) {
    const cloudflareResponse = await fetchJson(`https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/pages/projects/${cloudflareProject}`, {
      headers: {
        Authorization: `Bearer ${cloudflareToken}`,
        'content-type': 'application/json'
      }
    });
    const result = cloudflareResponse.body?.result || {};
    cloudflare = {
      ok: cloudflareResponse.ok,
      status: cloudflareResponse.status,
      project: result?.name || cloudflareProject,
      domains: Array.isArray(result?.domains) ? result.domains : [],
      source: result?.source || null,
      deploymentConfigs: {
        preview: {
          envVars: sanitizeCloudflareEnvVars(result?.deployment_configs?.preview?.env_vars || {}, [
            'AD_REWARD_POSTBACK_SECRET',
            'NOWPAYMENTS_API_KEY',
            'NOWPAYMENTS_IPN_SECRET',
            'TELEGRAM_BOT_TOKEN',
            'TELEGRAM_CHANNEL_USERNAME',
            'MONETAG_REWARDED_ZONE_ID'
          ]),
          kvNamespaces: Object.keys(result?.deployment_configs?.preview?.kv_namespaces || {})
        },
        production: {
          envVars: sanitizeCloudflareEnvVars(result?.deployment_configs?.production?.env_vars || {}, [
            'AD_REWARD_POSTBACK_SECRET',
            'NOWPAYMENTS_API_KEY',
            'NOWPAYMENTS_IPN_SECRET',
            'TELEGRAM_BOT_TOKEN',
            'TELEGRAM_CHANNEL_USERNAME',
            'MONETAG_REWARDED_ZONE_ID'
          ]),
          kvNamespaces: Object.keys(result?.deployment_configs?.production?.kv_namespaces || {})
        }
      }
    };

    const secretKeys = ['AD_REWARD_POSTBACK_SECRET', 'NOWPAYMENTS_API_KEY', 'NOWPAYMENTS_IPN_SECRET', 'TELEGRAM_BOT_TOKEN'];
    for (const envName of secretKeys) {
      const previewType = cloudflare.deploymentConfigs.preview.envVars[envName]?.type || '';
      const productionType = cloudflare.deploymentConfigs.production.envVars[envName]?.type || '';
      if (previewType === 'plain_text') warnings.push(`Cloudflare preview binding ${envName} is plain_text and should be secret_text.`);
      if (productionType === 'plain_text') warnings.push(`Cloudflare production binding ${envName} is plain_text and should be secret_text.`);
    }

    recordCheck(checks, 'cloudflare-pages-project', cloudflare.ok && cloudflare.project === cloudflareProject, 'Cloudflare Pages project metadata is reachable with the configured API token.');
  } else {
    warnings.push('Cloudflare account/token not available locally; skipping Pages project metadata audit.');
  }

  let telegram = { botApi: null, syntheticSession: null };
  if (telegramBotToken) {
    const botMe = await fetchJson(`https://api.telegram.org/bot${telegramBotToken}/getMe`);
    const botChat = await fetchJson(`https://api.telegram.org/bot${telegramBotToken}/getChat?chat_id=@${encodeURIComponent(telegramChannel)}`);
    telegram.botApi = {
      me: {
        status: botMe.status,
        ok: botMe.ok,
        okField: Boolean(botMe.body?.ok),
        username: botMe.body?.result?.username || null,
        hasMainWebApp: Boolean(botMe.body?.result?.has_main_web_app)
      },
      chat: {
        status: botChat.status,
        ok: botChat.ok,
        okField: Boolean(botChat.body?.ok),
        username: botChat.body?.result?.username || null,
        title: botChat.body?.result?.title || null,
        type: botChat.body?.result?.type || null
      }
    };
    recordCheck(checks, 'telegram-bot-token-valid', telegram.botApi.me.ok && telegram.botApi.me.okField === true, 'Telegram bot token is valid against the live Telegram Bot API.');
    recordCheck(checks, 'telegram-channel-reachable', telegram.botApi.chat.ok && telegram.botApi.chat.okField === true, 'Configured Telegram channel is reachable via the live Telegram Bot API.');

    const syntheticSession = await fetchJson(`${baseUrl}/api/telegram/session`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json'
      },
      body: JSON.stringify({
        initData: buildSignedTelegramInitData(telegramBotToken)
      })
    });
    telegram.syntheticSession = {
      status: syntheticSession.status,
      ok: syntheticSession.ok,
      body: {
        ok: Boolean(syntheticSession.body?.ok),
        userId: syntheticSession.body?.user?.id || null,
        username: syntheticSession.body?.user?.username || null,
        channelChecked: Boolean(syntheticSession.body?.channel?.checked),
        channelMember: Boolean(syntheticSession.body?.channel?.isMember),
        channelReason: syntheticSession.body?.channel?.reason || null
      }
    };
    recordCheck(checks, 'telegram-synthetic-session-proof', telegram.syntheticSession.status === 200 && telegram.syntheticSession.body?.ok === true, 'Production Telegram session endpoint accepts a correctly signed initData payload.');
  } else {
    warnings.push('TELEGRAM_BOT_TOKEN missing locally; skipping Telegram live API checks.');
  }

  let monetag = { syntheticYmid: null, postback: null, status: null };
  if (adRewardSecret) {
    monetag.syntheticYmid = `codex:synthetic-live-audit:${Date.now()}`;
    const postbackUrl = new URL(`${baseUrl}/api/ad-rewards/postback`);
    postbackUrl.searchParams.set('secret', adRewardSecret);
    postbackUrl.searchParams.set('provider', 'monetag');
    postbackUrl.searchParams.set('ymid', monetag.syntheticYmid);
    postbackUrl.searchParams.set('zone_id', monetagZoneId);
    postbackUrl.searchParams.set('sub_zone_id', 'codex-live-audit');
    postbackUrl.searchParams.set('request_var', 'codex-live-audit');
    postbackUrl.searchParams.set('event_type', 'reward');
    postbackUrl.searchParams.set('reward_event_type', 'valued');
    postbackUrl.searchParams.set('estimated_price', '0.001');

    monetag.postback = await fetchJson(postbackUrl.toString(), { headers: { accept: 'application/json' } });
    monetag.status = await fetchJson(`${baseUrl}/api/ad-rewards/status?ymid=${encodeURIComponent(monetag.syntheticYmid)}`, { headers: { accept: 'application/json' } });

    const monetagOk = monetag.postback.status === 200
      && monetag.postback.body?.verified === true
      && monetag.status.body?.found === true
      && monetag.status.body?.privacy?.telegramIdStored === false;
    recordCheck(checks, 'monetag-synthetic-postback-proof', monetagOk, 'Production postback and status endpoints store a synthetic valued Monetag record without raw identity fields.');
  } else {
    warnings.push('AD_REWARD_POSTBACK_SECRET missing locally; skipping Monetag synthetic proof.');
  }

  const nowpayments = {
    createSubscriptionInvalidEmail: await fetchJson(`${baseUrl}/api/nowpayments/create-subscription`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json'
      },
      body: JSON.stringify({
        plan_id: 'supporter',
        email: 'invalid-email'
      })
    })
  };
  recordCheck(checks, 'nowpayments-create-subscription-secret-presence', nowpayments.createSubscriptionInvalidEmail.status === 400 && nowpayments.createSubscriptionInvalidEmail.body?.error === 'invalid_email', 'Production create-subscription route gets past the missing-secret check and validates input.');

  const upstreamProbeEmail = `codex-proof-${Date.now()}@example.invalid`;
  nowpayments.createSubscriptionUpstreamProbe = await fetchJson(`${baseUrl}/api/nowpayments/create-subscription`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json'
    },
    body: JSON.stringify({
      plan_id: 'supporter',
      email: upstreamProbeEmail
    })
  });
  const upstreamProbeStructured = typeof nowpayments.createSubscriptionUpstreamProbe.body === 'object'
    && nowpayments.createSubscriptionUpstreamProbe.body !== null
    && Object.prototype.hasOwnProperty.call(nowpayments.createSubscriptionUpstreamProbe.body, 'ok');
  recordCheck(
    checks,
    'nowpayments-route-structured-upstream-response',
    upstreamProbeStructured && nowpayments.createSubscriptionUpstreamProbe.body?.cloudflare_error !== true,
    'Production create-subscription route should return app JSON for an upstream probe, not a Cloudflare origin error blob.'
  );

  if (nowpaymentsApiKey) {
    nowpayments.providerDirectProbe = await fetchJson('https://api.nowpayments.io/v1/subscriptions', {
      method: 'POST',
      headers: {
        ...buildNowPaymentsAuthHeaders(nowpaymentsApiKey),
        'content-type': 'application/json',
        accept: 'application/json'
      },
      body: JSON.stringify({
        subscription_plan_id: 'supporter_monthly_100',
        email: upstreamProbeEmail
      })
    });
    const directCode = nowpayments.providerDirectProbe.body?.code || null;
    recordCheck(
      checks,
      'nowpayments-provider-auth-live',
      !['AUTH_REQUIRED', 'INVALID_AUTH_TOKEN'].includes(String(directCode || '')),
      'Local NOWPayments credential should authenticate against the live provider subscriptions endpoint.'
    );
  } else {
    warnings.push('NOWPAYMENTS_API_KEY missing locally; skipping direct provider auth probe.');
  }

  const evm = {
    quote: await fetchJson(`${baseUrl}/api/evm/quote`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json'
      },
      body: JSON.stringify({
        plan_id: 'supporter',
        chain_id: '137',
        token_key: 'usdc'
      })
    })
  };
  recordCheck(checks, 'evm-quote-preflight', evm.quote.status === 200 && evm.quote.body?.quote_id && evm.quote.body?.recipient_address, 'Production direct-EVM quote route can price a low-value Polygon USDC payment.');

  if (!flags.realPaymentAllowed) pending.push('Low-value NOWPayments finished payment proof is still intentionally blocked by EON_ALLOW_REAL_PAYMENT_TEST=0.');
  if (!flags.realChainWriteAllowed) pending.push('Funded low-value EVM receipt proof is still intentionally blocked by EON_ALLOW_REAL_CHAIN_WRITE=0.');
  pending.push('Real Telegram Mini App session inside @EonAppsBot still needs a genuine user/device initData flow.');
  pending.push('Real Monetag ad watch and provider-origin yes/valued postback still need a genuine provider event, not the synthetic server-path audit record.');
  if (!checks.find((item) => item.id === 'nowpayments-route-structured-upstream-response')?.ok) pending.push('NOWPayments create-subscription route still needs a deploy with structured upstream error handling.');
  if (!checks.find((item) => item.id === 'nowpayments-provider-auth-live')?.ok) pending.push('NOWPayments provider credential needs refresh or replacement before live subscription proof can finish.');

  const summary = {
    schema: 'eonapp.gpt55.live-external-proof-audit.v1',
    checkedAt: new Date().toISOString(),
    baseUrl,
    flags,
    checks,
    warnings,
    pending,
    cloudflare,
    telegram,
    monetag,
    nowpayments,
    evm,
    existingEvidence: {
      browserMatrix: evidence.browserMatrix ? {
        ok: Boolean(evidence.browserMatrix.ok),
        blockerCount: Number(evidence.browserMatrix.blockerCount || 0),
        strict: Boolean(evidence.browserMatrix.strict)
      } : null,
      httpProof: evidence.httpProof ? {
        ok: Boolean(evidence.httpProof.ok),
        failureCount: Number(evidence.httpProof.failureCount || 0)
      } : null,
      vaultRestore: evidence.vaultRestore ? {
        ok: Boolean(
          evidence.vaultRestore.ok
          ?? evidence.vaultRestore.passed
          ?? evidence.vaultRestore.status === 'PASS'
        ),
        schema: evidence.vaultRestore.schema || null
      } : null
    }
  };

  summary.ok = checks.every((item) => item.ok);
  summary.safeAutomationGreen = summary.ok;
  summary.realMoneyAutomationEnabled = flags.realPaymentAllowed || flags.realChainWriteAllowed;

  const md = [
    '# GPT-5.5 Live External Proof Audit',
    '',
    `Checked at: ${summary.checkedAt}`,
    `Base URL: ${summary.baseUrl}`,
    '',
    `Safe automation status: ${summary.safeAutomationGreen ? 'GREEN' : 'REVIEW'}`,
    `Real money automation enabled: ${summary.realMoneyAutomationEnabled ? 'YES' : 'NO'}`,
    '',
    '## Safe automation checks',
    ...checks.map((item) => `- ${item.ok ? 'PASS' : 'FAIL'} — ${item.id}: ${item.detail}`),
    '',
    '## Existing live evidence',
    `- Browser matrix: ${summary.existingEvidence.browserMatrix ? (summary.existingEvidence.browserMatrix.ok ? 'GREEN' : 'REVIEW') : 'missing'}`,
    `- HTTP proof: ${summary.existingEvidence.httpProof ? (summary.existingEvidence.httpProof.ok ? 'GREEN' : 'REVIEW') : 'missing'}`,
    `- Vault restore drill: ${summary.existingEvidence.vaultRestore ? (summary.existingEvidence.vaultRestore.ok ? 'GREEN' : 'REVIEW') : 'missing'}`,
    '',
    '## Pending live-only proof',
    ...pending.map((item) => `- ${item}`),
    '',
    '## Warnings',
    ...(warnings.length ? warnings.map((item) => `- ${item}`) : ['- none'])
  ].join('\n');

  fs.writeFileSync(REPORT_JSON, `${JSON.stringify(summary, null, 2)}\n`);
  fs.writeFileSync(REPORT_MD, `${md}\n`);
  console.log(JSON.stringify({
    ok: summary.ok,
    safeAutomationGreen: summary.safeAutomationGreen,
    reportJson: REPORT_JSON,
    reportMd: REPORT_MD,
    warnings: summary.warnings,
    pending: summary.pending
  }, null, 2));
}

run().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    error: String(error?.message || error || 'unknown_error')
  }, null, 2));
  process.exit(1);
});
