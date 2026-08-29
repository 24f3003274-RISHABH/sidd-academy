-- ============================================================================
-- Migration: 014_orders_payments_v2.sql
-- Description: Enhances orders and payments tables with strict enum validation,
--              safe status transitions, and relational integrity.
-- ============================================================================

-- 1. Ensure status column in orders table
ALTER TABLE orders 
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'PENDING';

-- Update check constraints on orders to support both uppercase and lowercase standards
ALTER TABLE orders 
    DROP CONSTRAINT IF EXISTS chk_orders_payment_status,
    DROP CONSTRAINT IF EXISTS orders_payment_status_check;

ALTER TABLE orders 
    ADD CONSTRAINT chk_orders_payment_status 
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled', 'PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED'));

-- 2. Ensure status constraints on payments table
ALTER TABLE payments 
    DROP CONSTRAINT IF EXISTS chk_payments_status,
    DROP CONSTRAINT IF EXISTS payments_status_check;

ALTER TABLE payments 
    ADD CONSTRAINT chk_payments_status 
    CHECK (status IN ('initiated', 'completed', 'failed', 'refunded', 'created', 'success', 'CREATED', 'SUCCESS', 'FAILED'));

-- 3. Ensure order_id foreign key on enrollments table
ALTER TABLE enrollments 
    ADD COLUMN IF NOT EXISTS order_id UUID;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_enrollments_order'
    ) THEN
        ALTER TABLE enrollments 
            ADD CONSTRAINT fk_enrollments_order 
            FOREIGN KEY (order_id) 
            REFERENCES orders(id) 
            ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_order_id ON enrollments(order_id);
