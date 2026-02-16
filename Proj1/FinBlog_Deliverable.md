# HW2 Deliverable — FinBlog

## 1. Problem Statement

Existing personal finance tools focus on recording transactions and setting budgets, but ignore **why** users overspend and **how** they feel about their financial habits. Interview research with students and early-career professionals revealed a consistent pattern: users either don't track spending at all, or abandon tracking tools within weeks because the process is tedious and offers no meaningful reflection.

This is not a tooling gap — users already have banking apps, spreadsheets, and budgeting software. It's a **reflection gap**. Without a simple way to see where money goes and reflect on spending behavior, users cannot build lasting financial awareness or change habits.

**FinBlog** is a lightweight personal finance tool that helps users track daily expenses, visualize spending patterns, and reflect on their financial habits monthly. Instead of complex budgeting workflows, it focuses on quick expense logging, clear visual summaries, and a built-in monthly reflection journal.

---

## 2. User Stories

**US-1: Quick Expense Logging**
As a graduate student, who has limited income, I want to log my daily expenses quickly, so that I can stay aware of where my money goes.

*Acceptance Criteria:*
- User can enter an expense with amount, category, and optional note.
- Logging a single expense takes no more than 10 seconds.
- The expense appears immediately in the recent expenses list after submission.
- Input fields are cleared after a successful log so the user can quickly add another entry.

**US-2: Top Spending Categories**
As an undergraduate student, who receives a monthly allowance, I want to see my top spending categories, so that I can identify areas to cut back.

*Acceptance Criteria:*
- The dashboard displays spending grouped by category for the current month.
- Categories are sorted by total amount spent, highest first.
- Each category shows the total amount and percentage of overall spending.
- The dashboard updates automatically when a new expense is logged.

**US-3: Monthly Reflection Journal**
As an early-career professional, who wants to build better financial habits, I want to write a monthly reflection on my spending, so that I can recognize patterns and make intentional changes.

*Acceptance Criteria:*
- A dedicated reflection section is accessible from the main navigation.
- The user can write and save a free-text reflection entry for each month.
- Past reflections are saved and viewable in chronological order.
- The reflection view displays the corresponding month's spending summary alongside the text entry for context.

**US-4: Spending Charts Over Time**
As an early-career professional, who earns a regular salary, I want to view charts of my spending over time, so that I can track whether I'm improving.

*Acceptance Criteria:*
- At least one chart visualizes spending distribution by category (e.g., pie or bar chart).
- At least one chart shows spending trends over time (e.g., line or bar chart across weeks/months).
- Charts update when new expenses are added or edited.
- The user can view charts for the current period from the dashboard.

**US-5: Simple Input Interface**
As a general individual user, who tracks expenses on the go, I want a simple input interface, so that logging an expense takes minimal effort.

*Acceptance Criteria:*
- The expense input form is accessible within one tap/click from any screen.
- Predefined category options are available for quick selection (e.g., Food, Transport, Entertainment).
- The form validates required fields (amount, category) before submission and shows a clear error if missing.
- The interface is responsive and usable on both mobile and desktop screens.

**US-6: Expense History with Edit/Delete**
As a general individual user, who wants to understand their finances better, I want to browse, edit, and delete past expenses, so that I can correct mistakes and keep my data accurate.

*Acceptance Criteria:*
- A chronological list of recent expenses is visible on the main screen.
- Each expense entry shows the amount, category, note (if any), and date.
- The user can edit any field of a previously logged expense.
- The user can delete an expense, with a confirmation prompt before removal.
- Changes to expenses are immediately reflected in the dashboard and charts.

---

## 3. Reflection on AI-Assisted Workflow

Throughout this project, I used Claude as a collaborative tool to move from early-stage research and hand-drawn wireframes to structured deliverables — specifically the PRD, user stories, and a working prototype artifact. This reflection covers what that workflow looked like, what worked, and where human judgment remained essential.

### The Workflow

My process started with traditional product thinking: identifying a problem area (personal finance awareness), conducting Mom Test interviews, and sketching a wireframe on paper. Once I had those raw inputs — interview notes, a hand-drawn layout, and a rough feature list — I began prompting Claude to help structure and formalize them. I fed in the interview summaries and asked for help drafting a problem statement, then iterated on user stories, and finally used the PRD as a basis for generating a functional prototype artifact.

The workflow was iterative rather than one-shot. I would prompt, review the output, adjust my input or ask for changes, and re-prompt. For instance, the first draft of user stories didn't include acceptance criteria, so I had to go back and layer those in with more specific prompting. The wireframe sketch required me to describe the layout verbally since the AI couldn't perfectly interpret a photo of handwriting — I had to bridge the gap between my visual intent and textual description.

### What Worked Well

AI was strongest at **structuring and formatting**. Turning messy interview notes into a clean, professional PRD happened far faster than it would have manually. The MoSCoW prioritization, the success metrics table, and the risk/assumption framing all benefited from Claude's ability to organize information into standard product management formats. Similarly, generating boilerplate acceptance criteria for user stories was efficient once I provided clear context about what each feature should do.

Speed was another major advantage. Going from a rough concept to a presentable PRD and prototype in a fraction of the time it would normally take allowed me to spend more energy on the thinking and validation side of the work rather than on document formatting.

### What Didn't Work or Required Human Judgment

The most important parts of this project — **problem validation, interview insights, and design decisions** — could not be delegated to AI. Claude could not tell me whether my problem was real; that came from sitting in interviews and hearing people describe running out of money two weeks early or abandoning spreadsheets after two weeks. The "reflection gap" framing emerged from synthesizing those conversations, not from a prompt.

I also found that AI-generated acceptance criteria sometimes started too generic or too ambitious. For example, early drafts included criteria about "intelligent suggestions" that didn't match the MVP scope. I had to prune and rewrite to keep things grounded in what the interviews actually supported.

The wireframe translation was another friction point. My hand-drawn sketch had spatial relationships and layout priorities that were hard to convey in text. The AI could generate a UI, but getting it to match my mental model took several rounds of back-and-forth.

### Key Takeaway

AI accelerated the **execution and formatting** layers of product work — turning ideas into documents, code, and structured deliverables. But the **insight and validation** layers still depended entirely on me. The best results came from pairing human research and judgment with AI's speed at structuring and producing artifacts. The tool is most powerful when you already know what you want to say and need help saying it clearly and quickly.





CLAUDE LINK:

https://claude.ai/share/f5a175a8-1581-4859-9c2e-e59dc4362c12

VIDEO LINK:

https://www.loom.com/share/6a1a77c55be147e59d81ce1a5f4021cf
