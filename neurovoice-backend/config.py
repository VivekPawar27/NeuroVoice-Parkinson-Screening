CREATE TABLE patients (
    id SERIAL PRIMARY KEY,
    filename TEXT,
    risk_score FLOAT,
    risk_level TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);