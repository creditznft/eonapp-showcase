import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { applyReferralMigrations } from '../helpers/eon-d1-test-migrations.mjs';
import { createSignedShareLink } from '../../assets/js/utils/signed-share-link.js';
import { signSharePayload } from '../../assets/js/utils/share-link-identity.js';
import { bindReferralIdentity, enrollReferral, qualifyReferralActivation, readReferralAccountStatus, recordReferralQualificationReceipt, requestReferralBindChallenge } from '../../assets/js/referrals/eon-referral-server-runtime.js';
import { classifyReferralSignal } from '../../assets/js/referrals/eon-referral-program-w629.js';
class S { constructor(db,sql,args=[]){this.db=db;this.sql=sql;this.args=args;} bind(...args){return new S(this.db,this.sql,args);} run(){return this.db.prepare(this.sql).run(...this.args);} first(){return this.db.prepare(this.sql).get(...this.args)||null;} all(){return {results:this.db.prepare(this.sql).all(...this.args)}} }
function makeD1(){const sqlite=new DatabaseSync(':memory:');applyReferralMigrations(sqlite);return{sqlite,prepare(sql){return new S(sqlite,sql)},async batch(rows){sqlite.exec('BEGIN');try{const out=rows.map((r)=>r.run());sqlite.exec('COMMIT');return out}catch(e){sqlite.exec('ROLLBACK');throw e}}}}
async function bind(db, account, invite){const c=await requestReferralBindChallenge({database:db,accountId:account,token:invite.token,timestamp:1});const signature=await signSharePayload(c.canonical);return bindReferralIdentity({database:db,accountId:account,token:invite.token,challengeId:c.challengeId,challenge:c.challenge,signature,timestamp:2});}
test('W629B click/share never qualifies and a server milestone receipt is single-use', async () => {
  assert.equal(classifyReferralSignal('share').qualifies, false);
  assert.equal(classifyReferralSignal('first_project_saved').qualifies, true);
  const db=makeD1(); const invite=await createSignedShareLink({destination:'/',source:'w629b',missionType:'share_eonapp'}); await bind(db,'inviter',invite); await enrollReferral({database:db,inviteeAccountId:'invitee',token:invite.token,timestamp:3});
  assert.equal((await qualifyReferralActivation({database:db,inviteeAccountId:'invitee',milestone:'first_project_saved',timestamp:4})).status,'server_milestone_receipt_required');
  const receipt=await recordReferralQualificationReceipt({database:db,inviteeAccountId:'invitee',milestone:'first_project_saved',sourceEventId:'project-1',issuer:'owner-proof-fixture',timestamp:5});
  assert.equal((await qualifyReferralActivation({database:db,inviteeAccountId:'invitee',milestone:'first_project_saved',sourceReceiptId:receipt.receiptId,timestamp:6})).status,'signal_key_granted');
  assert.equal((await qualifyReferralActivation({database:db,inviteeAccountId:'invitee',milestone:'first_project_saved',sourceReceiptId:receipt.receiptId,timestamp:7})).status,'server_milestone_receipt_already_consumed');
  const status=await readReferralAccountStatus({database:db,accountId:'inviter',timestamp:8}); assert.equal(status.account.balances.available.signal,1); db.sqlite.close();
});
