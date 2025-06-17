# Interview Coder

This modified version is for educational purposes only. The original Interview Coder application is a commercial product with subscription requirements.

## Changes
- Removed all authentication
- Replaced backend API service with direct OpenAI integration (via OpenRouter)
- Solutions generated directly from screenshots using o4-mini-high rather than original 2 step method
- Replaced app branding with generic system utility appearance (random name + generic icon)
- Increased max screenshots from 2 to 5
- Decreased font size to fit more code on screen
- Cmd + Q to quit app on mac
- Default language changed from Python to Java

## Setup and Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- OpenRouter API key

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/siddharthmr/interview-coder-no-sub.git
   cd interview-coder-no-sub
   ```

2. Install dependencies:
   ```
   npm install
   # or
   yarn
   ```

3. Create a `.env` file in the root directory:
   ```
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   ```

4. Run the application in development mode:
   ```
   npm run dev
   # or
   yarn dev
   ```

5. Build the application for production:
   ```
   npm run build
   # or
   yarn build
   ```

## API Configuration

This application uses OpenRouter API for AI processing with the o4-mini-high model. You'll need to:

1. Sign up at [OpenRouter](https://openrouter.ai/)
2. Get your API key from the dashboard
3. Add the key to your `.env` file as shown above

The app will process screenshots directly through OpenRouter without requiring any additional backend services.
