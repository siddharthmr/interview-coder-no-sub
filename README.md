# Screenshot Mailer

This app captures screenshots with **Cmd + H** and sends them to your email when **Cmd + Enter** is pressed. It is a stripped down version of the original Interview Coder project with all AI processing removed.

## Setup and Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Gmail API credentials

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
3. Create a `.env` file in the root directory with your Gmail credentials:
   ```
   GMAIL_CLIENT_ID=your_client_id
   GMAIL_CLIENT_SECRET=your_client_secret
   GMAIL_REFRESH_TOKEN=your_refresh_token
   GMAIL_EMAIL_FROM=your_email@gmail.com
   GMAIL_EMAIL_TO=destination_email@gmail.com
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

When running, press **Cmd + H** to capture screenshots and **Cmd + Enter** to email them to yourself.
