
import { query } from '../config/db.js';
import bcrypt from 'bcrypt';

export async function seedDatabase(standalone: boolean = false): Promise<void> {
  try {
    console.log('🌱 Starting database seeding for Hackathon Demo...');

    const hashedPin = await bcrypt.hash('1234', 10);

    // 1. Seed Demo User
    const demoEmail = 'demo@finfolio.com';
    let userRes = await query('SELECT id FROM users WHERE email = $1', [demoEmail]);
    let userId: number;

    if (userRes.rows.length === 0) {
      console.log('Creating demo user (demo@finfolio.com)...');
      const insertUser = await query(
        `INSERT INTO users (name, email, pin, is_guest) 
         VALUES ($1, $2, $3, false) RETURNING id`,
        ['Demo User', demoEmail, hashedPin]
      );
      userId = insertUser.rows[0].id;
    } else {
      console.log('Updating demo user pin...');
      userId = userRes.rows[0].id;
      await query(`UPDATE users SET pin = $1, name = 'Demo User' WHERE id = $2`, [hashedPin, userId]);
    }

    // 2. Seed Nominee User
    const nomineeEmail = 'nominee@finfolio.com';
    let nomineeRes = await query('SELECT id FROM users WHERE email = $1', [nomineeEmail]);
    let nomineeUserId: number;

    if (nomineeRes.rows.length === 0) {
      console.log('Creating nominee user (nominee@finfolio.com)...');
      const insertNominee = await query(
        `INSERT INTO users (name, email, pin, is_guest) 
         VALUES ($1, $2, $3, false) RETURNING id`,
        ['Trusted Nominee', nomineeEmail, hashedPin]
      );
      nomineeUserId = insertNominee.rows[0].id;
    } else {
      console.log('Updating nominee user pin...');
      nomineeUserId = nomineeRes.rows[0].id;
      await query(`UPDATE users SET pin = $1, name = 'Trusted Nominee' WHERE id = $2`, [hashedPin, nomineeUserId]);
    }

    // 3. Seed Demo User Wallet (₹1,00,000)
    console.log('Seeding demo user wallet with ₹1,00,000 INR balance...');
    await query(
      `INSERT INTO wallets (user_id, balance, currency, updated_at)
       VALUES ($1, 100000.00, 'INR', NOW())
       ON CONFLICT (user_id) DO UPDATE SET 
       balance = 100000.00,
       currency = 'INR',
       updated_at = NOW()`,
      [userId]
    );

    // Seed Nominee Wallet (₹50,000)
    await query(
      `INSERT INTO wallets (user_id, balance, currency, updated_at)
       VALUES ($1, 50000.00, 'INR', NOW())
       ON CONFLICT (user_id) DO UPDATE SET 
       balance = 50000.00,
       currency = 'INR',
       updated_at = NOW()`,
      [nomineeUserId]
    );

    // 4. Seed Financial Goal ("Emergency Reserve" Target: ₹2,00,000, Current: ₹50,000)
    console.log('Seeding financial goal: Emergency Reserve...');
    await query(`DELETE FROM financial_goals WHERE user_id = $1`, [userId]);
    await query(
      `INSERT INTO financial_goals (user_id, name, target_amount, current_amount, target_date, category, priority)
       VALUES ($1, 'Emergency Reserve', 200000.00, 50000.00, '2025-12-31', 'emergency', 'high')`,
      [userId]
    );

    // 5. Seed Accountability Partner (Trusted Nominee)
    console.log('Seeding accountability partner: nominee@finfolio.com...');
    await query(`DELETE FROM accountability_partners WHERE user_id = $1`, [userId]);
    const partnerRes = await query(
      `INSERT INTO accountability_partners (user_id, name, email, relationship, status)
       VALUES ($1, 'Trusted Nominee', $2, 'Financial Mentor', 'active')
       RETURNING id`,
      [userId, nomineeEmail]
    );
    const partnerId = partnerRes.rows[0].id;

    // 6. Seed Commitment Rules (Essential, Important, Discretionary with ₹20,000 threshold)
    console.log('Seeding commitment rules (₹20,000 protection threshold)...');
    await query(`DELETE FROM commitment_rules WHERE user_id = $1`, [userId]);
    await query(
      `INSERT INTO commitment_rules (user_id, category, level, requires_approval, max_instant_amount, partner_id)
       VALUES 
       ($1, 'essential', 'low', false, 100000.00, NULL),
       ($1, 'important', 'medium', true, 20000.00, $2),
       ($1, 'discretionary', 'strict', true, 20000.00, $2)`,
      [userId, partnerId]
    );

    // 7. Seed Financial Profile (Income: ₹65,000, Expenses: ₹35,000, Emergency Savings: ₹2,10,000)
    console.log('Seeding financial profile (Income: ₹65k, Expenses: ₹35k, Emergency Fund: ₹2,10k)...');
    await query(
      `INSERT INTO user_profiles (user_id, monthly_income, monthly_expenses, emergency_fund, savings_rate, location, industry, experience_years)
       VALUES ($1, 65000.00, 35000.00, 210000.00, 0.4615, 'Bengaluru', 'Enterprise Software', 3)
       ON CONFLICT (user_id) DO UPDATE SET
       monthly_income = EXCLUDED.monthly_income,
       monthly_expenses = EXCLUDED.monthly_expenses,
       emergency_fund = EXCLUDED.emergency_fund,
       savings_rate = EXCLUDED.savings_rate,
       location = EXCLUDED.location`,
      [userId]
    );

    await query(
      `INSERT INTO user_financial_profiles (user_id, income_bracket, age_group, health_score, survival_period)
       VALUES ($1, '₹50K-₹75K', '25-34', 81, 6.00)
       ON CONFLICT (user_id) DO UPDATE SET 
       income_bracket = EXCLUDED.income_bracket,
       age_group = EXCLUDED.age_group,
       health_score = EXCLUDED.health_score,
       survival_period = EXCLUDED.survival_period`,
      [userId]
    );

    // 8. Seed Emergency Fund Monitoring (₹2,10,000 / ₹35,000 = 6.0 months runway)
    console.log('Seeding emergency fund monitoring (6.0 months coverage)...');
    await query(
      `INSERT INTO emergency_fund_monitoring
       (user_id, current_balance, target_months, monthly_burn_rate, months_coverage, status)
       VALUES ($1, 210000.00, 6, 35000.00, 6.00, 'excellent')
       ON CONFLICT (user_id) DO UPDATE SET
       current_balance = EXCLUDED.current_balance,
       monthly_burn_rate = EXCLUDED.monthly_burn_rate,
       months_coverage = EXCLUDED.months_coverage,
       status = EXCLUDED.status`,
      [userId]
    );

    // 9. Seed Initial Wallet Transaction Ledger
    console.log('Seeding initial wallet ledger transactions...');
    await query(`DELETE FROM wallet_transactions WHERE user_id = $1`, [userId]);
    const walletRes = await query('SELECT id FROM wallets WHERE user_id = $1', [userId]);
    const walletId = walletRes.rows[0].id;

    await query(
      `INSERT INTO wallet_transactions (wallet_id, user_id, amount, type, status, category, reason, reference_id)
       VALUES 
       ($1, $2, 100000.00, 'deposit', 'completed', 'income', 'Monthly Savings & Reserve Top-up', 'dep-initial-01')`,
      [walletId, userId]
    );

    // 10. Clean old pending requests and notifications for clean slate demo
    await query(`DELETE FROM withdrawal_requests WHERE user_id = $1`, [userId]);
    await query(`DELETE FROM partner_notifications WHERE user_id = $1 OR partner_email = $2`, [userId, nomineeEmail]);

    // 11. Seed Company Intelligence (COMP-EX-001 - Example Technologies Pvt. Ltd.)
    console.log('Seeding company intelligence: Example Technologies Pvt. Ltd. (COMP-EX-001)...');
    await query(
      `INSERT INTO companies (
         company_id, name, industry, revenue_trend, profit_trend, funding_status, 
         employee_growth, attrition_rate, hiring_trend, layoff_trend, debt_exposure, 
         industry_outlook, health_score, growth_score, stability_score, risk_level, risk_explanation
       ) VALUES (
         'COMP-EX-001', 'Example Technologies Pvt. Ltd.', 'Enterprise Software / SaaS',
         'Decelerating (8% YoY vs 28% prior)', 'Margin contraction (EBITDA margin -3.4%)',
         'Series B / Self-funded reserve', -4.20, 18.50,
         'Selective hiring / Net headcount contraction', 'Moderate restructuring in non-core units',
         'Low leverage (Debt/Equity: 0.28)', 'Challenging tech demand; enterprise budgets under scrutiny',
         72.00, 58.00, 68.00, 'MODERATE',
         'Revenue growth has slowed from 28% to 8% YoY while tech hiring has contracted. Based on available company indicators, employment stability is moderately elevated.'
       ) ON CONFLICT (company_id) DO UPDATE SET
         name = EXCLUDED.name,
         revenue_trend = EXCLUDED.revenue_trend,
         profit_trend = EXCLUDED.profit_trend,
         funding_status = EXCLUDED.funding_status,
         employee_growth = EXCLUDED.employee_growth,
         attrition_rate = EXCLUDED.attrition_rate,
         hiring_trend = EXCLUDED.hiring_trend,
         layoff_trend = EXCLUDED.layoff_trend,
         debt_exposure = EXCLUDED.debt_exposure,
         industry_outlook = EXCLUDED.industry_outlook,
         health_score = EXCLUDED.health_score,
         growth_score = EXCLUDED.growth_score,
         stability_score = EXCLUDED.stability_score,
         risk_level = EXCLUDED.risk_level,
         risk_explanation = EXCLUDED.risk_explanation,
         updated_at = NOW()`,
      []
    );

    // 12. Seed Employee Profile (EMP-RKVT-1001)
    console.log('Seeding employee profile: EMP-RKVT-1001 linked to Demo User...');
    await query(
      `INSERT INTO employees (
         employee_id, user_id, employee_name, email, designation, department,
         company_id, company_name, joining_date, years_of_experience,
         current_salary, monthly_take_home, education, location, employment_type,
         job_stability_score, career_risk_score, career_growth_score,
         career_resilience_score, potential_resilience_score, career_risk_explanation
       ) VALUES (
         'EMP-RKVT-1001', $1, 'Rahul Sharma (Demo User)', $2, 'Software Engineer', 'Engineering',
         'COMP-EX-001', 'Example Technologies Pvt. Ltd.', '2023-01-15', 3.0,
         780000.00, 65000.00, 'B.Tech in Computer Science', 'Bengaluru, Karnataka', 'Full-time',
         74.00, 'MODERATE', 72.00, 61.00, 84.00,
         'Your current role remains viable, but demand for your current skill combination is expected to shift. Adding cloud and AI engineering skills would improve your career resilience from 61/100 to 84/100.'
       ) ON CONFLICT (employee_id) DO UPDATE SET
         user_id = EXCLUDED.user_id,
         employee_name = EXCLUDED.employee_name,
         designation = EXCLUDED.designation,
         department = EXCLUDED.department,
         company_id = EXCLUDED.company_id,
         company_name = EXCLUDED.company_name,
         years_of_experience = EXCLUDED.years_of_experience,
         current_salary = EXCLUDED.current_salary,
         monthly_take_home = EXCLUDED.monthly_take_home,
         education = EXCLUDED.education,
         location = EXCLUDED.location,
         job_stability_score = EXCLUDED.job_stability_score,
         career_risk_score = EXCLUDED.career_risk_score,
         career_growth_score = EXCLUDED.career_growth_score,
         career_resilience_score = EXCLUDED.career_resilience_score,
         potential_resilience_score = EXCLUDED.potential_resilience_score,
         career_risk_explanation = EXCLUDED.career_risk_explanation,
         updated_at = NOW()`,
      [userId, demoEmail]
    );

    // 13. Seed Employee Skills & Roadmap
    console.log('Seeding employee skills and gap roadmap...');
    await query(`DELETE FROM employee_skills WHERE employee_id = 'EMP-RKVT-1001'`);
    const skills = [
      { name: 'React', current: 4, target: 4, gap: 0, priority: 'LOW', phase: '0-3 months', path: 'Advanced frontend component architecture, performance profiling & Web Vitals' },
      { name: 'Node.js', current: 4, target: 4, gap: 0, priority: 'LOW', phase: '0-3 months', path: 'Enterprise REST APIs, event loop optimization & Express/Nest architecture' },
      { name: 'SQL', current: 4, target: 4, gap: 0, priority: 'LOW', phase: '0-3 months', path: 'Relational data modeling, index tuning & ACID transaction integrity' },
      { name: 'JavaScript', current: 4, target: 4, gap: 0, priority: 'LOW', phase: '0-3 months', path: 'TypeScript type gymnastics, async concurrency & design patterns' },
      { name: 'Cloud / AWS', current: 2, target: 4, gap: 2, priority: 'HIGH', phase: '0-3 months', path: 'AWS Certified Solutions Architect: IAM, VPC, ECS, S3, and serverless architectures' },
      { name: 'AI/ML & LLM Ops', current: 1, target: 3, gap: 2, priority: 'HIGH', phase: '3-6 months', path: 'Applied Generative AI, LangChain, RAG architecture, vector search & FastAPI integration' },
      { name: 'DevOps / Docker & K8s', current: 2, target: 4, gap: 2, priority: 'HIGH', phase: '6-12 months', path: 'Docker containerization, Kubernetes cluster management, Helm & CI/CD deployment pipelines' }
    ];

    for (const s of skills) {
      await query(
        `INSERT INTO employee_skills (employee_id, skill_name, current_level, target_level, gap_level, priority, roadmap_phase, learning_path)
         VALUES ('EMP-RKVT-1001', $1, $2, $3, $4, $5, $6, $7)`,
        [s.name, s.current, s.target, s.gap, s.priority, s.phase, s.path]
      );
    }

    // 14. Seed Career Transition Modes (Alternative Roles)
    console.log('Seeding career transition roles (Career Transition Mode)...');
    await query(`DELETE FROM career_transitions WHERE employee_id = 'EMP-RKVT-1001'`);
    const transitions = [
      {
        role: 'Full Stack Developer',
        match: 91.00,
        minSal: 1200000.00,
        maxSal: 1600000.00,
        gap: 'Low',
        transferable: ['React', 'Node.js', 'REST APIs', 'SQL'],
        missing: ['Next.js App Router', 'Tailwind CSS', 'Advanced TypeScript'],
        explanation: 'Strong immediate alignment with your existing core frontend and Node.js backend capabilities. Minimal learning curve for modern full-stack deployments.',
        order: 1
      },
      {
        role: 'Backend Engineer',
        match: 86.00,
        minSal: 1300000.00,
        maxSal: 1700000.00,
        gap: 'Medium',
        transferable: ['Node.js', 'SQL', 'Express', 'Database Architecture'],
        missing: ['Distributed Systems', 'Redis Caching Patterns', 'Apache Kafka'],
        explanation: 'High technical overlap in server-side systems. Focus on building familiarity with event-driven architectures and distributed caching.',
        order: 2
      },
      {
        role: 'Cloud Solutions Engineer',
        match: 78.00,
        minSal: 1500000.00,
        maxSal: 2000000.00,
        gap: 'High',
        transferable: ['Backend Architecture', 'Linux Fundamentals', 'API Security'],
        missing: ['AWS CloudFormation / Terraform', 'Kubernetes Orchestration', 'FinOps Cost Optimization'],
        explanation: 'Lucrative transition path offering substantial resilience against localized company layoffs. Requires completing AWS Solutions Architect certification.',
        order: 3
      },
      {
        role: 'Data Platform Engineer',
        match: 72.00,
        minSal: 1400000.00,
        maxSal: 1900000.00,
        gap: 'High',
        transferable: ['SQL', 'Data Modeling', 'Node.js Ingestion'],
        missing: ['Python Data Pipelines', 'Apache Spark', 'Snowflake / BigQuery'],
        explanation: 'Growing demand across mid-size and enterprise tech firms. Leverages your SQL foundation with additional pipeline engineering skills.',
        order: 4
      }
    ];

    for (const t of transitions) {
      await query(
        `INSERT INTO career_transitions (
           employee_id, target_role, match_percentage, min_salary, max_salary, 
           skills_gap_level, key_transferable_skills, missing_skills, explanation, ranking_order
         ) VALUES ('EMP-RKVT-1001', $1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [t.role, t.match, t.minSal, t.maxSal, t.gap, t.transferable, t.missing, t.explanation, t.order]
      );
    }

    // 15. Seed Employee Loan Affordability (Safe vs Bank Eligibility)
    console.log('Seeding loan affordability (Safe EMI: ₹10k vs Bank Eligible: ₹24.5k)...');
    await query(`DELETE FROM employee_loan_affordability WHERE employee_id = 'EMP-RKVT-1001'`);
    await query(
      `INSERT INTO employee_loan_affordability (
         employee_id, monthly_income, existing_emi, max_safe_emi, recommended_emi, bank_eligible_emi,
         conservative_loan_amount, safe_loan_min, safe_loan_max, bank_eligible_loan_amount,
         affordability_explanation, resilience_distinction_notes
       ) VALUES (
         'EMP-RKVT-1001', 65000.00, 8000.00, 10000.00, 7500.00, 24500.00,
         500000.00, 600000.00, 850000.00, 2200000.00,
         'With ₹65,000 monthly take-home and ₹8,000 existing EMI, your current DTI is 12.3%. FINFOLIO recommends capping any new loan EMI at ₹10,000 to maintain your ₹35,000 essential monthly expense budget and protect your 6-month emergency reserve.',
         'Bank eligibility calculates the absolute maximum debt a lender will approve before default (up to 50% FOIR = ₹24,500 EMI / ₹22 Lakh loan). FINFOLIO resilient affordability calculates what you can comfortably sustain while preserving 6 months of emergency runway and withstanding potential corporate restructuring without debt distress.'
       )`,
      []
    );

    console.log('✅ Database seeding complete for FINFOLIO Demo!');
    console.log(`Demo Employee: EMP-RKVT-1001 | Company: Example Technologies Pvt. Ltd. | Take-Home: ₹65,000/mo`);
    console.log(`Demo User: demo@finfolio.com (PIN: 1234) | Wallet: ₹1,00,000 | Emergency Fund: ₹2,10,000 (6.0 mos)`);
    console.log(`Nominee: nominee@finfolio.com (PIN: 1234) | Status: Active | Threshold: ₹20,000`);
    if (standalone) {
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    if (standalone) {
      process.exit(1);
    }
    throw error;
  }
}

// Execute directly if run as a CLI script
if (process.argv[1]?.endsWith('seedDatabase.ts') || process.argv[1]?.endsWith('seedDatabase.js')) {
  seedDatabase(true);
}
