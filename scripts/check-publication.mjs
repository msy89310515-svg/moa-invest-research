import {execFileSync} from 'node:child_process';
const allowed=new Set(['README.md','package.json','wrangler.toml','wrangler.research.example.toml',
 'migrations/0001_research.sql','src/index.js','src/auth.js','src/collection.js','src/contract.js',
 'src/dashboard.js','src/market-validation.js','src/scheduler.js','src/storage.js','support/d1.js',
 'test/worker.test.js','test/market-validation.test.js','test/integration.test.js',
 'scripts/check-publication.mjs','docs/INTEGRATION.md','docs/VERIFICATION.json']);
const patterns={
 private_key:/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
 github_token:/\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{30,})/,
 aws_key:/\bAKIA[0-9A-Z]{16}\b/,
 credential_literal:/(?:DASHBOARD_PASSWORD|CLOUDFLARE_API_TOKEN|api_key|client_secret)["']?\s*[:=]\s*["'][A-Za-z0-9_+/.=-]{20,}["']/i
};
const names=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean),findings=[];
for(const file of names){
 if(!allowed.has(file)){findings.push({file,rule:'not_in_public_allowlist'});continue;}
 const text=execFileSync('git',['show',':'+file],{encoding:'utf8'});
 for(const [rule,pattern] of Object.entries(patterns))if(pattern.test(text))findings.push({file,rule});
}
// No matched values are ever printed.
console.log(JSON.stringify({files:names.length,findings,status:findings.length?'BLOCKED':'PASSED'},null,2));
if(findings.length)process.exitCode=2;
