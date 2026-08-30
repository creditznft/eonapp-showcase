/**
 * QUICK START: Distributed Inference for EONAPP.CH Developers
 * 
 * This file shows exactly what to add to each page to enable distributed inference
 * Copy-paste the relevant section into your HTML page
 */

// ============================================================================
// SECTION 1: MINIMAL SETUP (Add to Every Page)
// ============================================================================

/*
Add these <script> tags to the <head> or before closing </body>:

<script src="assets/js/services/DistributedInferenceService_V5.js"></script>
<script src="assets/js/utils/distributed-inference-helpers.js"></script>
<script src="assets/js/services/LocalRuntimeDetector.js"></script>
<script src="assets/js/integration/distributed-inference-integration.js"></script>

Then the system auto-initializes and is ready to use.
*/

// ============================================================================
// SECTION 2: ADD PROVIDER BADGE (Recommended on Every Page)
// ============================================================================

/*
HTML:
<div id="page-provider-badge"></div>

JavaScript (in your page's initialization):
document.addEventListener('DOMContentLoaded', async () => {
  const badge = new ProviderStatusBadge('page-provider-badge', {
    compact: false,
    showReputation: true,
    clickable: true,
  });
  await badge.update();
});

Result: Shows "🔵 Provider Name | Model | Reputation" badge
        Clicking opens detailed provider information modal
*/

// ============================================================================
// SECTION 3: CHAT PAGE (chat.html)
// ============================================================================

/*
1. Add provider badge to chat header:
   <div id="chat-provider-badge"></div>

2. Add model selector above chat input:
   <select id="chat-model-selector">
     <option value="">Select Model...</option>
   </select>

3. Add this JavaScript:

   document.addEventListener('DOMContentLoaded', async () => {
     // Initialize provider badge
     const badge = new ProviderStatusBadge('chat-provider-badge');
     await badge.update();

     // Load available models
     const models = await DistributedInferenceIntegration.getAvailableModels();
     const selector = document.getElementById('chat-model-selector');
     
     if (models.length) {
       selector.innerHTML = models.map(m => 
         `<option value="${m.modelId}">
            ${m.displayName} (${m.nodeCount}x, $${m.estimatedCostUsdPer1kTokens.toFixed(4)}/1k)
          </option>`
       ).join('');
     } else {
       selector.innerHTML = '<option value="">No models available</option>';
     }
   });

4. When user sends message:
   
   async function submitChatMessage(userMessage) {
     const modelId = document.getElementById('chat-model-selector').value;
     if (!modelId) {
       alert('Please select a model');
       return;
     }

     await DistributedInferenceIntegration.submitInference({
       modelId,
       prompt: userMessage,
       maxTokens: 2000,
       onResult: (result) => {
         displayBotMessage(result.response);
         showCost(result.costUSD);
       },
       onError: (err) => {
         displayBotMessage(`Error: ${err.message}`);
       }
     });
   }
*/

// ============================================================================
// SECTION 4: CREATOR STUDIO (creator-studio.html)
// ============================================================================

/*
1. Add to pipeline bar:
   <div id="studio-provider-badge"></div>

2. Add marketplace panel (optional):
   <div id="model-marketplace-panel"></div>

3. For each generation button (Music, Video, etc.):
   
   async function generateMusic(musicBrief) {
     const models = await DistributedInferenceIntegration.getAvailableModels();
     if (!models.length) {
       alert('No models available');
       return;
     }

     // Use best model (highest tier)
     const modelId = models[0].modelId;

     updateStatus('Generating music prompt...', 'loading');

     await DistributedInferenceIntegration.submitInference({
       modelId,
       prompt: `Create a music generation prompt for: ${musicBrief}`,
       maxTokens: 500,
       onResult: (result) => {
         populateMusicPrompt(result.response);
         updateStatus(`Generated with ${result.provider.name}`, 'success');
       },
       onError: (err) => {
         updateStatus(`Error: ${err.message}`, 'error');
       }
     });
   }
*/

