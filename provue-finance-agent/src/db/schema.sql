DROP TABLE IF EXISTS fund_nav;
DROP TABLE IF EXISTS holdings;
DROP TABLE IF EXISTS funds;
DROP TABLE IF EXISTS transactions;

CREATE TABLE transactions (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    merchant TEXT NOT NULL,
    merchant_normalized TEXT,
    category TEXT,
    amount NUMERIC(12,2) NOT NULL,
    currency TEXT,
    memo TEXT
);

CREATE TABLE funds (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT
);

CREATE TABLE fund_nav (
    fund_id TEXT REFERENCES funds(id),
    nav_date DATE NOT NULL,
    nav NUMERIC(10,4) NOT NULL,
    PRIMARY KEY(fund_id, nav_date)
);

CREATE TABLE holdings (
    fund_id TEXT REFERENCES funds(id),
    fund_name TEXT,
    units NUMERIC(12,4),
    purchase_date DATE,
    purchase_nav NUMERIC(10,4)
);

CREATE INDEX idx_txn_date ON transactions(date);
CREATE INDEX idx_txn_category ON transactions(category);
CREATE INDEX idx_txn_merchant ON transactions(merchant_normalized);
CREATE INDEX idx_nav_fund_date ON fund_nav(fund_id, nav_date);