import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";
test("public shell is not a trading or research engine",async()=>{
 const response=await worker.fetch(new Request("https://example.com/health"),{});
 assert.equal(response.status,200);
 const data=await response.json();
 assert.equal(data.live_trading,false);
 assert.equal(data.retraining,false);
 assert.equal(data.data_collection,false);
 assert.equal(data.strategy_discovery,false);
});
test("no accidental public dashboard",async()=>{
 const response=await worker.fetch(new Request("https://example.com/"),{});
 assert.equal(response.status,404);
});
