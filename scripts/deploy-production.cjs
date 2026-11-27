const { execFile } = require('node:child_process');
const { setTimeout: sleep } = require('node:timers/promises');
const { promisify } = require('node:util');
const { verify } = require('./verify-deployment.cjs');

const exec = promisify(execFile);

async function getOriginMain() {
  const { stdout } = await exec('git', ['ls-remote', '--exit-code', 'origin', 'refs/heads/main'], {
    timeout: 15000
  });
  return stdout.trim().split('\t')[0];
}

function httpsUrl(value, name) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(name + ' must be a valid HTTPS URL.');
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.hash) {
    throw new Error(name + ' must be an HTTPS URL without credentials or a fragment.');
  }
  return url;
}

async function deployProduction({
  sha, hookUrl, productionUrl, readMain = getOriginMain, request = fetch,
  verificationMs = 8 * 60 * 1000, retryMs = 10000
}) {
  if (!/^[a-f0-9]{40}$/.test(sha)) {
    throw new Error('A full validated Git SHA is required.');
  }

  const target = httpsUrl(productionUrl, 'RENDER_PROD_URL');
  if (target.pathname !== '/' || target.search) {
    throw new Error('RENDER_PROD_URL must be the origin of the production application.');
  }
  const hook = httpsUrl(hookUrl, 'RENDER_PROD_HOOK');
  hook.searchParams.set('ref', sha);

  let mainSha;
  try {
    mainSha = await readMain();
  } catch {
    throw new Error('Could not verify the current origin/main. Deployment was not requested.');
  }
  if (mainSha !== sha) {
    throw new Error('origin/main no longer matches the validated SHA. Deployment was not requested.');
  }

  let response;
  try {
    response = await request(hook, {
      method: 'POST',
      redirect: 'error',
      signal: AbortSignal.timeout(30000)
    });
  } catch {
    throw new Error('Render hook request failed or timed out. Check Render before retrying.');
  }
  if (response.body) {
    await response.body.cancel().catch(() => {});
  }
  if (response.status === 202) {
    throw new Error('Render queued the deployment without confirming it started. Check Render before retrying.');
  }
  if (response.status !== 200) {
    throw new Error('Render hook returned HTTP ' + response.status + '.');
  }

  console.log('Render accepted the request for ' + sha + '. Waiting for production verification.');
  const deadline = AbortSignal.timeout(verificationMs);
  while (!deadline.aborted) {
    try {
      await verify(target, {
        requireDatabase: true,
        expectedCommit: sha,
        request: (url, options) => request(url, {
          redirect: 'error',
          cache: 'no-store',
          signal: AbortSignal.any([options.signal, deadline])
        })
      });
      deadline.throwIfAborted();
      console.log('Production verified at ' + sha + '.');
      return;
    } catch {
      if (!deadline.aborted) {
        console.log('Production smoke test has not passed for the expected SHA. Retrying.');
        await sleep(retryMs, undefined, { signal: deadline }).catch(() => {});
      }
    }
  }

  throw new Error('Timed out verifying React, API, MongoDB and the expected SHA in production.');
}

if (require.main === module) {
  deployProduction({
    sha: process.env.GITHUB_SHA,
    hookUrl: process.env.RENDER_PROD_HOOK,
    productionUrl: process.env.RENDER_PROD_URL
  }).catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { deployProduction };
