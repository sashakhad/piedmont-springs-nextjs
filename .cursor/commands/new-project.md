# Create New Project

Create a fresh copy of this scaffold as a new project.

## Instructions for AI

**IMPORTANT: Always ask for the project name first before doing anything else!**

## Steps

1. **Ask for project name FIRST** - Display this prompt:

   ---
   
   ## 🆕 Let's create your new project!
   
   **What would you like to name your project?**
   
   Some tips for a good name:
   - Use lowercase letters
   - Use dashes instead of spaces (e.g., `my-cool-app`)
   - Keep it short and memorable
   - Examples: `todo-app`, `my-portfolio`, `awesome-project`
   
   **Type your project name below:**
   
   ---

   **WAIT for the user to respond with a name before proceeding!**

2. **Validate the project name** when user provides it:
   - If name has spaces, convert to dashes and confirm: "I'll use `{converted-name}` - is that okay?"
   - If name has uppercase, convert to lowercase and confirm
   - If name has special characters (except dashes), ask them to choose a different name

3. **Ask where to create it** (optional):
   - Default: parent directory of current project
   - Ask: "I'll create this in `{parent-directory}`. Is that okay, or would you like a different location?"

4. **Copy the scaffold** - Run this command:
   ```bash
   cp -r "$(pwd)" "<destination>/<project-name>"
   ```

5. **Clean up the new project**:
   ```bash
   cd "<destination>/<project-name>"
   rm -rf node_modules .git pnpm-lock.yaml package-lock.json
   ```

6. **Initialize fresh git repo**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit from scaffold"
   ```

7. **Update package.json** - Change the `"name"` field to the new project name

8. **Display success message**:

   ---
   
   ## ✅ Your new project "{project-name}" is ready!
   
   **Project location:** `<full-path-to-new-project>`
   
   ### 👉 Next Steps
   
   1. **Open your new project in Cursor:**
      - Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
      - Type "Open Folder" and select it
      - Navigate to: `<full-path-to-new-project>`
      - Click "Open"
   
   2. **Once you're in the new project, run `/setup`** to install dependencies
   
   3. **Then run `/start`** to launch your app!
   
   ---

## Important Reminders

- **DO NOT proceed without getting a project name from the user first**
- Wait for user input at step 1 before running any commands
- Make sure to use the exact name the user provides (after validation/conversion)

## Tone

Be helpful and encouraging! Creating a new project is exciting. Guide them through each step clearly and celebrate when it's done.
