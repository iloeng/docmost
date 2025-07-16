# MFA (Multi-Factor Authentication) Implementation

This directory contains the enterprise edition MFA implementation for Docmost.

## Structure

```
mfa/
├── components/           # UI components for MFA
│   ├── mfa-challenge.tsx      # Login MFA challenge page
│   ├── mfa-settings.tsx       # Main MFA settings component
│   ├── mfa-setup-modal.tsx    # Modal for setting up MFA
│   ├── mfa-disable-modal.tsx  # Modal for disabling MFA
│   └── mfa-backup-codes-modal.tsx  # Modal for managing backup codes
├── services/            # API service functions
│   ├── mfa-service.ts        # MFA management APIs
│   └── mfa-auth-service.ts   # MFA authentication APIs
├── queries/             # React Query hooks
│   └── mfa-query.ts         # Query and mutation hooks
├── hooks/               # Custom React hooks
│   └── use-redirect-if-no-mfa-token.ts
├── types/               # TypeScript type definitions
│   └── mfa.types.ts
└── pages/               # Page components
    └── mfa-challenge-page.tsx

```

## Features

- **TOTP Authentication**: Time-based One-Time Password using authenticator apps
- **Backup Codes**: 8-character single-use recovery codes
- **QR Code Setup**: Easy setup with QR code scanning
- **Manual Entry**: Alternative setup method with secret key
- **Secure Flow**: JWT-based MFA transfer tokens (5-minute expiry)

## Usage

### 1. MFA Settings in User Profile

The MFA settings are integrated into the user profile page. Users can:
- Enable MFA with QR code or manual entry
- View and regenerate backup codes
- Disable MFA with password confirmation

### 2. MFA Challenge During Login

When MFA is enabled, users will:
1. Enter email and password
2. Be redirected to MFA challenge page
3. Enter 6-digit code from authenticator app
4. Option to trust device for 30 days

### 3. Integration Points

- **Account Settings**: MFA section is added via `AccountMfaSection` component
- **Login Flow**: Modified in `use-auth.ts` to handle MFA response
- **Routing**: MFA challenge route added to `App.tsx`

## Security Considerations

1. **MFA Transfer Token**: Temporary token stored in sessionStorage
2. **Encryption**: TOTP secrets are encrypted at rest (backend)
3. **Backup Codes**: Hashed with bcrypt (backend)
4. **Password Verification**: Required for disabling MFA

## Development

### Adding New MFA Methods

To add new MFA methods (e.g., SMS, Email):

1. Update `mfa.types.ts` to include new method types
2. Create new setup components for the method
3. Update `mfa-setup-modal.tsx` to support method selection
4. Implement backend support for the new method

### Testing

1. Enable MFA in development:
   - Navigate to Settings > My Profile
   - Find "Two-Factor Authentication" section
   - Click "Set up two-factor authentication"

2. Test login flow:
   - Log out after enabling MFA
   - Log in with email/password
   - Verify MFA challenge appears
   - Test with valid/invalid codes

3. Test backup codes:
   - Generate backup codes
   - Use a backup code during login
   - Verify it's consumed (can't be reused)