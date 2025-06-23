# MailFlow - Email Marketing Platform

A modern, full-featured email marketing platform built with React, TypeScript, and Supabase. MailFlow provides everything you need to manage subscribers, create beautiful email templates, run campaigns, and track performance analytics.

## ✨ Features

### 📧 Email Marketing
- **Subscriber Management**: Import, export, and organize your email subscribers
- **Group Management**: Segment subscribers into targeted groups
- **Email Templates**: Create beautiful, responsive email templates with a visual editor
- **Campaign Management**: Schedule and send email campaigns to specific groups
- **Analytics Dashboard**: Track open rates, click rates, and campaign performance

### 📱 WhatsApp Marketing
- **WhatsApp Templates**: Create and manage WhatsApp message templates
- **WhatsApp Campaigns**: Send bulk WhatsApp messages via MSG91 integration
- **Opt-in Management**: Handle WhatsApp subscriber consent and preferences

### 📊 Analytics & Reporting
- **Real-time Analytics**: Track campaign performance in real-time
- **Engagement Metrics**: Monitor open rates, click rates, and subscriber engagement
- **Performance Insights**: AI-powered recommendations to improve campaigns
- **Export Reports**: Download detailed analytics reports

### 🎨 Modern UI/UX
- **Beautiful Design**: Clean, modern interface with smooth animations
- **Responsive Layout**: Works perfectly on desktop, tablet, and mobile
- **Dark Mode Support**: Toggle between light and dark themes
- **Accessibility**: Built with accessibility best practices

## 🚀 Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time)
- **Charts**: Recharts for beautiful data visualizations
- **Icons**: Lucide React for consistent iconography
- **Routing**: React Router DOM
- **State Management**: React Context API
- **Notifications**: React Hot Toast
- **Build Tool**: Vite

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mailflow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your environment variables:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_MSG91_API_KEY=your_msg91_api_key
   VITE_MSG91_WHATSAPP_NUMBER=your_whatsapp_number
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## 🗄️ Database Setup

The application uses Supabase as the backend. You'll need to set up the following tables:

### Core Tables
- `profiles` - User profiles and authentication
- `subscribers` - Email and WhatsApp subscribers
- `user_groups` - Subscriber groups/segments
- `group_subscribers` - Many-to-many relationship between groups and subscribers

### Template Tables
- `email_templates` - Email template storage
- `whatsapp_templates` - WhatsApp message templates

### Campaign Tables
- `campaigns` - Campaign information and status
- `campaign_groups` - Campaign target groups

### Row Level Security (RLS)
All tables have RLS enabled with appropriate policies for user data isolation.

## 🔧 Configuration

### Supabase Setup
1. Create a new Supabase project
2. Run the database migrations (SQL files will be provided)
3. Configure authentication settings
4. Set up RLS policies

### MSG91 Integration
1. Sign up for MSG91 account
2. Get your API key and WhatsApp business number
3. Configure the integration in environment variables

## 🎯 Usage

### Managing Subscribers
1. **Add Subscribers**: Import CSV files or add manually
2. **Create Groups**: Organize subscribers into targeted segments
3. **Manage Preferences**: Handle opt-ins and unsubscribes

### Creating Campaigns
1. **Choose Template**: Select from pre-built or custom templates
2. **Select Audience**: Choose subscriber groups to target
3. **Schedule**: Send immediately or schedule for later
4. **Track Performance**: Monitor real-time analytics

### Analytics
- **Dashboard Overview**: Key metrics and performance indicators
- **Campaign Analytics**: Detailed campaign performance data
- **Subscriber Insights**: Engagement trends and behavior analysis
- **Export Reports**: Download data for external analysis

## 🔒 Security Features

- **Authentication**: Secure user authentication via Supabase Auth
- **Row Level Security**: Database-level security for user data isolation
- **Input Validation**: Comprehensive input validation and sanitization
- **CORS Protection**: Proper CORS configuration for API security

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Netlify
1. Connect your repository to Netlify
2. Set environment variables in Netlify dashboard
3. Deploy with automatic builds on push

### Deploy to Vercel
1. Connect your repository to Vercel
2. Configure environment variables
3. Deploy with zero configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@mailflow.com or join our Discord community.

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) for the amazing backend platform
- [Tailwind CSS](https://tailwindcss.com) for the utility-first CSS framework
- [Lucide](https://lucide.dev) for the beautiful icons
- [Recharts](https://recharts.org) for the charting library

---

Built with ❤️ by the MailFlow team