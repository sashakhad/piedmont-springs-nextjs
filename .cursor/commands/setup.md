# Setup Project

Set up this project by installing all dependencies and configuring the environment.

## Steps

1. **Check for pnpm** - Run `which pnpm` to see if it's installed
   - If not found, install it with `npm install -g pnpm` (needs network permission)

2. **Install dependencies** - Run `pnpm install` in the project root (needs network permission)
   - Let the user know this takes 1-2 minutes

3. **Create .env file** if it doesn't exist:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
   ```

4. **Generate Prisma client** - Run `pnpm run db:generate`

5. **Success message** - Tell the user:
   - ✅ Setup complete!
   - Run `/start` to launch the development server
   - The app will be at http://localhost:3000

## Tone

Be friendly and encouraging. Explain each step as you go so the user understands what's happening. If something fails, explain it simply and suggest a fix.

