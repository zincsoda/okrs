PRODUCT REQUIREMENTS DOCUMENT (V2)
Product Name
Technology Team OKR Manager

1. Purpose
Create an internal OKR management system for a 16-person Technology team that:

Separates Objectives and Key Results
Supports weighted scoring
Allows flexible planning periods (default quarterly)
Automatically calculates progress at KR and Objective level
Provides leadership-level visibility
Is lightweight but operationally rigorous
This system should function as the Technology team’s planning and execution source of truth.

2. Scope
Organization Scope
Single Technology team (16 people)
One unified OKR set per period
No cross-department hierarchy (Phase 1)
3. Planning Period Model
The system must support:

Planning Period
Fields:

id (UUID)
name (e.g. “2026 Q3”, “H2 2026”, “Sprint 42”)
start_date
end_date
status (Draft, Active, Closed)
Default UX behavior:

Pre-populate quarterly naming
Allow manual override
Only one period can be Active at a time.

4. Data Model
Objective
Fields:

id (UUID)
title (string)
description (optional)
owner (string)
weight (number, 0–1)
period_id (foreign key)
status (Draft, Active, Completed, Archived)
progress_percentage (derived)
confidence (derived)
created_at
updated_at
Objective Weighting
All objectives in a period must sum to 1.0 (100%)
Enforce validation at save time
Allow temporary imbalance in Draft state
Key Result
Fields:

id (UUID)
objective_id (foreign key)
title (string)
owner (string)
baseline (number)
target (number)
current (number)
weight (number, 0–1)
progress_percentage (derived)
confidence (enum: High, Medium, Low)
notes (optional)
dependencies (optional)
created_at
updated_at
KR Weighting
KRs under an Objective must sum to 1.0
Progress of Objective is weighted average of its KRs
5. Calculation Logic
5.1 KR Progress
Formula:

𝑝
𝑟
𝑜
𝑔
𝑟
𝑒
𝑠
𝑠
=
𝑐
𝑢
𝑟
𝑟
𝑒
𝑛
𝑡
−
𝑏
𝑎
𝑠
𝑒
𝑙
𝑖
𝑛
𝑒
𝑡
𝑎
𝑟
𝑔
𝑒
𝑡
−
𝑏
𝑎
𝑠
𝑒
𝑙
𝑖
𝑛
𝑒
×
100
progress= 
target−baseline
current−baseline
​
 ×100
Rules:

Clamp between 0% and 100%
Support decreasing goals (e.g. reduce incidents 10 → 2)
If baseline == target → progress = 0
5.2 Objective Progress
𝑜
𝑏
𝑗
𝑒
𝑐
𝑡
𝑖
𝑣
𝑒
_
𝑝
𝑟
𝑜
𝑔
𝑟
𝑒
𝑠
𝑠
=
∑
(
𝐾
𝑅
_
𝑝
𝑟
𝑜
𝑔
𝑟
𝑒
𝑠
𝑠
×
𝐾
𝑅
_
𝑤
𝑒
𝑖
𝑔
ℎ
𝑡
)
objective_progress=∑(KR_progress×KR_weight)
If no KRs:

Progress = 0%
5.3 Period Progress (Optional Display)
𝑝
𝑒
𝑟
𝑖
𝑜
𝑑
_
𝑝
𝑟
𝑜
𝑔
𝑟
𝑒
𝑠
𝑠
=
∑
(
𝑜
𝑏
𝑗
𝑒
𝑐
𝑡
𝑖
𝑣
𝑒
_
𝑝
𝑟
𝑜
𝑔
𝑟
𝑒
𝑠
𝑠
×
𝑜
𝑏
𝑗
𝑒
𝑐
𝑡
𝑖
𝑣
𝑒
_
𝑤
𝑒
𝑖
𝑔
ℎ
𝑡
)
period_progress=∑(objective_progress×objective_weight)
This gives you a single number for the entire Technology org.

6. Confidence Rollup (Answering Your Question #4)
You asked what this meant.

It means:
How does the system determine overall confidence at Objective level?

Recommended model:

KR Confidence (Manual)
Each KR has:

High
Medium
Low
Objective Confidence (Derived)
Use weighted lowest confidence logic:

If any KR weighted >30% is Low → Objective = Low
Else if any KR is Medium → Objective = Medium
Else → High
Why?
Because one large failing KR should not hide under averages.

This surfaces real execution risk.

7. Functional Requirements
7.1 Period Management
Users can:

Create period
Activate period
Close period
Duplicate previous period into Draft
System:

Only 1 active period
Archived periods are read-only
7.2 Objective Management
Users can:

Create Objective without KRs
Assign weight
Assign owner
Edit Objective
Delete Objective (Draft only)
View Objective progress
Validation:

Objective weights must total 100% before activation
7.3 Key Result Management
Users can:

Add KRs under Objective
Assign weight
Update current value inline
Edit confidence
Delete KRs
Validation:

KR weights under Objective must total 100%
7.4 Dashboard View
Default View:

For each Objective:

Title
Owner
Weight
Progress bar
Confidence badge
KR count
Expanding shows:

KR list
Each KR progress
Owner
Baseline / Current / Target
Weight
Confidence
Notes
Top of page:

Period selector
Overall Tech Team progress %
Overall confidence indicator
7.5 Executive Mode Toggle
Executive Mode shows:

Period summary
Objective list only
Weighted progress
Confidence color indicator
No editing controls
Designed for board or leadership meetings.

8. UI/UX Principles
Clean and minimal
Executive-readable in under 60 seconds
Mobile readable
Card-based grouping
Color semantics consistent:
Green: 70–100%
Yellow: 40–69%
Red: 0–39%
Confidence badges:

High → Green
Medium → Yellow
Low → Red
9. Validation Rules
KR weight sum must equal 1.0 before Objective activation
Objective weight sum must equal 1.0 before Period activation
Baseline and Target required
Current defaults to Baseline
Prevent divide-by-zero errors
10. Persistence
Phase 1:

Local storage
Phase 2:

Backend API
Postgres DB
Period locking
11. Success Metrics
100% of tech team OKRs managed inside system
Weekly updates maintained
Executive reporting time reduced
Improved predictability quarter-over-quarter
12. Future Extensions
Individual contributor OKRs
Cascading OKRs
Slack reminders
Change history
CSV export
Jira integration
Snapshot at period close
Retrospective view
Technical Build Guidance for Cursor
Recommended stack:

Frontend:

React
Tailwind
Zustand for state
Backend (optional Phase 2):

Node + Express
Postgres
Data structure:

Period → Objectives → KRs
All calculations:

Client-side reactive
Validation:

Enforced at save time
Clear inline errors

