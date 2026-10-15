-- Dedicated research database only. Never apply to the existing paper database.
CREATE TABLE IF NOT EXISTS research_candles (
 symbol TEXT NOT NULL CHECK(symbol IN ('BTCUSDT','ETHUSDT')),open_time INTEGER NOT NULL CHECK(open_time%1800000=0),
 open REAL NOT NULL CHECK(open>0),high REAL NOT NULL,low REAL NOT NULL CHECK(low>0),close REAL NOT NULL CHECK(close>0),
 volume REAL NOT NULL CHECK(volume>=0),source TEXT NOT NULL,PRIMARY KEY(symbol,open_time),
 CHECK(high>=open AND high>=close AND high>=low AND low<=open AND low<=close));
CREATE TRIGGER IF NOT EXISTS research_candle_conflict BEFORE INSERT ON research_candles
WHEN EXISTS(SELECT 1 FROM research_candles WHERE symbol=NEW.symbol AND open_time=NEW.open_time
 AND (open!=NEW.open OR high!=NEW.high OR low!=NEW.low OR close!=NEW.close OR volume!=NEW.volume))
BEGIN SELECT RAISE(ABORT,'historical_candle_conflict'); END;
CREATE TABLE IF NOT EXISTS research_jobs (
 kind TEXT NOT NULL CHECK(kind IN ('collect','daily','weekly')),slot INTEGER NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('running','done','error')),attempt INTEGER NOT NULL,
 owner TEXT NOT NULL,lease_until INTEGER NOT NULL,error_code TEXT,PRIMARY KEY(kind,slot));
CREATE TABLE IF NOT EXISTS research_reports (
 kind TEXT NOT NULL CHECK(kind IN ('collect','daily','weekly')),slot INTEGER NOT NULL,payload_json TEXT NOT NULL,PRIMARY KEY(kind,slot));
