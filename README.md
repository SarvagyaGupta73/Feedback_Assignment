# Feedback Collection Platform

A modern, full-stack web application for creating, managing, and analyzing feedback forms. Built with React, TypeScript, and Supabase.

## 🚀 Features

### Core Functionality
- **Form Creation & Management**: Create custom feedback forms with multiple question types
- **Response Collection**: Collect anonymous responses through shareable public links
- **Analytics Dashboard**: View comprehensive analytics and insights
- **CSV Export**: Export response data for further analysis
- **Form Editing**: Edit existing forms and questions
- **Real-time Updates**: Live data synchronization with Supabase

### Question Types Supported
- **Text Input**: Short and long text responses
- **Multiple Choice**: Single-select options
- **Rating Scale**: 1-5 star ratings
- **Required/Optional**: Flexible validation rules

### Analytics & Insights
- Total forms and responses tracking
- Monthly response trends
- Average responses per form
- Top performing forms
- 7-day response trend visualization
- Performance insights dashboard

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Radix UI Components
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time)
- **Routing**: React Router v7
- **Icons**: Lucide React
- **State Management**: React Context API

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Git**
- A **Supabase** account (free tier available)

## 🔧 Local Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd prince
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Supabase Setup

#### Step 3.1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `feedback-platform` (or your preferred name)
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to your location
5. Click "Create new project"
6. Wait for the project to be ready (2-3 minutes)

#### Step 3.2: Get Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (under "Project URL")
   - **Anon/Public Key** (under "Project API keys")

#### Step 3.3: Set Up Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Create a new query and run the following SQL:

```sql
-- Create forms table
CREATE TABLE forms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create questions table
CREATE TABLE questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('text', 'multiple_choice', 'rating')),
  is_required BOOLEAN DEFAULT false,
  options JSONB,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create responses table
CREATE TABLE responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create answers table
CREATE TABLE answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  response_id UUID REFERENCES responses(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_forms_user_id ON forms(user_id);
CREATE INDEX idx_questions_form_id ON questions(form_id);
CREATE INDEX idx_responses_form_id ON responses(form_id);
CREATE INDEX idx_answers_response_id ON answers(response_id);
CREATE INDEX idx_answers_question_id ON answers(question_id);

-- Enable Row Level Security (RLS)
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for forms
CREATE POLICY "Users can view their own forms" ON forms
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own forms" ON forms
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own forms" ON forms
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own forms" ON forms
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for questions
CREATE POLICY "Users can view questions of their forms" ON questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM forms 
      WHERE forms.id = questions.form_id 
      AND forms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create questions for their forms" ON questions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM forms 
      WHERE forms.id = questions.form_id 
      AND forms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update questions of their forms" ON questions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM forms 
      WHERE forms.id = questions.form_id 
      AND forms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete questions of their forms" ON questions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM forms 
      WHERE forms.id = questions.form_id 
      AND forms.user_id = auth.uid()
    )
  );

-- Public can view questions for active forms
CREATE POLICY "Public can view questions for active forms" ON questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM forms 
      WHERE forms.id = questions.form_id 
      AND forms.is_active = true
    )
  );

-- RLS Policies for responses
CREATE POLICY "Users can view responses to their forms" ON responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM forms 
      WHERE forms.id = responses.form_id 
      AND forms.user_id = auth.uid()
    )
  );

-- Public can submit responses to active forms
CREATE POLICY "Public can submit responses to active forms" ON responses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM forms 
      WHERE forms.id = responses.form_id 
      AND forms.is_active = true
    )
  );

-- RLS Policies for answers
CREATE POLICY "Users can view answers to their form responses" ON answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM responses r
      JOIN forms f ON f.id = r.form_id
      WHERE r.id = answers.response_id 
      AND f.user_id = auth.uid()
    )
  );

-- Public can submit answers to active forms
CREATE POLICY "Public can submit answers to active forms" ON answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM responses r
      JOIN forms f ON f.id = r.form_id
      WHERE r.id = answers.response_id 
      AND f.is_active = true
    )
  );
```

#### Step 3.4: Enable Authentication

1. In Supabase dashboard, go to **Authentication** → **Settings**
2. Under **Site URL**, add: `http://localhost:5173`
3. Under **Redirect URLs**, add: `http://localhost:5173`
4. Enable **Email** provider (it's enabled by default)

### 4. Environment Configuration

Create a `.env` file in the project root:

```bash
touch .env
```

Add the following environment variables to `.env`:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace the values with your actual Supabase credentials from Step 3.2.

### 5. Start the Development Server

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:5173`

## 📱 Usage Guide

### Getting Started

1. **Sign Up/Login**: Create an account or login with existing credentials
2. **Create Your First Form**: Click "Create New Form" on the dashboard
3. **Add Questions**: Add various types of questions (text, multiple choice, rating)
4. **Share Your Form**: Copy the public link and share it with respondents
5. **View Responses**: Monitor responses in real-time on the dashboard
6. **Analyze Data**: Use the analytics dashboard and export CSV for deeper analysis

### Form Management

- **Edit Forms**: Modify form details, questions, and settings
- **Toggle Status**: Activate/deactivate forms to control response collection
- **Delete Forms**: Remove forms and all associated data
- **Duplicate Forms**: Create copies of existing forms (feature can be added)

### Response Analysis

- **Dashboard Analytics**: View key metrics and trends
- **Response Details**: See individual responses with all answers
- **CSV Export**: Download response data for external analysis
- **Performance Insights**: Identify top-performing forms

## 🔒 Security Features

- **Row Level Security (RLS)**: Database-level security policies
- **Authentication**: Secure user authentication via Supabase Auth
- **Anonymous Responses**: Public can submit responses without accounts
- **Data Isolation**: Users can only access their own forms and responses
- **Input Validation**: Client and server-side validation

## 🚀 Deployment

### Deploy to Netlify

1. Build the project:
```bash
npm run build
```

2. Deploy the `dist` folder to Netlify

3. Add environment variables in Netlify dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

4. Update Supabase settings:
   - Add your production URL to **Site URL** and **Redirect URLs**

### Deploy to Vercel

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

## 🛠️ Development

### Project Structure

```
src/
├── components/          # Reusable UI components
│   └── ui/             # Radix UI components
├── contexts/           # React Context providers
├── lib/               # Utility functions and configurations
├── pages/             # Main application pages
└── main.tsx           # Application entry point
```

### Key Files

- `src/lib/supabase.ts` - Supabase client configuration
- `src/contexts/AuthContext.tsx` - Authentication context
- `src/pages/Dashboard.tsx` - Main dashboard with analytics
- `src/pages/PublicForm.tsx` - Public form submission page
- `src/pages/Forms.tsx` - Form management page

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## 🐛 Troubleshooting

### Common Issues

1. **Supabase Connection Error**
   - Verify environment variables are correct
   - Check if Supabase project is active
   - Ensure RLS policies are properly set

2. **Form Submission Fails**
   - Check if form is active
   - Verify RLS policies for responses and answers tables
   - Check browser console for detailed errors

3. **Authentication Issues**
   - Verify redirect URLs in Supabase settings
   - Check if email confirmation is required
   - Ensure Site URL matches your domain

### Getting Help

- Check the browser console for error messages
- Review Supabase logs in the dashboard
- Verify database schema matches the provided SQL
- Ensure all environment variables are set correctly

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section above
- Review Supabase documentation for backend-related issues

---

**Built with ❤️ using React, TypeScript, and Supabase**
