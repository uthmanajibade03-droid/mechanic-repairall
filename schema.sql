-- Run this in your Supabase SQL Editor
-- Dashboard: https://supabase.com/dashboard/project/kvxwjpsunapmutrpgjrp/sql

CREATE TABLE IF NOT EXISTS invoices (
  id                    BIGSERIAL PRIMARY KEY,
  invoice_id            TEXT UNIQUE NOT NULL,
  customer_name         TEXT NOT NULL,
  customer_contact      TEXT,
  vehicle               TEXT,
  services              TEXT NOT NULL,
  total_amount          NUMERIC(10, 2) NOT NULL,
  notes                 TEXT,
  status                TEXT DEFAULT 'pending',
  stripe_payment_intent TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Allow public reads (customers need to load their invoice)
CREATE POLICY "Public can read invoices"
  ON invoices FOR SELECT
  USING (true);

-- Allow public inserts (mechanic creates from frontend)
CREATE POLICY "Public can insert invoices"
  ON invoices FOR INSERT
  WITH CHECK (true);

-- Allow public updates (mark as paid)
CREATE POLICY "Public can update invoices"
  ON invoices FOR UPDATE
  USING (true);

-- Index for fast lookups by invoice_id
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_id ON invoices(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);
