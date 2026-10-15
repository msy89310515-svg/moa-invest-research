// Only aggregate results may cross the private engine boundary.
export function safeReport(input,kind){
 if(!input||input.kind!==kind||input.production_approved!==false)throw Error('INVALID_ENGINE_CONTRACT');
 if(!['INSUFFICIENT_DATA','RETRAINED','NO_ELIGIBLE_STRATEGY','RESEARCH_ONLY'].includes(input.status))throw Error('INVALID_ENGINE_STATUS');
 const result={kind,status:input.status,production_approved:false,previously_observed:true};
 for(const key of ['window_start','window_end','observations','candidate_count','pass_count']){
  const n=input[key];if(!Number.isSafeInteger(n)||n<0)throw Error('INVALID_ENGINE_METRIC');result[key]=n;
 }
 if(result.window_start>result.window_end||result.pass_count>result.candidate_count)throw Error('INVALID_ENGINE_METRIC');
 if(typeof input.model_version!=='string'||!/^[a-f0-9]{64}$/.test(input.model_version))throw Error('INVALID_MODEL_VERSION');
 result.model_version=input.model_version;
 if(input.backtest!=null){
  const b=input.backtest;if(!Number.isSafeInteger(b.trades)||b.trades<0||!Number.isFinite(b.net_pnl)||!Number.isFinite(b.max_drawdown)||b.max_drawdown<0||b.max_drawdown>1)throw Error('INVALID_BACKTEST');
  result.backtest={trades:b.trades,net_pnl:b.net_pnl,max_drawdown:b.max_drawdown,
   currency:'USDT',scope:'sum_of_independent_folds',drawdown_scope:'worst_within_fold'};
 }
 return result;
}
