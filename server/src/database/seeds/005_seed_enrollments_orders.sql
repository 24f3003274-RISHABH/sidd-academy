-- ============================================================================
-- Seed: 005_seed_enrollments_orders.sql
-- Description: Seeds student course enrollments, orders, order items, payments,
-- standalone note purchases, and promotional banners.
-- ============================================================================

-- 1. Course Enrollments
INSERT INTO enrollments (id, user_id, course_id, enrolled_at, status, progress_percentage)
VALUES 
(
    'e0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000002', -- Priya Sharma
    'c0000000-0000-0000-0000-000000000001', -- PERN Course
    CURRENT_TIMESTAMP,
    'active',
    35.50
),
(
    'e0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000003', -- Aman Gupta
    'c0000000-0000-0000-0000-000000000001', -- PERN Course
    CURRENT_TIMESTAMP,
    'active',
    15.00
)
ON CONFLICT (id) DO NOTHING;

-- 2. Orders
INSERT INTO orders (id, user_id, total_amount, currency, payment_status, razorpay_order_id, razorpay_payment_id, receipt, notes)
VALUES 
(
    'f0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000002',
    1499.00,
    'INR',
    'paid',
    'order_rzp_live_001',
    'pay_rzp_live_901',
    'rcpt_pern_001',
    'Enrolled in PERN Stack course'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Order Items
INSERT INTO order_items (id, order_id, item_type, item_id, title, price)
VALUES 
(
    'f1000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000001',
    'course',
    'c0000000-0000-0000-0000-000000000001',
    'Full Stack Web Development (PERN Stack)',
    1499.00
)
ON CONFLICT (id) DO NOTHING;

-- 4. Payments
INSERT INTO payments (id, order_id, user_id, amount, currency, gateway, transaction_id, payment_method, status, paid_at)
VALUES 
(
    'f2000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000002',
    1499.00,
    'INR',
    'razorpay',
    'txn_rzp_pay_901',
    'upi',
    'completed',
    CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO NOTHING;

-- 5. Note Purchases (Priya purchased Note 2)
INSERT INTO note_purchases (id, user_id, note_id, order_id, price_paid, purchased_at)
VALUES 
(
    'f3000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000002',
    'd0000000-0000-0000-0000-000000000002',
    'f0000000-0000-0000-0000-000000000001',
    199.00,
    CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO NOTHING;

-- 6. Promotional Banners
INSERT INTO banners (id, title, subtitle, badge, image_url, link_url, button_text, is_active, order_num, bg_color)
VALUES 
(
    'ba000000-0000-0000-0000-000000000001',
    'Crack Top Tech Interviews with Sidd Academy',
    'Live interactive batch starting next Monday with personal mentorship & code reviews.',
    'Admissions Open',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200',
    '/courses',
    'Enroll Today',
    true,
    1,
    'from-pink-900/60 to-purple-950/60'
),
(
    'ba000000-0000-0000-0000-000000000002',
    'Download 100+ Free Hand-Written Lecture Notes',
    'Curated by top-tier educators covering Data Structures, Web Development, and DBMS.',
    'Free Resources',
    'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200',
    '/notes',
    'Access Library',
    true,
    2,
    'from-blue-900/60 to-indigo-950/60'
)
ON CONFLICT (id) DO NOTHING;
