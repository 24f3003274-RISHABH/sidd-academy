-- ============================================================================
-- Seed: 003_seed_curriculum.sql
-- Description: Seeds subjects, chapters, lessons, and verified YouTube videos/playlists
-- from SIDD ACADEMY PRAYAGRAJ (@Sidacademyprayagraj).
-- ============================================================================

-- 1. Subjects
INSERT INTO subjects (id, course_id, title, description, icon, order_num)
VALUES 
(
    'b0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'Class 12 Chemistry (रासायनिक बलगतिकी)',
    'Chemical Kinetics, Rate Law, Order of Reaction & Board Numericals.',
    '🧪',
    1
),
(
    'b0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000002',
    'Class 12 Biology (पुष्पी पादपों में लैंगिक जनन)',
    'Sexual Reproduction in Flowering Plants by आकाश सर.',
    '🌸',
    1
),
(
    'b0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000003',
    'English Grammar & Conversation (आकाश सर)',
    'Spoken English & Board Exam Grammar Rules.',
    '✍️',
    1
),
(
    'b0000000-0000-0000-0000-000000000004',
    'c0000000-0000-0000-0000-000000000004',
    'SID Academy Regular Batch Orientation & Physics',
    'Regular Batch Launch, Ray Optics & Electrostatics.',
    '💥',
    1
),
(
    'b0000000-0000-0000-0000-000000000005',
    'c0000000-0000-0000-0000-000000000005',
    'Mathematics',
    'Basic Mathematics Foundation & Board Exam Preparation by Siddhant Bhaiya.',
    '📐',
    1
),
(
    'b0000000-0000-0000-0000-000000000006',
    'c0000000-0000-0000-0000-000000000005',
    'Science (Physics, Chem, Bio)',
    'Electric Current (वैद्युत धारा) & Board Science Concepts.',
    '🔬',
    2
)
ON CONFLICT (id) DO UPDATE SET
    course_id = EXCLUDED.course_id,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    order_num = EXCLUDED.order_num;

-- 2. Chapters
INSERT INTO chapters (id, subject_id, title, description, order_num)
VALUES 
(
    'c1000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Chapter: Chemical Kinetics (रासायनिक बलगतिकी)',
    'Factors affecting rate of reaction, rate constant & numerical practice.',
    1
),
(
    'c1000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000002',
    'Chapter: Sexual Reproduction in Flowering Plants (पुष्पी पादपो में लैंगिक जनन)',
    'Flower morphology, microsporogenesis, embryo sac & double fertilization.',
    1
),
(
    'c1000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000003',
    'Chapter: English Conversation & Grammar (Use of To और With)',
    'Conversational English & Board Grammar prepositions.',
    1
),
(
    'c1000000-0000-0000-0000-000000000004',
    'b0000000-0000-0000-0000-000000000004',
    'Session: Regular Class Start & Foundation Orientation',
    '20 August Regular Batch Launch & Mentorship Orientation.',
    1
),
(
    'c1000000-0000-0000-0000-000000000005',
    'b0000000-0000-0000-0000-000000000005',
    'Chapter 1: Real Numbers, Basic Maths & Polynomials',
    'Foundational mathematics concepts & board problem solving.',
    1
),
(
    'c1000000-0000-0000-0000-000000000006',
    'b0000000-0000-0000-0000-000000000006',
    'Chapter 1: Electric Current & Chemical Equations',
    'Electric Current (वैद्युत धारा) & Science fundamentals.',
    1
)
ON CONFLICT (id) DO UPDATE SET
    subject_id = EXCLUDED.subject_id,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    order_num = EXCLUDED.order_num;

