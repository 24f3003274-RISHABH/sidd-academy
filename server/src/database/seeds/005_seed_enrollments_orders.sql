-- ============================================================================
-- Seed: 005_seed_enrollments_orders.sql
-- Description: Seeds student course enrollments, orders, order items, payments,
-- standalone note purchases, and SIDD ACADEMY PRAYAGRAJ promotional banners.
-- ============================================================================

-- 1. Course Enrollments
INSERT INTO enrollments (id, user_id, course_id, enrolled_at, status, progress_percentage)
VALUES 
(
    'e0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000002', -- Priya Sharma
    'c0000000-0000-0000-0000-000000000001', -- Class 12 Chemistry
    CURRENT_TIMESTAMP,
    'active',
    50.00
),
(
    'e0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000002', -- Priya Sharma
    'c0000000-0000-0000-0000-000000000003', -- Class 12 English Grammar
    CURRENT_TIMESTAMP,
    'active',
    100.00
)
ON CONFLICT (id) DO NOTHING;

-- 2. Orders
INSERT INTO orders (id, user_id, total_amount, currency, payment_status, razorpay_order_id, razorpay_payment_id, receipt, notes)
VALUES 
(
    'f0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000002',
    799.00,
    'INR',
    'paid',
    'order_rzp_live_001',
    'pay_sample_123456',
    'rcpt_chem_001',
    'Enrolled in Class 12 Chemistry Masterclass'
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
    'Class 12 Chemistry — Chemical Kinetics & Physical Chemistry Masterclass',
    799.00
)
ON CONFLICT (id) DO NOTHING;

-- 4. Payments
INSERT INTO payments (id, order_id, user_id, amount, currency, gateway, transaction_id, payment_method, status, paid_at)
VALUES 
(
    'f2000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000002',
    799.00,
    'INR',
    'razorpay',
    'pay_sample_123456',
    'upi',
    'completed',
    CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO NOTHING;

-- 5. Note Purchases
INSERT INTO note_purchases (id, user_id, note_id, order_id, price_paid, purchased_at)
VALUES 
(
    'f3000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000002',
    'd0000000-0000-0000-0000-000000000002',
    'f0000000-0000-0000-0000-000000000001',
    49.00,
    CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO NOTHING;

-- 6. Promotional Banners (All 5 Official Batch & Test Series Posters)
INSERT INTO banners (id, title, subtitle, badge, image_url, link_url, button_text, is_active, order_num, bg_color)
VALUES 
(
    'ba000000-0000-0000-0000-000000000001',
    'TARGET BATCH — UP Board • CBSE Board • JEE Mains (100 Days Left)',
    '100 दिन की मेहनत, पूरे साल की पहचान! आज की तैयारी • कल की सफलता — Physics, Chemistry, Mathematics & Biology complete target preparation.',
    '🎯 100 DAYS TARGET BATCH',
    '/posters/target-batch-100-days-banner.jpg',
    '/courses',
    'Join Target Batch',
    true,
    1,
    'from-pink-900/60 to-purple-950/60'
),
(
    'ba000000-0000-0000-0000-000000000002',
    'CLASS 11th SPECIAL BATCH — मात्र 90 दिनों में पूरा सिलेबस (Batch Poster 1)',
    'Physics • Chemistry • Maths • Biology | प्रतिदिन 5 घंटे की क्लास + Sunday Morning Test & Evening Class शहजाद सर और SIDDHANT BHAIYAA के कुशल नेतृत्व में।',
    '⚡ CLASS 11th SPECIAL BATCH',
    '/posters/class-11-special-batch-1.jpg',
    '/courses',
    'Explore Class 11 Batch',
    true,
    2,
    'from-blue-900/60 to-indigo-950/60'
),
(
    'ba000000-0000-0000-0000-000000000003',
    'Chapter-wise TEST Series — Every Saturday & Sunday (Timing 4:00 से 6:00)',
    'Board Exam जैसा अनुभव! Board Pattern Based Test, Detailed Analysis & Performance Improvement at Gali No. 20, Ganga Nagar, Rajapur, Prayagraj.',
    '📝 WEEKEND CHAPTER-WISE TEST',
    '/posters/chapter-wise-weekend-test.jpg',
    '/courses',
    'Join Test Series',
    true,
    3,
    'from-emerald-900/60 to-teal-950/60'
),
(
    'ba000000-0000-0000-0000-000000000004',
    'TARGET BATCH — 100 दिन की मेहनत, पूरे साल की पहचान!',
    'UP Board • CBSE Board • JEE Mains | आज की तैयारी • कल की सफलता — Complete 100-Day Intensive Revision & Practice Batch.',
    '🔥 100 DAYS INTENSIVE',
    '/posters/target-batch-100-days-poster.jpg',
    '/courses',
    'Enroll in Target Batch',
    true,
    4,
    'from-amber-900/60 to-red-950/60'
),
(
    'ba000000-0000-0000-0000-000000000005',
    'SID ACADEMY PRAYAGRAJ — Class 11th Special Batch (90 Days Full Syllabus)',
    'कमजोर छात्रों पर विशेष ध्यान | प्रतिदिन 5 घंटे की क्लास + Sunday Morning Test | पता: गली नं. 20 के पास, गंगा नगर, राजापुर, प्रयागराज।',
    '📚 CLASS 11th 90-DAY BATCH',
    '/posters/class-11-special-batch-2.jpg',
    '/courses',
    'Explore Class 11 Courses',
    true,
    5,
    'from-indigo-900/60 to-slate-950/60'
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    subtitle = EXCLUDED.subtitle,
    badge = EXCLUDED.badge,
    image_url = EXCLUDED.image_url,
    link_url = EXCLUDED.link_url,
    button_text = EXCLUDED.button_text,
    is_active = EXCLUDED.is_active;
