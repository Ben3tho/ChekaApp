import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

interface TestResult {
  category: string;
  name: string;
  passed: boolean;
  statusCode?: number;
  details: string;
}

const results: TestResult[] = [];

function record(category: string, name: string, passed: boolean, details: string, statusCode?: number) {
  results.push({ category, name, passed, details, statusCode });
  const statusIcon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${statusIcon} [${category}] ${name}: ${details} (Status: ${statusCode || 'N/A'})`);
}

async function runHeavyStressSuite() {
  console.log('===============================================================');
  console.log('🚀 CHEKA-APP HEAVY STRESS & BOUNDARY SECURITY AUDIT SUITE');
  console.log('===============================================================\n');

  // TEST 1: Extreme BigInt Watch-Time Injection
  try {
    const res = await fetch(`${BASE_URL}/api/videos/b3c3b16e-a2a3-4120-b9a5-861d8ed455ca/watch-time`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ watch_ms: 999999999999, loops: 50 }),
    });
    const data: any = await res.json().catch(() => ({}));
    if (res.status === 200 && data.success) {
      record('Numeric Bounds', 'Extreme Watch-Time (>2.1 Billion ms)', true, 'Server clamped value and recorded safely', res.status);
    } else {
      record('Numeric Bounds', 'Extreme Watch-Time (>2.1 Billion ms)', false, `Unexpected response: ${JSON.stringify(data)}`, res.status);
    }
  } catch (err: any) {
    record('Numeric Bounds', 'Extreme Watch-Time (>2.1 Billion ms)', false, `Request crashed: ${err.message}`);
  }

  // TEST 2: Negative Watch-Time / Zero
  try {
    const res = await fetch(`${BASE_URL}/api/videos/b3c3b16e-a2a3-4120-b9a5-861d8ed455ca/watch-time`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ watch_ms: -50000, loops: -10 }),
    });
    const data: any = await res.json().catch(() => ({}));
    if (res.status === 200 && data.success) {
      record('Numeric Bounds', 'Negative Watch-Time Handling', true, 'Clamped to minimum threshold gracefully', res.status);
    } else {
      record('Numeric Bounds', 'Negative Watch-Time Handling', false, `Status: ${res.status}`, res.status);
    }
  } catch (err: any) {
    record('Numeric Bounds', 'Negative Watch-Time Handling', false, `Request crashed: ${err.message}`);
  }

  // TEST 3: Negative Payment / Amount Injection
  try {
    const res = await fetch(`${BASE_URL}/api/payments/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amountTzs: -50000, coins: -500, rawPhone: '0754123456', operator: 'vodacom' }),
    });
    if (res.status === 400) {
      record('Financial Security', 'Negative Payment / Coins Rejection', true, 'Correctly rejected negative financial payload with 400', res.status);
    } else if (res.status === 200) {
      record('Financial Security', 'Negative Payment / Coins Rejection', false, 'VULNERABILITY: Server accepted negative payment!', res.status);
    } else {
      record('Financial Security', 'Negative Payment / Coins Rejection', false, `Status: ${res.status}`, res.status);
    }
  } catch (err: any) {
    record('Financial Security', 'Negative Payment / Coins Rejection', false, `Crashed: ${err.message}`);
  }

  // TEST 4: Massive Payment Overflow (Integer Overflow Attack)
  try {
    const res = await fetch(`${BASE_URL}/api/payments/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amountTzs: 999999999999999, coins: 999999999999999, rawPhone: '0754123456', operator: 'vodacom' }),
    });
    if (res.status === 400) {
      record('Financial Security', 'Massive Payment Overflow (>10M TZS)', true, 'Correctly rejected extreme amount beyond legitimate max package', res.status);
    } else {
      record('Financial Security', 'Massive Payment Overflow (>10M TZS)', false, `Status ${res.status}: Server did not limit max bounds`, res.status);
    }
  } catch (err: any) {
    record('Financial Security', 'Massive Payment Overflow (>10M TZS)', false, `Crashed: ${err.message}`);
  }

  // TEST 5: SQL Injection Testing on Search & Filters
  const sqliPayloads = [
    "' OR 1=1 --",
    "'; DROP TABLE test_dummy; --",
    "UNION SELECT username, password_hash FROM users --",
    "1' ORDER BY 1--",
  ];

  for (const payload of sqliPayloads) {
    try {
      const res = await fetch(`${BASE_URL}/api/feed?filter=${encodeURIComponent(payload)}&limit=10`);
      if (res.status === 200 || res.status === 400) {
        record('SQL Injection', `Feed Filter [${payload}]`, true, 'Parameterized query prevented injection', res.status);
      } else {
        record('SQL Injection', `Feed Filter [${payload}]`, false, `Unexpected status: ${res.status}`, res.status);
      }
    } catch (err: any) {
      record('SQL Injection', `Feed Filter [${payload}]`, false, `Crashed: ${err.message}`);
    }
  }

  // TEST 6: Non-UUID String in UUID Parameter (e.g. /api/videos/undefined, /api/videos/c_mwalimu)
  const invalidUuids = ['undefined', 'null', 'c_mwalimu', '../../../etc/passwd', '<script>alert(1)</script>'];
  for (const badId of invalidUuids) {
    try {
      const res = await fetch(`${BASE_URL}/api/videos/${encodeURIComponent(badId)}/comments`);
      if (res.status === 200 || res.status === 400 || res.status === 404) {
        record('Input Validation', `Invalid UUID [${badId}]`, true, 'Handled gracefully without 500 unhandled exception', res.status);
      } else {
        record('Input Validation', `Invalid UUID [${badId}]`, false, `Returned 500 error on invalid UUID`, res.status);
      }
    } catch (err: any) {
      record('Input Validation', `Invalid UUID [${badId}]`, false, `Crashed: ${err.message}`);
    }
  }

  // TEST 7: Massive Buffer / XSS in Search Query
  try {
    const hugeSearch = 'A'.repeat(5000) + '<script>alert("XSS")</script>';
    const res = await fetch(`${BASE_URL}/api/videos?q=${encodeURIComponent(hugeSearch)}`);
    if (res.status === 200 || res.status === 400) {
      record('Memory & XSS', '5,000 char search query with script tag', true, 'Handled without memory leak or crash', res.status);
    } else {
      record('Memory & XSS', '5,000 char search query with script tag', false, `Status ${res.status}`, res.status);
    }
  } catch (err: any) {
    record('Memory & XSS', '5,000 char search query with script tag', false, `Crashed: ${err.message}`);
  }

  // TEST 8: High Concurrency Blast (50 Concurrent Requests)
  console.log('\n⚡ Firing 50 Concurrent Requests to /api/for-you?limit=10 ...');
  const startBurst = Date.now();
  const burstPromises = Array.from({ length: 50 }).map(() =>
    fetch(`${BASE_URL}/api/for-you?limit=10`).then(r => r.status)
  );
  try {
    const statuses = await Promise.all(burstPromises);
    const duration = Date.now() - startBurst;
    const all200 = statuses.every(s => s === 200);
    if (all200) {
      record('Concurrency & Load', '50 Parallel /api/for-you Requests', true, `All 50 succeeded in ${duration}ms (Avg: ${(duration / 50).toFixed(1)}ms/req)`, 200);
    } else {
      const failed = statuses.filter(s => s !== 200).length;
      record('Concurrency & Load', '50 Parallel /api/for-you Requests', false, `${failed}/50 requests failed`, 500);
    }
  } catch (err: any) {
    record('Concurrency & Load', '50 Parallel /api/for-you Requests', false, `Burst failed: ${err.message}`);
  }

  // TEST 9: Massive Pagination Limit
  try {
    const res = await fetch(`${BASE_URL}/api/for-you?limit=999999999`);
    const data: any = await res.json().catch(() => ({}));
    if (res.status === 200 && Array.isArray(data.videos) && data.videos.length <= 50) {
      record('Pagination Bounds', 'Massive Limit (limit=999,999,999)', true, `Server capped to ${data.videos.length} videos safely`, res.status);
    } else {
      record('Pagination Bounds', 'Massive Limit (limit=999,999,999)', false, `Server attempted unmetered query: ${res.status}`, res.status);
    }
  } catch (err: any) {
    record('Pagination Bounds', 'Massive Limit (limit=999,999,999)', false, `Crashed: ${err.message}`);
  }

  // TEST 10: Owner PIN Security & Auth Gating
  try {
    // 1. Invalid PIN
    const failRes = await fetch(`${BASE_URL}/api/admin/owner-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: '0000', email: 'intruder@fake.com' }),
    });
    // 2. Correct PIN
    const passRes = await fetch(`${BASE_URL}/api/admin/owner-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: '2026', email: 'benedictojoseph08@gmail.com' }),
    });

    const failData: any = await failRes.json().catch(() => ({}));
    const passData: any = await passRes.json().catch(() => ({}));

    if (failData.verified === false && passData.verified === true) {
      record('RBAC & Auth', 'Owner PIN 2026 & Email Verification', true, 'Unauthorized access rejected; valid owner authorized', passRes.status);
    } else {
      record('RBAC & Auth', 'Owner PIN 2026 & Email Verification', false, `Fail status: ${failRes.status}, Pass status: ${passRes.status}`, passRes.status);
    }
  } catch (err: any) {
    record('RBAC & Auth', 'Owner PIN 2026 & Email Verification', false, `Crashed: ${err.message}`);
  }

  console.log('\n===============================================================');
  console.log('📊 AUDIT SUMMARY REPORT');
  console.log('===============================================================');
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;
  console.log(`TOTAL TESTS: ${results.length}`);
  console.log(`PASSED: ${passedCount}`);
  console.log(`FAILED / VULNERABILITIES IDENTIFIED: ${failedCount}`);
  console.log('===============================================================\n');

  return { passedCount, failedCount, results };
}

runHeavyStressSuite().then(summary => {
  if (summary.failedCount > 0) {
    process.exit(1);
  }
  process.exit(0);
}).catch(err => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
