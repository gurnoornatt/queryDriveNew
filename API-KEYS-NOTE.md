# API Keys Note

All API keys in this repository have been replaced with placeholder values.

When setting up the project locally, you need to:

1. Copy `.env.example` to `.env`
2. Replace all placeholder API keys with your actual API keys:
   - `ANTHROPIC_API_KEY` - Anthropic API key for Claude
   - `OPENAI_API_KEY` - OpenAI API key for GPT models
   - `GOOGLE_API_KEY` - Google API key for Google services
   - `DD_DEVELOPER_ID` - DoorDash Developer ID
   - `DD_KEY_ID` - DoorDash Key ID
   - `DD_SIGNING_SECRET` - DoorDash Signing Secret

**IMPORTANT:** Never commit actual API keys to the repository. The `.env` file is included in `.gitignore` to prevent this. 