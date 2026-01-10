# Project Scaffold

A clean, modern scaffold for full-stack web applications built with Next.js 16.1.1, React 19.2.3, TypeScript 5.9.3, Prisma 7.2.0, Tailwind CSS 4.1.18, and shadcn/ui.

---

## 🚀 Quick Start

This project uses **Cursor commands** to make everything easy. Just type these commands in the Cursor chat:

| Command | What it does |
|---------|--------------|
| `/setup` | Installs everything your project needs |
| `/start` | Launches your app so you can see it in the browser |
| `/new-project` | Creates a fresh copy of this template for a new project |

---

## 📋 Getting Started

### First Time Setup

1. Open this folder in Cursor
2. Open the chat (click the chat icon or press `Cmd+L` / `Ctrl+L`)
3. Type `/setup` and press Enter
4. Wait for everything to install (takes 1-2 minutes)
5. Type `/start` to launch your app
6. Open http://localhost:3000 in your browser

**That's it!** You should see your app running.

---

## 🆕 Starting a New Project

Want to create a new project using this template?

1. Type `/new-project` in the chat
2. Enter a name for your project (like `my-cool-app`)
3. Follow the instructions to open your new project in Cursor
4. Run `/setup` in the new project
5. Run `/start` to launch it

---

## 📁 What's Included

This scaffold comes with modern tools pre-configured:

- **Next.js 16.1.1** with App Router and Turbopack
- **React 19.2.3** with latest features
- **TypeScript 5.9.3** with strict configuration
- **Prisma 7.2.0** with PostgreSQL for database management
- **Tailwind CSS 4.1.18** for styling
- **shadcn/ui** with Radix UI components
- **React Hook Form** with Zod validation
- **ESLint** with Next.js and TypeScript rules
- **Prettier** for code formatting

---

## 🛠 For Developers

<details>
<summary>Click to expand developer documentation</summary>

### Manual Commands

If you prefer using the terminal directly:

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Run tests
pnpm run test

# Database commands
pnpm run db:generate    # Generate Prisma client
pnpm run db:push        # Push schema changes
pnpm run db:studio      # Open database UI
```

### Project Structure

```
src/
├── app/                 # Pages and layouts
├── components/          # Reusable UI components
│   └── ui/             # shadcn/ui components
├── lib/                # Utility functions
└── types/              # TypeScript types

prisma/
└── schema.prisma       # Database schema

.cursor/
└── commands/           # Cursor slash commands
```

### Adding UI Components

```bash
pnpm dlx shadcn@latest add [component-name]
```

</details>

---

## ❓ Need Help?

- Type your question in the Cursor chat - the AI can help!
- Check the [Next.js docs](https://nextjs.org/docs)
- Check the [Tailwind CSS docs](https://tailwindcss.com/docs)