-- 3. Lessons (Daily Classes)
INSERT INTO lessons (id, chapter_id, title, description, class_number, class_date, duration, is_free, is_protected, order_num)
VALUES 
(
    'de000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000001',
    'LEC 06 chemical kinetics FACTOR AFFECTING RATE OF RXN #iit #jee #hindi #upboard #biharboard #mpboard',
    'सबसे आसान भाषा में समझें - Effect of Temperature, Concentration, Catalyst, and Surface Area on Reaction Rate. Faculty: SIDD ACADEMY PRAYAGRAJ (@Sidacademyprayagraj).',
    1,
    CURRENT_DATE,
    '33:32',
    true,
    false,
    1
),
(
    'de000000-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000001',
    'Chemical kinetics LEC 05 question ❓ #chemistry #class12 #neet #jee #upboard #mpboard #biharboard',
    'ज़रूर देखे Basic to advance - Complete numerical problem solving on Integrated Rate Law, Order of Reaction, and Half Life.',
    2,
    CURRENT_DATE,
    '29:58',
    true,
    false,
    2
),
(
    'de000000-0000-0000-0000-000000000003',
    'c1000000-0000-0000-0000-000000000002',
    'LEC 02 पुष्पी पादपो में लैंगिक जनन by आकाश सर #upboard #mpboard #biharboard #boardexam #biology',
    'Sexual Reproduction in Flowering Plants (Basic to Advance) - Embryo sac structure, microsporogenesis, and pollination mechanisms by आकाश सर.',
    1,
    CURRENT_DATE,
    '25:03',
    true,
    false,
    1
),
(
    'de000000-0000-0000-0000-000000000004',
    'c1000000-0000-0000-0000-000000000002',
    'LEC 01 पुष्पी पादपो में लैंगिक जनन #flowers #biology #basic #class12 #upboard #mpboard #biharboard',
    'Introduction to Flower morphology, reproductive organs, and anther wall layers by आकाश सर.',
    2,
    CURRENT_DATE,
    '14:32',
    false,
    true,
    2
),
(
    'de000000-0000-0000-0000-000000000005',
    'c1000000-0000-0000-0000-000000000003',
    'conversation use of to और With by आकाश सर #english #englishgrammar #class12 #upboard #boardexam',
    'Interactive conversation class: When to use "to" and when to use "with" in spoken English and board exam grammar questions.',
    1,
    CURRENT_DATE,
    '7:03',
    true,
    false,
    1
),
(
    'de000000-0000-0000-0000-000000000006',
    'c1000000-0000-0000-0000-000000000004',
    'जो वादा किया उससे निभाना पड़ेगा SID ACADEMY PRAYAGRAJ 💥 जहां आपकी सफलता हमारी जिम्मेदारी 🤩#study',
    '20 AUGUST नई शुरुआत — REGULAR CLASS START & Introduction Class by Siddhant Pandey & Faculty Team.',
    1,
    CURRENT_DATE,
    '23:29',
    true,
    false,
    1
),
(
    'de000000-0000-0000-0000-000000000007',
    'c1000000-0000-0000-0000-000000000005',
    'Maths से डरना क्यों सिद्धांत भैया है ना एकदम बेसिक से पढ़े #basic #maths #math #mathmatics #siddhnat',
    'Basic Mathematics foundation lecture with step-by-step concepts and board exam tricks by Siddhant Bhaiya.',
    1,
    CURRENT_DATE,
    '35:12',
    true,
    false,
    1
),
(
    'de000000-0000-0000-0000-000000000008',
    'c1000000-0000-0000-0000-000000000005',
    'अब डरना बिल्कुल भी नहीं है SID ACADEMY PRAYAGRAJ 💥 है आपके सपनों के साथ 🙅🙅🇮🇳#basicmaths #basic #life',
    'Complete Basic Maths problem-solving and foundational concepts by SIDD ACADEMY PRAYAGRAJ.',
    2,
    CURRENT_DATE,
    '38:57',
    false,
    true,
    2
),
(
    'de000000-0000-0000-0000-000000000009',
    'c1000000-0000-0000-0000-000000000006',
    'CURRENT ELECTRICITY 🔌 #current #elctronics #वैद्युत #dhara #class10 #class12 #upboard #biharboard',
    'Complete Electric Current (वैद्युत धारा) lecture for Class 10 & Class 12 UP Board and Bihar Board.',
    1,
    CURRENT_DATE,
    '31:45',
    true,
    false,
    1
)
ON CONFLICT (id) DO UPDATE SET
    chapter_id = EXCLUDED.chapter_id,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    duration = EXCLUDED.duration,
    is_free = EXCLUDED.is_free,
    order_num = EXCLUDED.order_num;

