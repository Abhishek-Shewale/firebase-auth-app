# Firebase Authentication App

A modern Next.js application with Firebase authentication supporting both email and phone verification, with user type selection for Consultants, Bookstores, and Freelancers.

## Features

- 🔐 **Dual Authentication**: Email and phone number verification with custom OTP system
- 👥 **User Types**: Consultant, Bookstore, Freelance account types
- 🎨 **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- 📱 **Responsive Design**: Mobile-first approach
- 🔒 **Secure**: Firebase Authentication with proper security practices
- 🎯 **Type Safety**: Full TypeScript support (converted to JSX as requested)
- 📧 **Email Verification**: Custom email OTP system with nodemailer
- 📱 **Phone Verification**: Custom SMS OTP system (development mode shows codes in console)

## Setup Instructions

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Email/Password
   - Enable Phone authentication
4. Enable Firestore Database:
   - Go to Firestore Database
   - Create database in production mode
5. Get your Firebase config:
   - Go to Project Settings > General
   - Scroll down to "Your apps" section
   - Copy the Firebase config object

### 2. Firebase Security Rules

**IMPORTANT**: You need to update your Firestore security rules to allow the application to work properly.

1. Go to Firestore Database > Rules
2. Replace the existing rules with the content from `firestore.rules` file
3. Click "Publish"

The rules allow read/write access to:
- `emailVerifications` collection (for OTP storage)
- `users` collection (for user profiles)
- `usersByEmail` collection (for email-based lookup)

### 3. Environment Variables

1. Create a `.env.local` file in the root directory
2. Add the following variables:

```env
# Email Configuration (for verification emails)
# Option 1: Gmail (recommended for development)
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM_NAME=Your App Name
EMAIL_FROM_ADDRESS=your_gmail@gmail.com

# Option 2: Custom SMTP
# SMTP_HOST=smtp.your-provider.com
# SMTP_PORT=587
# SMTP_USER=your_smtp_username
# SMTP_PASS=your_smtp_password
# EMAIL_FROM_NAME=Your App Name
# EMAIL_FROM_ADDRESS=noreply@yourdomain.com

# Phone Verification (for production)
# In development mode, verification codes are logged to console
# For production, integrate with SMS services like Twilio, AWS SNS, etc.
# TWILIO_ACCOUNT_SID=your_twilio_account_sid
# TWILIO_AUTH_TOKEN=your_twilio_auth_token
# TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

**Note**: For Gmail, you need to use an App Password, not your regular password. To create one:
1. Go to your Google Account settings
2. Enable 2-factor authentication
3. Generate an App Password for "Mail"

### 4. Installation

```bash
npm install
npm run dev
```

## Project Structure

```
├── app/
│   ├── layout.jsx          # Root layout with AuthProvider
│   ├── page.jsx            # Main page with auth routing
│   └── globals.css         # Global styles with design tokens
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── auth-method-selector.jsx
│   ├── dashboard.jsx
│   ├── email-auth-form.jsx
│   ├── email-verification.jsx
│   ├── login-page.jsx
│   ├── phone-auth-form.jsx
│   ├── phone-verification.jsx
│   └── user-type-selector.jsx
├── contexts/
│   └── auth-context.js     # Firebase auth context
├── lib/
│   └── firebase.js         # Firebase configuration
├── firestore.rules         # Firestore security rules
└── package.json
```

## Usage

1. **User Type Selection**: Choose between Consultant, Bookstore, or Freelance
2. **Authentication Method**: Select email or phone verification
3. **Email Auth**: Standard email/password with custom OTP verification
4. **Phone Auth**: Phone number with custom SMS OTP verification
5. **Verification**: Enter 6-digit codes sent via email/SMS
6. **Profile**: View profile information and account details

### Phone Verification Notes:
- In development mode, verification codes are logged to the console
- For production, integrate with SMS services like Twilio or AWS SNS
- Phone users don't require Firebase Auth accounts (custom UID system)

## Security Features

- Firebase Authentication integration for email users
- Custom OTP verification system for both email and phone
- User data stored in Firestore with proper structure
- Environment variable protection for sensitive config
- Duplicate user prevention
- Proper cleanup on failed operations
- Rate limiting on verification attempts
- Expiring verification codes (15 minutes)

## Troubleshooting

### Common Issues:

1. **"Failed to send verification email"**
   - Check your email configuration in `.env.local`
   - Ensure Gmail App Password is correct
   - Verify Firebase security rules are updated

2. **"Database access denied"**
   - Update Firestore security rules using `firestore.rules`
   - Ensure the rules are published in Firebase Console

3. **Duplicate users created**
   - The app now prevents duplicate user creation
   - Check if users exist before creating new ones

4. **Users in Firestore but not in Auth**
   - The app now properly syncs Auth and Firestore
   - Failed operations are cleaned up automatically

5. **Phone verification codes not received**
   - Check the console logs for verification codes in development
   - Ensure phone number includes country code (e.g., +1 for US)
   - For production, configure SMS service credentials

6. **Phone verification fails**
   - Verify Firestore security rules include `phoneVerifications` and `usersByPhone` collections
   - Check that the phone number format is correct

## Customization

The app uses semantic design tokens defined in `globals.css`. You can customize:
- Colors: Modify CSS custom properties in `:root`
- Typography: Update font variables
- Components: All components use shadcn/ui for consistency

## Deployment

1. Build the application: `npm run build`
2. Deploy to Vercel, Netlify, or your preferred platform
3. Set environment variables in your deployment platform
4. Update Firebase authorized domains in Firebase Console
5. Ensure Firestore security rules are published

## Support

For issues or questions, please check the Firebase documentation or create an issue in the repository.
