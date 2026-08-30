import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  EON_TEAM_WALLET,
  GENESIS_NFTS,
  getAllGenesisItems
} from '../../assets/js/utils/genesis-collection.js';
import {
  getUtilityNftRule,
  requiresPermanentBundle
} from '../../assets/js/utils/nft-utility-catalog.js';

describe('EON Team collection strategy', () => {
  it('uses the configured official team wallet', () => {
    assert.equal(EON_TEAM_WALLET, '0xf0DbE1026a4CbfD00bad66163Db6f30C62197862');
  });

  it('includes open-edition utility products for core app surfaces', () => {
    const openUtilityItems = GENESIS_NFTS.filter((item) => item.limited === false && /utility/i.test(String(item.category || '')));
    const ids = new Set(openUtilityItems.map((item) => item.id));
    assert.ok(ids.has('genesis-eon-builder-forge-open-pass'));
    assert.ok(ids.has('genesis-eon-operator-nexus-open-pass'));
    assert.ok(ids.has('genesis-eon-realm-architect-open-pass'));
    assert.ok(ids.has('genesis-eon-signal-atlas-open-pass'));
    assert.ok(ids.has('genesis-eon-compute-forge-open-pass'));
    assert.ok(ids.has('genesis-eon-workflow-loom-open-pass'));
    assert.ok(ids.has('genesis-eon-dataset-vault-open-pass'));
  });

  it('keeps utility unlock metadata available in the flattened catalog', () => {
    const items = getAllGenesisItems();
    const datasetVault = items.find((item) => item.id === 'genesis-eon-dataset-vault-open-pass');
    assert.ok(datasetVault);
    assert.deepEqual(datasetVault.utilityUnlocks, ['Dataset manifests', 'Export bundles', 'Provenance-ready archives']);
  });
});

describe('utility rule coverage', () => {
  it('covers collection types used by the EON Team utility collection', () => {
    const signal = getUtilityNftRule('signal');
    const realmlord = getUtilityNftRule('realmlord');
    const land = getUtilityNftRule('land');

    assert.equal(signal.utilityClass, 'signal');
    assert.equal(realmlord.utilityClass, 'realmlord');
    assert.equal(land.utilityClass, 'realm-deed');
    assert.equal(requiresPermanentBundle('signal'), true);
    assert.equal(requiresPermanentBundle('realmlord'), true);
    assert.equal(requiresPermanentBundle('land'), true);
  });
});
