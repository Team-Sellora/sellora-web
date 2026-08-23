# Sellora Admin Hub

Build a clean, professional management dashboard for a B2B SaaS platform called Sellora — an FMCG field-sales and distribution management system. This is an internal management tool, not a marketing site. Prioritise clarity, readability, and fast navigation over visual flair.

Design principles:

Light theme only

Neutral, professional color palette — white background, dark grey text, one calm accent color (a muted blue) for buttons and active states. No gradients, no bright colors.

Standard system font (Inter or system-ui). No decorative fonts.

Generous white space, clear visual hierarchy, easy on the eyes for long working sessions

Data-dense but not cluttered — this is a tool people use all day

Do NOT add any authentication. No login system, no Supabase auth, no user management backend. I will wire up my own OIDC authentication separately. Just build the UI shell with a placeholder for where the logged-in user's name and role would appear (top right).

Layout:

Left sidebar navigation (collapsible), fixed

Top bar with the Sellora name/logo on the left, and a placeholder user avatar + role label on the right

Main content area with breadcrumbs

Sidebar navigation items (each links to a page):

Dashboard (overview with summary cards)

Provinces

Area Managers

Agencies

Territories

Sales Reps

Shops

Products

Inventory

Orders

Pages to build:

Dashboard — a row of summary stat cards (total agencies, territories, shops, active reps) and a simple recent-activity list. Clean cards with a number and label each.

List pages (Provinces, Agencies, Territories, Sales Reps, Shops, Products) — each should be a data table with columns, a search box, a status filter dropdown (Active/Inactive), pagination, and a primary "Add New" button top right. Rows should have edit/deactivate actions.

Detail/form pages — clean forms for creating and editing records, with labelled input fields, inline validation error styling (red text below the field), and Save/Cancel buttons. Forms should be single-column and easy to scan.

Components to include:

Reusable data table component with sortable columns

Reusable form input components with label + error message support

Status badges (green for Active, grey for Inactive)

A "not authorised" page (clean, centered message with a link back to dashboard) — I'll use this for role-based access control

A loading state and an empty state for tables ("No records found")

Technical:

React with functional components and hooks

React Router for navigation

Use plain, readable component structure — I'll be adding OIDC auth and API calls afterward, so keep the data layer as simple placeholder/mock data for now

Make it easy to later swap mock data for real API calls

Keep everything minimal, professional, and functional. Think enterprise admin panel, not consumer app. Do not add too many things. Just build the basic site.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
