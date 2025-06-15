-- =====================================================
-- Prima Facie - Database Seeding Script
-- Run AFTER the main setup script to populate with test data
-- =====================================================

-- Note: This assumes you have already run setup-database-simple.sql
-- and that the default law firm exists

-- =====================================================
-- 1. ADDITIONAL LAW FIRMS (for multi-tenant testing)
-- =====================================================
INSERT INTO law_firms (
    id,
    name,
    legal_name,
    cnpj,
    oab_number,
    email,
    phone,
    website,
    address_street,
    address_number,
    address_neighborhood,
    address_city,
    address_state,
    address_zipcode,
    plan_type,
    subscription_active,
    primary_color,
    secondary_color
) VALUES 
(
    '234e4567-e89b-12d3-a456-426614174001',
    'Silva & Associados',
    'Silva & Associados Sociedade de Advogados',
    '12.345.678/0001-91',
    'OAB/SP 234567',
    'contato@silvaassociados.com.br',
    '(11) 4567-8901',
    'https://silvaassociados.com.br',
    'Avenida Paulista',
    '1578',
    'Bela Vista',
    'São Paulo',
    'SP',
    '01310-200',
    'basic',
    true,
    '#059669',
    '#6B7280'
),
(
    '345e4567-e89b-12d3-a456-426614174002',
    'Costa Advocacia',
    'Costa Advocacia e Consultoria LTDA',
    '23.456.789/0001-92',
    'OAB/RJ 345678',
    'atendimento@costaadvocacia.com.br',
    '(21) 2345-6789',
    'https://costaadvocacia.com.br',
    'Rua da Carioca',
    '42',
    'Centro',
    'Rio de Janeiro',
    'RJ',
    '20050-070',
    'professional',
    true,
    '#7C3AED',
    '#6B7280'
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. SEED USERS FOR TESTING
-- =====================================================

-- Note: These users won't be able to log in until they register through the app
-- because they need corresponding auth.users records
-- But they will appear in the admin panel for testing the interface

INSERT INTO users (
    id,
    auth_user_id,
    law_firm_id,
    email,
    first_name,
    last_name,
    user_type,
    position,
    oab_number,
    phone,
    status,
    last_login_at,
    created_at
) VALUES 
-- Dávila Reis Advocacia users
(
    '111e4567-e89b-12d3-a456-426614174000',
    '11111111-1111-1111-1111-111111111111', -- Dummy auth_user_id
    '123e4567-e89b-12d3-a456-426614174000',
    'robson@davilareisadvocacia.com.br',
    'Robson',
    'Dávila Reis',
    'admin',
    'Sócio Fundador',
    'OAB/SP 123456',
    '(11) 99999-0001',
    'active',
    now() - INTERVAL '2 hours',
    now() - INTERVAL '30 days'
),
(
    '222e4567-e89b-12d3-a456-426614174000',
    '22222222-2222-2222-2222-222222222222',
    '123e4567-e89b-12d3-a456-426614174000',
    'maria.silva@davilareisadvocacia.com.br',
    'Maria',
    'Silva Santos',
    'lawyer',
    'Advogada Sênior',
    'OAB/SP 234567',
    '(11) 99999-0002',
    'active',
    now() - INTERVAL '1 day',
    now() - INTERVAL '25 days'
),
(
    '333e4567-e89b-12d3-a456-426614174000',
    '33333333-3333-3333-3333-333333333333',
    '123e4567-e89b-12d3-a456-426614174000',
    'joao.santos@davilareisadvocacia.com.br',
    'João',
    'Santos Oliveira',
    'lawyer',
    'Advogado Pleno',
    'OAB/SP 345678',
    '(11) 99999-0003',
    'active',
    now() - INTERVAL '3 days',
    now() - INTERVAL '20 days'
),
(
    '444e4567-e89b-12d3-a456-426614174000',
    '44444444-4444-4444-4444-444444444444',
    '123e4567-e89b-12d3-a456-426614174000',
    'fernanda.costa@davilareisadvocacia.com.br',
    'Fernanda',
    'Costa Lima',
    'staff',
    'Assistente Jurídica',
    null,
    '(11) 99999-0004',
    'active',
    now() - INTERVAL '1 week',
    now() - INTERVAL '15 days'
),
(
    '555e4567-e89b-12d3-a456-426614174000',
    '55555555-5555-5555-5555-555555555555',
    '123e4567-e89b-12d3-a456-426614174000',
    'carlos.admin@davilareisadvocacia.com.br',
    'Carlos',
    'Mendes',
    'staff',
    'Assistente Administrativo',
    null,
    '(11) 99999-0005',
    'active',
    null, -- Never logged in
    now() - INTERVAL '10 days'
),
(
    '666e4567-e89b-12d3-a456-426614174000',
    '66666666-6666-6666-6666-666666666666',
    '123e4567-e89b-12d3-a456-426614174000',
    'ana.cliente@empresa.com.br',
    'Ana',
    'Souza Pereira',
    'client',
    'Diretora Jurídica',
    null,
    '(11) 99999-0006',
    'active',
    now() - INTERVAL '2 days',
    now() - INTERVAL '8 days'
),
(
    '777e4567-e89b-12d3-a456-426614174000',
    '77777777-7777-7777-7777-777777777777',
    '123e4567-e89b-12d3-a456-426614174000',
    'pedro.empresa@cliente.com.br',
    'Pedro',
    'Rodrigues',
    'client',
    'CEO',
    null,
    '(11) 99999-0007',
    'active',
    now() - INTERVAL '5 days',
    now() - INTERVAL '12 days'
),
(
    '888e4567-e89b-12d3-a456-426614174000',
    '88888888-8888-8888-8888-888888888888',
    '123e4567-e89b-12d3-a456-426614174000',
    'lucia.inativa@exemplo.com.br',
    'Lúcia',
    'Fernandes',
    'staff',
    'Ex-Secretária',
    null,
    '(11) 99999-0008',
    'inactive',
    now() - INTERVAL '30 days',
    now() - INTERVAL '60 days'
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 3. UPDATE LAW FIRM WITH MORE DETAILS
-- =====================================================
UPDATE law_firms SET
    legal_name = 'Dávila Reis Advocacia e Consultoria LTDA',
    cnpj = '12.345.678/0001-90',
    oab_number = 'OAB/SP 123456',
    website = 'https://davilareisadvocacia.com.br',
    address_street = 'Avenida Faria Lima',
    address_number = '1811',
    address_complement = 'Conjunto 2121',
    address_neighborhood = 'Jardim Paulistano',
    address_city = 'São Paulo',
    address_state = 'SP',
    address_zipcode = '01451-001',
    logo_url = 'https://via.placeholder.com/200x60/0066CC/FFFFFF?text=Dávila+Reis',
    updated_at = now()
WHERE id = '123e4567-e89b-12d3-a456-426614174000';

-- =====================================================
-- 4. CREATE SOME ACTIVITY DATA (Statistics)
-- =====================================================

-- Update user login timestamps for more realistic data
UPDATE users SET last_login_at = now() - INTERVAL '3 hours' 
WHERE email = 'robson@davilareisadvocacia.com.br';

UPDATE users SET last_login_at = now() - INTERVAL '1 day' 
WHERE email = 'maria.silva@davilareisadvocacia.com.br';

UPDATE users SET last_login_at = now() - INTERVAL '2 days' 
WHERE email = 'joao.santos@davilareisadvocacia.com.br';

-- =====================================================
-- 5. VERIFICATION QUERIES
-- =====================================================

-- Check what we created
SELECT 
    'Law Firms Created' as category,
    COUNT(*) as count
FROM law_firms
UNION ALL
SELECT 
    'Users Created' as category,
    COUNT(*) as count
FROM users
UNION ALL
SELECT 
    'Active Users' as category,
    COUNT(*) as count
FROM users WHERE status = 'active'
UNION ALL
SELECT 
    'Admin Users' as category,
    COUNT(*) as count
FROM users WHERE user_type = 'admin'
UNION ALL
SELECT 
    'Lawyer Users' as category,
    COUNT(*) as count
FROM users WHERE user_type = 'lawyer'
UNION ALL
SELECT 
    'Staff Users' as category,
    COUNT(*) as count
FROM users WHERE user_type = 'staff'
UNION ALL
SELECT 
    'Client Users' as category,
    COUNT(*) as count
FROM users WHERE user_type = 'client';

-- Show sample data
SELECT 
    '--- Sample Users ---' as info,
    '' as law_firm,
    '' as name,
    '' as email,
    '' as user_type,
    '' as status
UNION ALL
SELECT 
    lf.name as info,
    lf.name as law_firm,
    u.first_name || ' ' || u.last_name as name,
    u.email,
    u.user_type,
    u.status
FROM users u
JOIN law_firms lf ON u.law_firm_id = lf.id
ORDER BY user_type, first_name;