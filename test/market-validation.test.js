import test from "node:test";
import assert from "node:assert/strict";
import {INTERVAL_MS,validateCandles,latestCompletedOpen} from "../src/market-validation.js";
const start=1800000000000;
const candle=(t)=>[t,"100","102","99","101","1",t+INTERVAL_MS-1];
test("accepts completed contiguous candles",()=>{
 const rows=[candle(start),candle(start+INTERVAL_MS)];
 assert.equal(validateCandles(rows,start+3*INTERVAL_MS).length,2);
});
test("rejects gaps",()=>assert.throws(()=>validateCandles([candle(start),candle(start+2*INTERVAL_MS)],start+4*INTERVAL_MS)));
test("rejects incomplete candles",()=>assert.throws(()=>validateCandles([candle(start)],start+INTERVAL_MS-1)));
test("rejects NaN, Infinity and impossible prices",()=>{
 for(const bad of ["NaN","Infinity","0"]) {
  const row=candle(start);row[3]=bad;
  assert.throws(()=>validateCandles([row],start+2*INTERVAL_MS));
 }
});
test("latest completed candle is aligned",()=>{
 assert.equal(latestCompletedOpen(start+INTERVAL_MS+1234),start);
});
