/**
 * Admin Account Management Utility
 * Usage: node admin/resetPassword.js
 * 
 * This script allows admins to:
 * - Reset user passwords by role and email
 * - Change email addresses
 */

const readline = require('readline');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const path = require('path');

// Load .env from parent directory
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Import models
const User = require('../models/user');
const Seller = require('../models/seller');
const Rider = require('../models/rider');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const resetPassword = async () => {
    try {
        // Connect to database
        console.log('\n🔌 Connecting to database...');
        await mongoose.connect(process.env.MONGO_DB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get role
        console.log('Available roles:');
        console.log('1. user');
        console.log('2. seller');
        console.log('3. rider\n');
        
        const roleInput = await question('Enter role (1/2/3 or user/seller/rider): ');
        const roleLookup = {
            '1': 'user',
            '2': 'seller',
            '3': 'rider',
            'user': 'user',
            'seller': 'seller',
            'rider': 'rider'
        };
        
        const role = roleLookup[roleInput.toLowerCase().trim()];
        
        if (!role) {
            console.error('❌ Invalid role. Enter 1/2/3 or user/seller/rider');
            process.exit(1);
        }

        // Get email
        const email = await question('Enter email address: ');
        if (!email || !email.includes('@')) {
            console.error('❌ Invalid email address');
            process.exit(1);
        }

        // Get new password
        const newPassword = await question('Enter new password: ');
        if (!newPassword || newPassword.length < 6) {
            console.error('❌ Password must be at least 6 characters');
            process.exit(1);
        }

        // Select correct model
        let Model;
        if (role === 'user') Model = User;
        else if (role === 'seller') Model = Seller;
        else if (role === 'rider') Model = Rider;

        // Find user
        console.log(`\n🔍 Looking for ${role} with email: ${email}...`);
        const user = await Model.findOne({ email });
        
        if (!user) {
            console.error(`❌ No ${role} found with email: ${email}`);
            process.exit(1);
        }

        console.log(`✅ Found ${role}: ${user.name || user.username || 'N/A'}`);
        console.log(`📧 Current Email: ${user.email}\n`);
        
        // Ask if want to change email
        const changeEmail = await question('Do you want to change the email address? (yes/no): ');
        let newEmail = null;
        
        if (changeEmail.toLowerCase() === 'yes') {
            newEmail = await question('Enter new email address: ');
            if (!newEmail || !newEmail.includes('@')) {
                console.error('❌ Invalid email address');
                process.exit(1);
            }
            
            // Check if new email already exists
            const existingUser = await Model.findOne({ email: newEmail });
            if (existingUser && existingUser._id.toString() !== user._id.toString()) {
                console.error(`❌ Email ${newEmail} is already in use by another ${role}`);
                process.exit(1);
            }
        }
        
        // Confirm
        let confirmMessage = `\n⚠️  Are you sure you want to reset password for ${email}?`;
        if (newEmail) {
            confirmMessage = `\n⚠️  Are you sure you want to:\n   - Reset password for ${email}\n   - Change email to ${newEmail}`;
        }
        const confirm = await question(`${confirmMessage}\n(yes/no): `);
        if (confirm.toLowerCase() !== 'yes') {
            console.log('❌ Operation cancelled');
            process.exit(0);
        }

        // Hash new password
        console.log('\n🔐 Hashing new password...');
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update directly to bypass pre-save hooks (which would double-hash)
        const updateData = { password: hashedPassword };
        if (newEmail) {
            updateData.email = newEmail;
        }
        
        await Model.updateOne(
            { _id: user._id },
            { $set: updateData }
        );

        console.log('✅ Update successful!\n');
        console.log('📧 Email:', newEmail || email);
        console.log('🔑 New Password:', newPassword);
        console.log('👤 Role:', role);
        if (newEmail) {
            console.log('\n✉️  Email was changed from:', email);
            console.log('                         to:', newEmail);
        }
        console.log('\n⚠️  Please save these credentials securely and delete this terminal output.\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        rl.close();
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
};

// Run the script
resetPassword();