-- 4. Videos (Verified YouTube Video & Playlist Links from @Sidacademyprayagraj)
INSERT INTO videos (id, lesson_id, title, video_url, youtube_id, playlist_url, thumbnail_url, duration_seconds, video_provider, quality, order_num)
VALUES 
(
    'f0000000-0000-0000-0000-000000000001',
    'de000000-0000-0000-0000-000000000001',
    'LEC 06 chemical kinetics FACTOR AFFECTING RATE OF RXN #iit #jee #hindi #upboard #biharboard #mpboard',
    'https://www.youtube.com/watch?v=-StdzdYReuo',
    '-StdzdYReuo',
    'https://www.youtube.com/playlist?list=PLKsilHHi-1ZQ',
    'https://img.youtube.com/vi/-StdzdYReuo/hqdefault.jpg',
    2012,
    'youtube',
    '1080p',
    1
),
(
    'f0000000-0000-0000-0000-000000000002',
    'de000000-0000-0000-0000-000000000002',
    'Chemical kinetics LEC 05 question ❓ #chemistry #class12 #neet #jee #upboard #mpboard #biharboard',
    'https://www.youtube.com/watch?v=Sf6K38m99_4',
    'Sf6K38m99_4',
    'https://www.youtube.com/playlist?list=PLKsilHHi-1ZQ',
    'https://img.youtube.com/vi/Sf6K38m99_4/hqdefault.jpg',
    1798,
    'youtube',
    '1080p',
    2
),
(
    'f0000000-0000-0000-0000-000000000003',
    'de000000-0000-0000-0000-000000000003',
    'LEC 02 पुष्पी पादपो में लैंगिक जनन by आकाश सर #upboard #mpboard #biharboard #boardexam #biology',
    'https://www.youtube.com/watch?v=zoi9_ip5Jus',
    'zoi9_ip5Jus',
    'https://www.youtube.com/playlist?list=PLRntVCXiEo8E',
    'https://img.youtube.com/vi/zoi9_ip5Jus/hqdefault.jpg',
    1503,
    'youtube',
    '1080p',
    1
),
(
    'f0000000-0000-0000-0000-000000000004',
    'de000000-0000-0000-0000-000000000004',
    'LEC 01 पुष्पी पादपो में लैंगिक जनन #flowers #biology #basic #class12 #upboard #mpboard #biharboard',
    'https://www.youtube.com/watch?v=8gYSV8jLw_U',
    '8gYSV8jLw_U',
    'https://www.youtube.com/playlist?list=PLRntVCXiEo8E',
    'https://img.youtube.com/vi/8gYSV8jLw_U/hqdefault.jpg',
    872,
    'youtube',
    '1080p',
    2
),
(
    'f0000000-0000-0000-0000-000000000005',
    'de000000-0000-0000-0000-000000000005',
    'conversation use of to और With by आकाश सर #english #englishgrammar #class12 #upboard #boardexam',
    'https://www.youtube.com/watch?v=ocg3NdWP19I',
    'ocg3NdWP19I',
    'https://www.youtube.com/playlist?list=PLfmTzfjwpnzg',
    'https://img.youtube.com/vi/ocg3NdWP19I/hqdefault.jpg',
    423,
    'youtube',
    '1080p',
    1
),
(
    'f0000000-0000-0000-0000-000000000006',
    'de000000-0000-0000-0000-000000000006',
    'जो वादा किया उससे निभाना पड़ेगा SID ACADEMY PRAYAGRAJ 💥 जहां आपकी सफलता हमारी जिम्मेदारी 🤩#study',
    'https://www.youtube.com/watch?v=FDSkBBM1YUs',
    'FDSkBBM1YUs',
    'https://www.youtube.com/playlist?list=PLLN2WU1NsA2o',
    'https://img.youtube.com/vi/FDSkBBM1YUs/hqdefault.jpg',
    1409,
    'youtube',
    '1080p',
    1
),
(
    'f0000000-0000-0000-0000-000000000007',
    'de000000-0000-0000-0000-000000000007',
    'Maths से डरना क्यों सिद्धांत भैया है ना एकदम बेसिक से पढ़े #basic #maths #math #mathmatics #siddhnat',
    'https://www.youtube.com/watch?v=fguW9O663NM',
    'fguW9O663NM',
    'https://www.youtube.com/playlist?list=PLFBdKX91EvMA',
    'https://img.youtube.com/vi/fguW9O663NM/hqdefault.jpg',
    2112,
    'youtube',
    '1080p',
    1
),
(
    'f0000000-0000-0000-0000-000000000008',
    'de000000-0000-0000-0000-000000000008',
    'अब डरना बिल्कुल भी नहीं है SID ACADEMY PRAYAGRAJ 💥 है आपके सपनों के साथ 🙅🙅🇮🇳#basicmaths #basic #life',
    'https://www.youtube.com/watch?v=-Kmxdz8BUb4',
    '-Kmxdz8BUb4',
    'https://www.youtube.com/playlist?list=PLFBdKX91EvMA',
    'https://img.youtube.com/vi/-Kmxdz8BUb4/hqdefault.jpg',
    2337,
    'youtube',
    '1080p',
    2
),
(
    'f0000000-0000-0000-0000-000000000009',
    'de000000-0000-0000-0000-000000000009',
    'CURRENT ELECTRICITY 🔌 #current #elctronics #वैद्युत #dhara #class10 #class12 #upboard #biharboard',
    'https://www.youtube.com/watch?v=iOi6olyefpE',
    'iOi6olyefpE',
    'https://www.youtube.com/playlist?list=PLMAR6dVeMATU',
    'https://img.youtube.com/vi/iOi6olyefpE/hqdefault.jpg',
    1905,
    'youtube',
    '1080p',
    1
)
ON CONFLICT (id) DO UPDATE SET
    lesson_id = EXCLUDED.lesson_id,
    title = EXCLUDED.title,
    video_url = EXCLUDED.video_url,
    youtube_id = EXCLUDED.youtube_id,
    playlist_url = EXCLUDED.playlist_url,
    thumbnail_url = EXCLUDED.thumbnail_url,
    duration_seconds = EXCLUDED.duration_seconds;
