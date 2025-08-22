-- Location: supabase/migrations/20250116042336_expense_tracker_auth.sql
-- Schema Analysis: Fresh project with no existing schema
-- Integration Type: Complete authentication system setup
-- Dependencies: None - fresh project

-- 1. Types and Core Tables
CREATE TYPE public.user_role AS ENUM ('admin', 'user');
CREATE TYPE public.profile_type AS ENUM ('personal', 'family', 'business');
CREATE TYPE public.expense_category AS ENUM ('food', 'transport', 'shopping', 'bills', 'entertainment', 'health', 'travel', 'other');
CREATE TYPE public.payment_method AS ENUM ('cash', 'credit_card', 'debit_card', 'digital_wallet', 'bank_transfer');

-- Core user profiles table (intermediary between auth.users and app data)
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role public.user_role DEFAULT 'user'::public.user_role,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Expense profiles for different categories (personal, family, business)
CREATE TABLE public.expense_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type public.profile_type NOT NULL,
    balance DECIMAL(12,2) DEFAULT 0.00,
    monthly_spent DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Expenses table
CREATE TABLE public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.expense_profiles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    category public.expense_category NOT NULL,
    payment_method public.payment_method NOT NULL,
    description TEXT,
    memo TEXT,
    expense_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Budgets table
CREATE TABLE public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.expense_profiles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    category public.expense_category NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    period TEXT DEFAULT 'monthly',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Essential Indexes
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_expense_profiles_user_id ON public.expense_profiles(user_id);
CREATE INDEX idx_expenses_profile_id ON public.expenses(profile_id);
CREATE INDEX idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX idx_expenses_date ON public.expenses(expense_date);
CREATE INDEX idx_budgets_profile_id ON public.budgets(profile_id);
CREATE INDEX idx_budgets_user_id ON public.budgets(user_id);

-- 3. RLS Setup
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies (Following Pattern 1 and 2 from guidelines)

-- Pattern 1: Core user table - Simple ownership
CREATE POLICY "users_manage_own_user_profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Pattern 2: Simple user ownership for expense profiles
CREATE POLICY "users_manage_own_expense_profiles"
ON public.expense_profiles
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Pattern 2: Simple user ownership for expenses
CREATE POLICY "users_manage_own_expenses"
ON public.expenses
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Pattern 2: Simple user ownership for budgets
CREATE POLICY "users_manage_own_budgets"
ON public.budgets
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 5. Function for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')::public.user_role
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Mock Data for Testing
DO $$
DECLARE
    user1_id UUID := gen_random_uuid();
    user2_id UUID := gen_random_uuid();
    profile1_id UUID := gen_random_uuid();
    profile2_id UUID := gen_random_uuid();
    profile3_id UUID := gen_random_uuid();
BEGIN
    -- Create auth users with complete required fields
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
        is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
        recovery_token, recovery_sent_at, email_change_token_new, email_change,
        email_change_sent_at, email_change_token_current, email_change_confirm_status,
        reauthentication_token, reauthentication_sent_at, phone, phone_change,
        phone_change_token, phone_change_sent_at
    ) VALUES
        (user1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'demo@expensetracker.com', crypt('demo123', gen_salt('bf', 10)), now(), now(), now(),
         '{"full_name": "Demo User"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (user2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'test@expensetracker.com', crypt('test123', gen_salt('bf', 10)), now(), now(), now(),
         '{"full_name": "Test User"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null);

    -- Create expense profiles
    INSERT INTO public.expense_profiles (id, user_id, name, type, balance, monthly_spent) VALUES
        (profile1_id, user1_id, 'Personal Expenses', 'personal'::public.profile_type, 2450.75, 1250.30),
        (profile2_id, user1_id, 'Family Budget', 'family'::public.profile_type, 5230.00, 2850.75),
        (profile3_id, user1_id, 'Business Expenses', 'business'::public.profile_type, 8750.25, 3200.50);

    -- Create sample expenses
    INSERT INTO public.expenses (profile_id, user_id, amount, category, payment_method, description, expense_date) VALUES
        (profile1_id, user1_id, 5.50, 'food'::public.expense_category, 'credit_card'::public.payment_method, 'Coffee at Starbucks', '2025-01-15'),
        (profile2_id, user1_id, 125.80, 'food'::public.expense_category, 'debit_card'::public.payment_method, 'Grocery shopping', '2025-01-14'),
        (profile3_id, user1_id, 89.99, 'other'::public.expense_category, 'credit_card'::public.payment_method, 'Office supplies', '2025-01-13');

    -- Create sample budgets
    INSERT INTO public.budgets (profile_id, user_id, category, amount, start_date, end_date) VALUES
        (profile1_id, user1_id, 'food'::public.expense_category, 500.00, '2025-01-01', '2025-01-31'),
        (profile1_id, user1_id, 'transport'::public.expense_category, 200.00, '2025-01-01', '2025-01-31'),
        (profile2_id, user1_id, 'food'::public.expense_category, 800.00, '2025-01-01', '2025-01-31');
        
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'Foreign key error: %', SQLERRM;
    WHEN unique_violation THEN
        RAISE NOTICE 'Unique constraint error: %', SQLERRM;
    WHEN OTHERS THEN
        RAISE NOTICE 'Unexpected error: %', SQLERRM;
END $$;