// ============================================================================
// SECTION 5: EON BROWSER (eon-browser.html)
// ============================================================================

/*
1. Add local runtime status:
   <div id="local-runtime-status"></div>

2. Add provider badge:
   <div id="browser-provider-badge"></div>

3. Initialize:
   
   document.addEventListener('DOMContentLoaded', async () => {
     // Show local runtime status
     const detector = window.getLocalRuntimeDetector();
     const runtimes = await detector.scan();
     document.getElementById('local-runtime-status').innerHTML = 
       detector.renderStatusHTML();

     // Initialize provider badge
     const badge = new ProviderStatusBadge('browser-provider-badge');
     await badge.update();
   });

4. When generating research output:
   
   async function runSummary(urlContent) {
     await DistributedInferenceIntegration.submitInference({
       modelId: (await DistributedInferenceIntegration.getAvailableModels())[0].modelId,
       prompt: `Summarize: ${urlContent}`,
       maxTokens: 500,
       onResult: (result) => {
         displaySummary(result.response, {
           provider: result.provider.name,
           model: result.provider.model,
           cost: result.costUSD,
         });
       },
     });
   }
*/

// ============================================================================
// SECTION 6: MARKETPLACE (marketplace.html) - PROVIDER EARNINGS
// ============================================================================

/*
1. Add earnings dashboard (admin only):
   <div id="provider-earnings-dashboard"></div>

2. JavaScript:
   
   document.addEventListener('DOMContentLoaded', () => {
     // Auto-initializes if container exists
     // Displays earnings, jobs served, reputation
   });

3. To show provider info on listings:
   
   <div id="listing-provider-badge"></div>
   
   const badge = new ProviderStatusBadge('listing-provider-badge', { compact: true });
   badge.currentProvider = {
     name: listing.providerName,
     model: listing.modelUsed,
     reputation: listing.providerReputation,
     nodeId: listing.providerNodeId,
   };
   badge._render();
*/

// ============================================================================
// SECTION 7: DETECT LOCAL RUNTIMES (Any Page)
// ============================================================================

/*
Quick check if local models are available:

document.addEventListener('DOMContentLoaded', async () => {
  const detector = window.getLocalRuntimeDetector();
  const runtimes = await detector.scan();
  
  if (runtimes.length > 0) {
    console.log('✅ Local runtimes detected:', runtimes);
    // Show "Use Local Models" option
  } else {
    console.log('ℹ️ No local runtimes. Using hosted providers.');
    // Show "Using Hosted Models" message
  }
});
*/

// ============================================================================
// SECTION 8: PROVIDER NODE ANNOUNCEMENT (Operator Dashboard)
// ============================================================================

/*
For users who want to offer their GPU/CPU:

async function announceMyNode() {
  // Detect local runtime
  const detector = window.getLocalRuntimeDetector();
  const runtimes = await detector.scan();
  
  if (!runtimes.length) {
    alert('Start a local runtime first (Ollama, LM Studio, or Jan)');
    return;
  }

  const runtime = runtimes[0];

  // User selects tier
  const tier = prompt('Select tier (0-4, default 0): ') || 0;
  const stake = prompt('Stake amount in EON (for selected tier):');

  // Announce node
  const result = await DistributedInferenceIntegration.announceNode({
    userId: getCurrentUserId(),
    displayName: `My ${runtime.name} Node`,
    runtimeType: runtime.name,
    supportedModels: runtime.models.map(m => m.id),
    tier: parseInt(tier),
    stakeEON: parseInt(stake),
    gpu: prompt('GPU model (e.g., RTX 3060):') || 'Unknown',
    vramGB: parseInt(prompt('VRAM in GB:')) || 0,
    maxContextTokens: 4096,
  });

  if (result.success) {
    alert(`✅ Node announced!\nNode ID: ${result.nodeId}\nYour models are now available for rental`);
  } else {
    alert(`Error: ${result.error}`);
  }
}
*/

