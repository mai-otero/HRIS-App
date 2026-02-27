# HR App — Full Build Plan

## Stack
- **Frontend + Backend:** Next.js (React framework, handles both UI and API routes)
- **Database + Auth + File Storage:** Supabase
- **Hosting:** Vercel
- **Email notifications:** Resend (free tier, simple API, works great with Next.js)

---

## Roles
- **Admin** — full access to all employee profiles, payroll files, PTO balances, and holiday requests. Can create/deactivate employees. There are 2 admins.
- **Employee** — can view their own profile, download their own payroll files, submit/edit holiday requests, and see their PTO balance.

---

## Authentication
- **Magic link** via Supabase Auth — user enters email, gets a login link, no passwords.
- Admin creates employee accounts manually (adds their email in the app, Supabase sends them an invite).
- Row-level security (RLS) in Supabase ensures employees can only query their own data.

---

## Pages & Features

### 1. Login Page
- Email input → magic link sent → redirect to dashboard on click.

### 2. Dashboard (post-login)
- **Admin view:** Overview of all employees, recent holiday requests, quick links to profiles and payroll.
- **Employee view:** Their PTO balance (days used / days remaining / days pending), upcoming approved time off, link to their profile.

### 3. Employee Profiles (Admin only — create/edit)
Fields to store per employee:
- Full name, personal email, phone number, job title
- Address
- Birth date
- Contract type (full-time / part-time), start date, salary, hours
- Status (active / deactivated)
- ID / passport details
- Bank account details
- Steueridentifikationsnummer (tax ID)
- Sozialversicherungsnummer (social security number)
- Lohnsteuerklasse (tax class 1–6)
- Krankenversicherung (health insurance name)
- Emergency contact (name + phone)
- Equipment assigned

Employees can view their own profile but cannot edit it.

### 4. Payroll Section
- Admin uploads one PDF/file per employee per payroll period (e.g. "January 2025").
- Files stored in Supabase Storage, linked to the employee record.
- Employee can only see and download their own files.
- Admin can see and download all files.

### 5. Holiday / PTO
**Rules:**
- 30 days per calendar year (Jan 1 reset)
- Weekdays only (Mon–Fri), German public holidays excluded
- Max 5 days rollover from previous year
- Admin can manually add days to an employee's balance (with a note + date, retroactively if needed)

**Employee flow:**
- Submit a PTO request: pick start date, end date → app calculates working days automatically (excluding weekends + German public holidays)
- Can edit or cancel their own requests
- Can see their full request history and current balance

**Admin flow:**
- See all requests across all employees in a list view
- Receive email notification (via Resend) when a new request is submitted or modified
- Can manually adjust an employee's PTO balance with a reason note
- No approval needed — requests are auto-confirmed

### 6. Admin — Employee Management
- Create new employee: fill in profile fields + email → Supabase sends magic link invite
- Deactivate employee: marks them inactive, hides from active list, preserves all data

---

## Database Schema (Supabase)

### `profiles`
Linked to Supabase auth user. Stores all personal/employment data fields listed above, plus `role` (admin / employee) and `status` (active / deactivated).

### `pto_balances`
| field | type |
|---|---|
| employee_id | uuid (FK → profiles) |
| year | integer |
| base_days | integer (default 30) |
| rolled_over_days | integer (max 5) |
| manually_added_days | integer |
| used_days | integer (calculated) |

### `pto_adjustments`
Log of all manual admin adjustments — employee, days added/removed, reason, date, admin who made the change.

### `pto_requests`
| field | type |
|---|---|
| id | uuid |
| employee_id | uuid (FK → profiles) |
| start_date | date |
| end_date | date |
| working_days | integer (calculated on submit) |
| status | enum: confirmed / cancelled |
| created_at | timestamp |
| updated_at | timestamp |

### `payroll_files`
| field | type |
|---|---|
| id | uuid |
| employee_id | uuid (FK → profiles) |
| file_name | text |
| storage_path | text |
| period | text (e.g. "2025-01") |
| uploaded_at | timestamp |
| uploaded_by | uuid (FK → profiles) |

---

## PTO Day Calculation Logic
- On submit: loop through each day in the range, skip Saturdays, Sundays, and German **national** public holidays (hardcoded list — the ~9 federal holidays that apply across all states: New Year's, Good Friday, Easter Monday, Labour Day, Ascension, Whit Monday, German Unity Day, Christmas Day, Boxing Day)
- Available days = `base_days + rolled_over_days + manually_added_days - used_days`
- At Jan 1 each year: new balance row created. Rolled over days = min(5, previous year's remaining days)

---

## Email Notifications
- Tool: **Resend** (free up to 3,000 emails/month)
- Sign up at resend.com and verify your sending domain before this step
- Trigger: employee submits or edits a PTO request → email sent to both admin emails
- Email contains: employee name, dates requested, number of days, their remaining balance after the request

---

## Security Notes
- All Supabase tables have Row Level Security (RLS) enabled
- Employees can only SELECT their own rows in `profiles`, `pto_requests`, `pto_balances`, `payroll_files`
- Only admins can INSERT/UPDATE/DELETE across all tables
- Payroll files in Supabase Storage are private — signed URLs generated on demand (expire after 60 seconds)

---

## Deployment
- Code lives in a GitHub repo
- Connected to Vercel — every push to `main` auto-deploys
- Environment variables stored in Vercel dashboard (Supabase URL, Supabase anon key, Resend API key)

---

## Build Order (recommended for Claude Code)
1. Supabase project setup — tables, RLS policies, storage bucket
2. Next.js project scaffold + Supabase client connected
3. Auth flow — magic link login/logout
4. Employee profiles — admin CRUD, employee read-only view
5. Payroll — upload, list, download
6. PTO — balance display, request form, day calculation, history
7. Admin PTO dashboard — all requests list, manual adjustments
8. Email notifications via Resend
9. Deploy to Vercel
