import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";
test("health discloses no private research or automatic adoption",async()=>{
 const response=await worker.fetch(new Request("https://example.com/health"),{});
 assert.equal(response.status,200);
 const data=await response.json();
 assert.equal(data.live_trading,false);
 assert.equal(data.automatic_adoption,false);
 assert.equal(data.state,'INTEGRATION_STAGED');
});
test("no accidental public dashboard",async()=>{
 const response=await worker.fetch(new Request("https://example.com/"),{});
 assert.equal(response.status,503);
});
