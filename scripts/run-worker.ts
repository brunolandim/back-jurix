/**
 * Script to invoke the notification worker locally.
 *
 * Usage:
 *   npx tsx scripts/run-worker.ts
 *
 * Or via docker-compose:
 *   docker compose --profile worker run --rm worker
 */
import { handler } from '../src/functions/notification-worker';

async function main() {
  console.log('[run-worker] Starting notification worker...');

  const fakeEvent = {
    version: '0',
    id: 'local-dev',
    'detail-type': 'Scheduled Event',
    source: 'local',
    account: '000000000000',
    time: new Date().toISOString(),
    region: 'us-east-1',
    resources: [],
    detail: {},
  } as any;

  const fakeContext = {
    callbackWaitsForEmptyEventLoop: false,
    functionName: 'notification-worker',
    functionVersion: '$LATEST',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:000000000000:function:notification-worker',
    memoryLimitInMB: '128',
    awsRequestId: 'local-dev',
    logGroupName: '/aws/lambda/notification-worker',
    logStreamName: 'local-dev',
    getRemainingTimeInMillis: () => 300000,
    done: () => {},
    fail: () => {},
    succeed: () => {},
  } as any;

  const result = await handler(fakeEvent, fakeContext);
  console.log('[run-worker] Done:', JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error('[run-worker] Error:', err);
  process.exit(1);
});
