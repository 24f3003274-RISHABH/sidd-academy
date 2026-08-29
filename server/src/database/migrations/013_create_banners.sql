-- ============================================================================
-- Migration: 013_create_banners.sql
-- Description: Creates the 'banners' table for hero and promotional carousels.
-- ============================================================================

CREATE TABLE IF NOT EXISTS banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    subtitle TEXT,
    badge VARCHAR(50) DEFAULT 'Featured',
    image_url TEXT,
    link_url VARCHAR(255) DEFAULT '/courses',
    button_text VARCHAR(50) DEFAULT 'Explore Now',
    is_active BOOLEAN NOT NULL DEFAULT true,
    order_num INTEGER NOT NULL DEFAULT 0,
    bg_color VARCHAR(50) DEFAULT 'from-indigo-900 to-purple-900',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_banners_is_active ON banners(is_active);
CREATE INDEX IF NOT EXISTS idx_banners_order_num ON banners(order_num);
