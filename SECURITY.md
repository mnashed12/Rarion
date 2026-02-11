# 🔐 Security Setup Instructions

## Password Protection

This application has two layers of password protection:

1. **App-level password**: Required to access the entire application
2. **Inventory password**: Additional password required to view the inventory page

### Setting Up Passwords

1. Create a `.env` file in the `frontend/` directory (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

2. Set your passwords in the `.env` file:
   ```
   VITE_APP_PASSWORD=YourStrongPassword123
   VITE_INVENTORY_PASSWORD=YourInventoryPassword456
   ```

3. **IMPORTANT**: Never commit the `.env` file to Git. It's already in `.gitignore`.

### How It Works

- Passwords are stored in environment variables (not in the codebase)
- Authentication state is saved in browser localStorage
- Users must enter the app password to access the site
- Users must enter the inventory password to view the inventory page
- The inventory password prompt includes a cancel button to go back to the home page

### Deployment

When deploying to production:
- Set the environment variables in your hosting platform (Vercel, Netlify, etc.)
- Never include passwords in your repository
- The `.env.example` file shows the required variables without exposing actual passwords

### Security Notes

- This is a client-side password protection suitable for basic privacy
- For high-security needs, implement server-side authentication
- Passwords are checked against environment variables
- Authentication persists in browser until logout or localStorage is cleared