// ============================================================================
// SECTION 9: GET PROVIDER STATS (Operator Dashboard)
// ============================================================================

/*
Show provider earnings and statistics:

function showMyEarnings() {
  const userId = getCurrentUserId();
  const stats = DistributedInferenceIntegration.getProviderStats(userId);

  console.log('Provider Stats:', {
    nodes: stats.nodeCount,
    totalCU: stats.totalCUEarned,
    totalUSD: stats.totalEarningsUSD,
    jobsServed: stats.totalJobsServed,
    avgReputation: stats.avgReputation,
  });

  // Display in UI
  updateEarningsUI({
    cuEarned: `${stats.totalCUEarned.toFixed(2)} CU`,
    usdEarned: `$${stats.totalEarningsUSD.toFixed(2)}`,
    jobsServed: stats.totalJobsServed,
    reputation: `${stats.avgReputation}%`,
  });
}

// Auto-update every 30 seconds
setInterval(showMyEarnings, 30000);
*/

// ============================================================================
// SECTION 10: TIER GUIDANCE (Any page with model selection)
// ============================================================================

/*
Show tier recommendations to users:

function showTierGuidance(modelId) {
  const guidance = DistributedInferenceIntegration.getTierGuidance(modelId);

  console.log(`Tier ${guidance.tier}: ${guidance.tierName}`);
  console.log(`Description: ${guidance.tierDescription}`);
  console.log(`CU Multiplier: ${guidance.cuMultiplier}×`);
  console.log(`Stake Required: ${guidance.stakeRequired.toLocaleString()} EON`);
  console.log(`Benefits:`, guidance.benefits);

  // Display as helpful tooltip
  displayTooltip(`
    <strong>${guidance.tierName}</strong><br/>
    ${guidance.tierDescription}<br/>
    Earn: ${guidance.cuMultiplier}× compute units<br/>
    Requires: ${guidance.stakeRequired.toLocaleString()} EON stake
  `);
}
*/

// ============================================================================
// SECTION 11: TESTING / DEBUGGING
// ============================================================================

/*
Test the distributed inference system in browser console:

// Check if system initialized
window.getDistributedInferenceService()
window.getLocalRuntimeDetector()
window.DistributedInferenceIntegration

// Get current state
const service = window.getDistributedInferenceService();
console.log('Nodes:', Array.from(service.nodes.values()));
console.log('Requests:', Array.from(service.requests.values()));

// Get available models
const models = await window.getDistributedInferenceService().getNetworkModels();
console.log('Available Models:', models);

// Detect local runtimes
const detector = window.getLocalRuntimeDetector();
const runtimes = await detector.scan();
console.log('Local Runtimes:', runtimes);

// Submit test inference
await DistributedInferenceIntegration.submitInference({
  modelId: models[0].modelId,
  prompt: 'Hello world',
  maxTokens: 100,
  onResult: (r) => console.log('Result:', r),
  onError: (e) => console.error('Error:', e),
});
*/

// ============================================================================
// END OF QUICK START
// ============================================================================

/*
For full documentation, see: DISTRIBUTED_INFERENCE_INTEGRATION_GUIDE.md

Common Issues:
1. Models not appearing?
   - Start a local runtime (Ollama, LM Studio, Jan)
   - Check console for errors
   - Verify browser can reach http://localhost:11434 (Ollama)

2. Provider status badge shows "Guide"?
   - No local runtime detected
   - System is in guide mode (uses fallback)
   - Start a local runtime to enable local mode

3. Inference doesn't work?
   - Make sure a model is selected
   - Check browser console for network errors
   - Verify provider node is actually running

4. Earnings not updating?
   - Refresh the page
   - Earnings update every 30 seconds
   - Check that inference completed successfully
*/
