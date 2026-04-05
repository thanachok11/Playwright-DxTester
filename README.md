# Playwright DxTester

E2E testing suite for Dx system using Playwright with TypeScript.

## Features
- **TypeScript**: Fully migrated to TypeScript for better type safety.
- **Page Object Model**: Centralized login logic in `pages/login.page.ts`.
- **Global Authentication**: Integrated with `auth.setup.ts` to manage sessions across ports.
- **Reporting**: Automated Telegram reporting for test results.

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file with your credentials:
   ```env
   BASE_URL=http://43.229.78.113:8505
   API_URL=http://43.229.78.113:8505/
   USERNAME2=your_username
   PASSWORD=your_password
   TELEGRAM_TOKEN=your_token
   CHAT_ID=your_chat_id
   ```

## Running Tests
Run all tests:
```bash
npx playwright test
```

## Project Structure
- `tests/`: Spec files (01-12)
- `pages/`: Page Object Models
- `tests/utils/`: Helper utilities
- `.auth/`: (Ignored) Stored session state
