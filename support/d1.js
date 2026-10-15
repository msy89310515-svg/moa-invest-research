// Real SQLite backing for local D1 contract tests; not a Cloudflare runtime emulator.
import {DatabaseSync} from 'node:sqlite';
export function database(sql){
 const raw=new DatabaseSync(':memory:');raw.exec(sql);
 function prepare(text,args=[]){return {bind(...v){return prepare(text,v);},
  async first(){return raw.prepare(text).get(...args)??null;},
  async all(){return {success:true,results:raw.prepare(text).all(...args)};},
  async run(){const r=raw.prepare(text).run(...args);return {success:true,meta:{changes:Number(r.changes)}};}};}
 return {raw,prepare,async batch(statements){raw.exec('BEGIN IMMEDIATE');try{const out=[];for(const s of statements)out.push(await s.run());raw.exec('COMMIT');return out;}catch(e){raw.exec('ROLLBACK');throw e;}}};
}
