-- Migration 010: Employee Financial Intelligence & Resilience Platform Schema
-- Links Employee ID (EMP-RKVT-1001) with Company Outlook, Career Risk, Skill Gaps, Career Transitions, and Loan Affordability

-- 1. Companies Table: Employer health, financial & business outlook
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    company_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100) NOT NULL,
    revenue_trend VARCHAR(50) NOT NULL,
    profit_trend VARCHAR(50) NOT NULL,
    funding_status VARCHAR(100) NOT NULL,
    employee_growth NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    attrition_rate NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    hiring_trend VARCHAR(50) NOT NULL,
    layoff_trend VARCHAR(100) NOT NULL,
    debt_exposure VARCHAR(50) NOT NULL,
    industry_outlook VARCHAR(100) NOT NULL,
    health_score NUMERIC(5, 2) NOT NULL DEFAULT 70.00,
    growth_score NUMERIC(5, 2) NOT NULL DEFAULT 60.00,
    stability_score NUMERIC(5, 2) NOT NULL DEFAULT 70.00,
    risk_level VARCHAR(30) NOT NULL CHECK (risk_level IN ('LOW', 'MODERATE', 'ELEVATED', 'HIGH', 'CRITICAL')),
    risk_explanation TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Employees Table: Employee identity linking User ID and Company ID
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    employee_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    joining_date DATE,
    years_of_experience NUMERIC(4, 1) NOT NULL DEFAULT 0.0,
    current_salary NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    monthly_take_home NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    education VARCHAR(255),
    location VARCHAR(100),
    employment_type VARCHAR(50) DEFAULT 'Full-time',
    job_stability_score NUMERIC(5, 2) NOT NULL DEFAULT 70.00,
    career_risk_score VARCHAR(30) NOT NULL CHECK (career_risk_score IN ('LOW', 'MODERATE', 'ELEVATED', 'HIGH', 'CRITICAL')),
    career_growth_score NUMERIC(5, 2) NOT NULL DEFAULT 70.00,
    career_resilience_score NUMERIC(5, 2) NOT NULL DEFAULT 61.00,
    potential_resilience_score NUMERIC(5, 2) NOT NULL DEFAULT 84.00,
    career_risk_explanation TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Employee Skills & Gap Roadmap Table
CREATE TABLE IF NOT EXISTS employee_skills (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    current_level INTEGER NOT NULL CHECK (current_level BETWEEN 1 AND 5),
    target_level INTEGER NOT NULL CHECK (target_level BETWEEN 1 AND 5),
    gap_level INTEGER NOT NULL DEFAULT 0,
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    roadmap_phase VARCHAR(50) NOT NULL DEFAULT '0-3 months',
    learning_path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Career Transition Modes & Alternative Roles Table
CREATE TABLE IF NOT EXISTS career_transitions (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
    target_role VARCHAR(100) NOT NULL,
    match_percentage NUMERIC(5, 2) NOT NULL,
    min_salary NUMERIC(15, 2) NOT NULL,
    max_salary NUMERIC(15, 2) NOT NULL,
    skills_gap_level VARCHAR(20) NOT NULL CHECK (skills_gap_level IN ('Low', 'Medium', 'High')),
    key_transferable_skills TEXT[] NOT NULL,
    missing_skills TEXT[] NOT NULL,
    explanation TEXT NOT NULL,
    ranking_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Employee Loan Affordability Table (Resilient Affordability vs Bank Eligibility)
CREATE TABLE IF NOT EXISTS employee_loan_affordability (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
    monthly_income NUMERIC(15, 2) NOT NULL,
    existing_emi NUMERIC(15, 2) NOT NULL,
    max_safe_emi NUMERIC(15, 2) NOT NULL,
    recommended_emi NUMERIC(15, 2) NOT NULL,
    bank_eligible_emi NUMERIC(15, 2) NOT NULL,
    conservative_loan_amount NUMERIC(15, 2) NOT NULL,
    safe_loan_min NUMERIC(15, 2) NOT NULL,
    safe_loan_max NUMERIC(15, 2) NOT NULL,
    bank_eligible_loan_amount NUMERIC(15, 2) NOT NULL,
    affordability_explanation TEXT NOT NULL,
    resilience_distinction_notes TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Indexes for High Performance Querying
CREATE INDEX IF NOT EXISTS idx_companies_company_id ON companies(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_skills_employee_id ON employee_skills(employee_id);
CREATE INDEX IF NOT EXISTS idx_career_transitions_employee_id ON career_transitions(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_loan_affordability_employee_id ON employee_loan_affordability(employee_id);
