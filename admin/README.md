# Admin Utilities

This folder contains administrative scripts for managing the e-commerce platform.

## Account Management Tool

### Usage

```bash
node admin/resetPassword.js
```

### Interactive Prompts

The script will ask you for:

1. **Role**: Choose from `1/2/3` or `user/seller/rider`
2. **Email**: The current email address of the account
3. **New Password**: The new password to set (minimum 6 characters)
4. **Change Email**: Option to change the email address (yes/no)
   - If yes, enter the new email address
   - The script validates that the new email isn't already in use
5. **Confirmation**: Type `yes` to confirm all changes

### Example Session

```
🔌 Connecting to database...
✅ Connected to MongoDB

Available roles:
1. user
2. seller
3. rider

Enter role (1/2/3 or user/seller/rider): 1
Enter email address: john@example.com
Enter new password: newpass123

🔍 Looking for user with email: john@example.com...
✅ Found user: John Doe
📧 Current Email: john@example.com

Do you want to change the email address? (yes/no): yes
Enter new email address: newemail@example.com

⚠️  Are you sure you want to:
   - Reset password for john@example.com
   - Change email to newemail@example.com
(yes/no): yes

🔐 Hashing new password...
✅ Update successful!

📧 Email: newemail@example.com
🔑 New Password: newpass123
👤 Role: user

✉️  Email was changed from: john@example.com
                         to: newemail@example.com

⚠️  Please save these credentials securely and delete this terminal output.

🔌 Database connection closed
```

### Security Notes

- ⚠️ This script has direct database access - use with caution
- ✅ Passwords are hashed with bcrypt before storage
- ✅ Email uniqueness is validated before changes
- 🔒 Requires MongoDB connection (uses `.env` for credentials)
- 🗑️ Clear terminal output after noting credentials
- 👥 Only use for legitimate admin/support purposes

### Requirements

- Node.js installed
- `.env` file with `MONGO_DB_URI` configured
- `bcrypt` and `mongoose` packages installed (already in main project dependencies)
