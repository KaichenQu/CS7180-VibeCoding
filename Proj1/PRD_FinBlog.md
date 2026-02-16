## 1. Problem Statement

Existing personal finance tools focus on **recording transactions** and **setting budgets**, but ignore **why** users overspend and **how** they feel about their financial habits. Interview research (n=3) with students and early-career professionals revealed a consistent pattern: users either don't track spending at all, or abandon tracking tools within weeks because the process is tedious and offers no meaningful reflection.

This is not a tooling gap — users already have banking apps, spreadsheets, and budgeting software. It's a **reflection gap**. Without a simple way to see where money goes and reflect on spending behavior, users cannot build lasting financial awareness or change habits.

## 2. Proposed Solution

**FinBlog** is a lightweight personal finance tool that helps users track daily expenses, visualize spending patterns, and reflect on their financial habits monthly. Instead of complex budgeting workflows, it focuses on quick expense logging, clear visual summaries, and a built-in monthly reflection journal.

The core design principle: **awareness drives better spending decisions.**

## 3. Target Users

- **Primary:** College and graduate students managing limited income, allowances, and daily expenses
- **Secondary:** Early-career professionals (0–3 years) building financial habits on their first regular salary
- **Common trait:** Individuals who want simple spending visibility without the complexity of full budgeting tools

## 4. Core Features

| Feature                          | Description                                                                  | Priority    |
| -------------------------------- | ---------------------------------------------------------------------------- | ----------- |
| Quick expense logging            | Users can log an expense with amount, category, and optional note in seconds | Must Have   |
| Spending dashboard               | Overview showing total spending and top categories for the current period     | Must Have   |
| Spending charts & visual breakdowns | Charts displaying spending distribution by category and over time          | Should Have |
| Monthly reflection               | Journal-style feature for users to write reflections on their spending habits | Should Have |
| Expense history with edit/delete | Chronological list of recent expenses with ability to edit or remove entries  | Should Have |

## 5. User Flow

1. **Log** → User enters expense amount + category + optional note via a simple input interface
2. **View** → Dashboard displays total spending, top categories, and visual charts
3. **Reflect** → At month's end, user writes a short reflection on spending patterns and goals
4. **Review** → User can browse expense history and spending trends over time

## 6. Out of Scope

- Bank account integration or automatic transaction import
- Shared household budgeting or team features
- AI-based spending predictions or automated financial advice
- Investment tracking or net worth calculations

These are intentionally deferred based on interview findings that focused on personal, manual expense awareness.

## 7. Success Metrics

| Metric                  | Target                                                          | Measurement                  |
| ----------------------- | --------------------------------------------------------------- | ---------------------------- |
| Logging consistency     | >60% of users log expenses at least 4 days per week             | In-app event tracking        |
| Dashboard engagement    | >70% of users view the dashboard at least once per week         | App analytics                |
| Reflection completion   | >40% of users complete a monthly reflection                     | Feature usage analytics      |
| User satisfaction       | Positive qualitative feedback in usability testing (n≥5)        | Post-test interviews         |

## 8. Assumptions & Risks

**Assumptions:**

- Users will log expenses manually if the input process takes under 10 seconds
- Visual spending summaries meaningfully improve financial awareness vs. checking bank balances alone

**Risks:**

- _Friction risk:_ Manual expense entry may feel tedious over time → Mitigate with quick-input UI, category shortcuts, and recent-expense templates
- _Adoption risk:_ Users accustomed to banking apps may not see the need for a separate tool → Position as a reflection companion, not a bank replacement
- _Validation risk:_ Interview sample is small (n=3) → Plan for broader usability testing before full build
