# NeuroX

A Next.js web application for financial visualization and planning, integrated with Notion.

## Setup Instructions

Follow these steps to run the project on a new machine:

### 1. Clone the Repository
Clone the project from GitHub and navigate into the project directory:
```bash
git clone https://github.com/tushaar-b/Neurox.git
cd Neurox
```

### 2. Install Dependencies
Ensure you have Node.js installed (v18+ recommended), then install the package dependencies:
```bash
npm install
```

### 3. Configure Environment Variables
Create a local environment file `.env.local` in the root of the project:
```bash
cp .env.example .env.local
```
Then, open `.env.local` and fill in the required Notion keys.

```env
NOTION_API_KEY=your_notion_api_key
NOTION_USERS_DATABASE_ID=your_users_database_id
NOTION_PLANS_DATABASE_ID=your_plans_database_id
```

### 4. Run the Development Server
Start the Next.js development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application running.
