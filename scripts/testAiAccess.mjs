import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const originalDirectory = process.cwd();
const testDirectory = await mkdtemp(path.join(os.tmpdir(), 'hpg-ai-access-'));

try {
  process.chdir(testDirectory);
  process.env.AI_ACCESS_STORAGE = 'local';
  process.env.STRIPE_DONATION_URL = 'https://buy.stripe.com/test';

  const {
    consumeAiCredit,
    grantSupporterCredits,
    loadAiAccessRecord,
    publicAiAccessStatus,
  } = await import('../api/_lib/aiAccess.js');
  const { verifyStripeSignature } = await import('../api/stripe-webhook.js');

  const visitorId = randomUUID();
  const initial = publicAiAccessStatus(await loadAiAccessRecord(visitorId));
  assert.equal(initial.freeBiographyRunsRemaining, 5);
  assert.equal(initial.canUseBiography, true);
  assert.equal(initial.canUseSchema, false);
  assert.match(initial.donateUrl, new RegExp(`client_reference_id=${visitorId}`));

  for (let run = 1; run <= 5; run += 1) {
    const result = await consumeAiCredit(visitorId, 'generate_sketch');
    assert.equal(result.allowed, true);
    assert.equal(result.access.freeBiographyRunsUsed, run);
  }
  const denied = await consumeAiCredit(visitorId, 'generate_sketch');
  assert.equal(denied.allowed, false);
  assert.equal(denied.access.freeBiographyRunsRemaining, 0);

  const now = Date.UTC(2026, 6, 29);
  const grant = await grantSupporterCredits(visitorId, 'cs_test_supporter', now);
  assert.equal(grant.granted, true);
  assert.equal(publicAiAccessStatus(grant.record, now).supporterCredits, 50);
  const duplicate = await grantSupporterCredits(visitorId, 'cs_test_supporter', now);
  assert.equal(duplicate.granted, false);

  const schema = await consumeAiCredit(visitorId, 'generate_annotation', now);
  assert.equal(schema.allowed, true);
  assert.equal(schema.access.supporterCredits, 44);
  assert.equal(schema.access.canUseSchema, true);

  const secret = 'whsec_test';
  const timestamp = Math.floor(Date.now() / 1000);
  const body = Buffer.from('{"type":"checkout.session.completed"}');
  const signature = createHmac('sha256', secret)
    .update(`${timestamp}.${body.toString('utf8')}`)
    .digest('hex');
  assert.equal(
    verifyStripeSignature(body, `t=${timestamp},v1=${signature}`, secret, timestamp),
    true
  );
  assert.equal(
    verifyStripeSignature(body, `t=${timestamp},v1=${'0'.repeat(64)}`, secret, timestamp),
    false
  );

  console.log('AI access tests passed.');
} finally {
  process.chdir(originalDirectory);
  await rm(testDirectory, { recursive: true, force: true });
}
