# LastCall iOS App Store Submission - Complete Implementation Plan

## Executive Summary

**Goal:** Make LastCall app compliant with Apple App Store requirements and submit for approval.

**Critical Blocker:** Backend deployment (currently localhost) must be completed before production build.

**Timeline:** 35-45 hours of work over 2-3 weeks (includes Apple approval waiting period)

**Current Status:**
- ✅ App fully functional with 20+ screens
- ✅ All features implemented and tested
- ✅ Code cleanup completed (debug logs removed, API paths fixed)
- ❌ Backend on localhost (needs production deployment)
- ❌ No legal documents (Privacy Policy, Terms of Service)
- ❌ Missing iOS app store assets and metadata

---

## Phase 1: Legal Documents & GitHub Pages (3-4 hours)

### Overview
Create legally compliant Privacy Policy and Terms of Service, host on GitHub Pages (free).

### Tasks

#### 1.1 Create Privacy Policy

**File:** `docs/privacy-policy.html` (in your GitHub repo)

**Full Template:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LastCall - Privacy Policy</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 0 20px;
            line-height: 1.6;
            color: #333;
        }
        h1 {
            color: #333;
            border-bottom: 2px solid #007AFF;
            padding-bottom: 10px;
        }
        h2 {
            color: #555;
            margin-top: 30px;
        }
        h3 {
            color: #666;
            margin-top: 20px;
        }
        .effective-date {
            color: #666;
            font-style: italic;
        }
        ul {
            margin: 10px 0;
        }
        li {
            margin: 5px 0;
        }
        strong {
            color: #000;
        }
    </style>
</head>
<body>
    <h1>Privacy Policy for LastCall</h1>
    <p class="effective-date">Effective Date: [INSERT DATE - e.g., January 1, 2025]</p>
    <p class="effective-date">Last Updated: [INSERT DATE]</p>

    <h2>1. Introduction</h2>
    <p>LastCall ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application for employee scheduling and shift management.</p>

    <h2>2. Information We Collect</h2>

    <h3>2.1 Personal Information</h3>
    <p>We collect the following personal information when you create an account:</p>
    <ul>
        <li><strong>Email Address:</strong> Used for account creation, authentication, and important notifications about schedule changes</li>
        <li><strong>Phone Number:</strong> Used for account identification and optional contact by organization managers</li>
        <li><strong>First and Last Name:</strong> Used for identification within organizations and on schedules</li>
        <li><strong>Password:</strong> Securely hashed and stored via Supabase authentication service</li>
    </ul>

    <h3>2.2 Usage Data</h3>
    <ul>
        <li><strong>Schedule Data:</strong> Work schedules, shifts, and availability preferences you create or are assigned to</li>
        <li><strong>Organization Membership:</strong> Information about organizations you join or create, your role within them</li>
        <li><strong>Device Information:</strong> Push notification tokens (Expo Push Token) for sending schedule update notifications</li>
        <li><strong>Availability Preferences:</strong> Your general availability and organization-specific availability settings</li>
    </ul>

    <h3>2.3 Automatically Collected Information</h3>
    <ul>
        <li><strong>Log Data:</strong> Error logs and performance metrics for app improvement</li>
        <li><strong>Usage Patterns:</strong> How you interact with the app (anonymized where possible)</li>
    </ul>

    <h2>3. How We Use Your Information</h2>
    <p>We use collected information for the following purposes:</p>
    <ul>
        <li><strong>Account Management:</strong> Create and authenticate your account via Supabase</li>
        <li><strong>Schedule Coordination:</strong> Enable managers to create schedules and assign shifts</li>
        <li><strong>Notifications:</strong> Send push notifications when schedules are published (when enabled by you)</li>
        <li><strong>Email Communications:</strong> Send schedule updates via email (when enabled by you)</li>
        <li><strong>Team Coordination:</strong> Display your information to organization managers and colleagues for scheduling purposes</li>
        <li><strong>Service Improvement:</strong> Analyze usage patterns to improve app functionality and user experience</li>
        <li><strong>Support:</strong> Respond to your questions and provide customer support</li>
    </ul>

    <h2>4. Third-Party Services</h2>

    <h3>4.1 Supabase (Authentication & Database)</h3>
    <p>We use Supabase for authentication and data storage. Your data is stored securely on Supabase's cloud infrastructure with industry-standard encryption. Supabase complies with GDPR and SOC 2 Type II standards.</p>
    <p>Review Supabase's privacy policy: <a href="https://supabase.com/privacy">https://supabase.com/privacy</a></p>

    <h3>4.2 Expo Push Notifications</h3>
    <p>We use Expo's push notification service to send schedule updates. Your push token is stored securely and used only for sending notifications you've enabled. Expo does not use your data for advertising.</p>
    <p>Review Expo's privacy policy: <a href="https://expo.dev/privacy">https://expo.dev/privacy</a></p>

    <h3>4.3 No Analytics or Tracking</h3>
    <p>We do not use third-party analytics services, advertising networks, or tracking services. Your data is used solely for the functionality described in this policy.</p>

    <h2>5. Privacy Controls</h2>
    <p>You have granular control over your data and privacy:</p>
    <ul>
        <li><strong>Email Visibility:</strong> Toggle whether organization managers can see your email address (default: visible to managers for scheduling communication)</li>
        <li><strong>Phone Visibility:</strong> Toggle whether organization managers can see your phone number (default: hidden from managers)</li>
        <li><strong>Push Notifications:</strong> Enable or disable push notifications for schedule updates in app settings (default: enabled)</li>
        <li><strong>Email Notifications:</strong> Enable or disable email notifications for schedules (default: disabled)</li>
    </ul>
    <p><em>Note: Organization owners and managers always have access to contact information for employees within their organization for legitimate scheduling purposes.</em></p>

    <h2>6. Data Sharing and Disclosure</h2>

    <h3>6.1 Within Your Organizations</h3>
    <p>We share your information with:</p>
    <ul>
        <li>Organization owners and managers within organizations you join (name, role, schedule data, contact info based on your privacy settings)</li>
        <li>Other employees in your organization (name, assigned shifts, availability status)</li>
    </ul>

    <h3>6.2 Service Providers</h3>
    <ul>
        <li><strong>Supabase:</strong> Database hosting and authentication</li>
        <li><strong>Expo:</strong> Push notification delivery</li>
        <li><strong>Render:</strong> Backend API hosting</li>
    </ul>

    <h3>6.3 Legal Requirements</h3>
    <p>We may disclose your information if required by law, court order, or government regulation, or to protect the rights, property, or safety of LastCall, our users, or others.</p>

    <h3>6.4 We Never Sell Your Data</h3>
    <p><strong>We never sell, rent, or trade your personal information to third parties for marketing purposes.</strong></p>

    <h2>7. Data Retention and Deletion</h2>

    <h3>7.1 Active Accounts</h3>
    <p>We retain your data as long as your account is active and for a reasonable period afterward to comply with legal obligations.</p>

    <h3>7.2 Account Deletion</h3>
    <p>When you delete your account through app settings:</p>
    <ul>
        <li>All your personal information is permanently deleted from our systems</li>
        <li>Your organization memberships are removed</li>
        <li>Your schedules, shifts, and availability data are deleted</li>
        <li>Your push notification token is removed</li>
        <li><strong>This action is permanent and cannot be undone</strong></li>
    </ul>

    <h3>7.3 Data Retention Period</h3>
    <p>After account deletion, some data may be retained in backup systems for up to 30 days before permanent deletion. Anonymized usage statistics may be retained indefinitely for app improvement.</p>

    <h2>8. Your Rights (GDPR/CCPA Compliance)</h2>
    <p>You have the following rights regarding your personal data:</p>
    <ul>
        <li><strong>Right to Access:</strong> Request a copy of all personal data we hold about you</li>
        <li><strong>Right to Rectification:</strong> Update or correct your personal information through app settings</li>
        <li><strong>Right to Erasure:</strong> Delete your account and all associated data permanently</li>
        <li><strong>Right to Data Portability:</strong> Request your data in a machine-readable format (JSON export)</li>
        <li><strong>Right to Object:</strong> Object to processing of your data for specific purposes</li>
        <li><strong>Right to Restrict Processing:</strong> Request limitation of how we process your data</li>
        <li><strong>Right to Withdraw Consent:</strong> Withdraw consent for data processing at any time</li>
    </ul>
    <p>To exercise these rights, contact us at: <strong>[YOUR EMAIL]</strong></p>

    <h2>9. Children's Privacy</h2>
    <p>LastCall is not intended for users under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately at <strong>[YOUR EMAIL]</strong> and we will delete the information promptly.</p>

    <h2>10. Security Measures</h2>
    <p>We implement industry-standard security measures to protect your data:</p>
    <ul>
        <li><strong>Encryption in Transit:</strong> All data transmitted between your device and our servers uses HTTPS/TLS encryption</li>
        <li><strong>Encryption at Rest:</strong> Database is encrypted at rest via Supabase's security infrastructure</li>
        <li><strong>Authentication:</strong> Secure JWT-based authentication via Supabase</li>
        <li><strong>Password Security:</strong> Passwords are hashed using bcrypt and never stored in plain text</li>
        <li><strong>Rate Limiting:</strong> API rate limiting to prevent abuse and brute-force attacks</li>
        <li><strong>Access Controls:</strong> Role-based access control (RBAC) for organization data</li>
    </ul>
    <p>However, no method of transmission over the internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.</p>

    <h2>11. Changes to This Policy</h2>
    <p>We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. When we make changes:</p>
    <ul>
        <li>We will update the "Last Updated" date at the top of this policy</li>
        <li>For material changes, we will notify you via email or in-app notification</li>
        <li>Your continued use of LastCall after changes constitutes acceptance of the updated policy</li>
    </ul>
    <p>We encourage you to review this policy periodically.</p>

    <h2>12. International Data Transfers</h2>
    <p>Your data may be transferred to and processed in the United States and other countries where our service providers (Supabase, Expo, Render) operate. By using LastCall, you consent to this transfer and processing.</p>
    <p>We ensure that international transfers comply with applicable data protection laws through:</p>
    <ul>
        <li>Standard contractual clauses</li>
        <li>Privacy Shield frameworks (where applicable)</li>
        <li>Ensuring service providers meet GDPR and privacy standards</li>
    </ul>

    <h2>13. California Privacy Rights (CCPA)</h2>
    <p>If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):</p>
    <ul>
        <li>Right to know what personal information is collected, used, shared, or sold</li>
        <li>Right to delete personal information</li>
        <li>Right to opt-out of sale of personal information (we don't sell your data)</li>
        <li>Right to non-discrimination for exercising CCPA rights</li>
    </ul>
    <p>To exercise these rights, contact us at: <strong>[YOUR EMAIL]</strong></p>

    <h2>14. Contact Us</h2>
    <p>For privacy-related questions, concerns, or to exercise your data rights, please contact us:</p>
    <p>
        <strong>Email:</strong> [YOUR EMAIL - e.g., privacy@lastcall.app or your personal email]<br>
        <strong>GitHub:</strong> <a href="https://github.com/FrankieSoltero/LastCall">https://github.com/FrankieSoltero/LastCall</a><br>
        <strong>Response Time:</strong> We aim to respond within 48 hours
    </p>

    <h2>15. Consent</h2>
    <p>By using LastCall, you consent to this Privacy Policy and agree to its terms. If you do not agree, please do not use the app.</p>

    <hr style="margin: 40px 0; border: none; border-top: 1px solid #ddd;">

    <p style="text-align: center; color: #999; font-size: 14px;">
        © 2025 LastCall. All rights reserved.
    </p>
</body>
</html>
```

**Action Items:**
1. Replace `[INSERT DATE]` with current date
2. Replace `[YOUR EMAIL]` with your support email
3. Save to `docs/privacy-policy.html` in your repo

---

#### 1.2 Create Terms of Service

**File:** `docs/terms-of-service.html` (in your GitHub repo)

**Full Template:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LastCall - Terms of Service</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 0 20px;
            line-height: 1.6;
            color: #333;
        }
        h1 {
            color: #333;
            border-bottom: 2px solid #007AFF;
            padding-bottom: 10px;
        }
        h2 {
            color: #555;
            margin-top: 30px;
        }
        h3 {
            color: #666;
            margin-top: 20px;
        }
        .effective-date {
            color: #666;
            font-style: italic;
        }
        ul {
            margin: 10px 0;
        }
        li {
            margin: 5px 0;
        }
        strong {
            color: #000;
        }
        .warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <h1>Terms of Service for LastCall</h1>
    <p class="effective-date">Effective Date: [INSERT DATE]</p>
    <p class="effective-date">Last Updated: [INSERT DATE]</p>

    <h2>1. Acceptance of Terms</h2>
    <p>By accessing or using the LastCall mobile application ("Service," "App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not access or use the App.</p>
    <p>These Terms constitute a legally binding agreement between you and LastCall ("we," "us," or "our").</p>

    <h2>2. Description of Service</h2>
    <p>LastCall is an employee scheduling and shift management application that provides:</p>
    <ul>
        <li>Creation and management of work organizations</li>
        <li>Employee shift scheduling with reusable templates</li>
        <li>Availability tracking and management for employees</li>
        <li>Push notifications for schedule updates and changes</li>
        <li>Role-based access control (Owner, Admin, Employee)</li>
        <li>Personal schedule viewing and management</li>
        <li>Privacy controls for contact information visibility</li>
    </ul>

    <h2>3. Eligibility and Account Registration</h2>

    <h3>3.1 Age Requirement</h3>
    <p>To use LastCall, you must:</p>
    <ul>
        <li>Be at least 13 years of age</li>
        <li>Have the legal capacity to enter into a binding agreement</li>
        <li>Not be prohibited from using the Service under applicable laws</li>
    </ul>

    <h3>3.2 Account Creation</h3>
    <p>When creating an account, you agree to:</p>
    <ul>
        <li>Provide accurate, current, and complete information</li>
        <li>Maintain and promptly update your account information</li>
        <li>Maintain the security and confidentiality of your password</li>
        <li>Notify us immediately of any unauthorized access to your account</li>
        <li>Accept responsibility for all activities that occur under your account</li>
    </ul>

    <h3>3.3 Account Security</h3>
    <p>You are solely responsible for maintaining the confidentiality of your account credentials. LastCall will not be liable for any loss or damage arising from your failure to protect your account.</p>

    <h2>4. User Responsibilities and Conduct</h2>

    <h3>4.1 Acceptable Use</h3>
    <p>You agree to:</p>
    <ul>
        <li>Use the Service only for lawful purposes and in accordance with these Terms</li>
        <li>Provide truthful and accurate information when creating schedules and submitting availability</li>
        <li>Respect the privacy and rights of other users</li>
        <li>Comply with all applicable local, state, national, and international laws</li>
    </ul>

    <h3>4.2 Prohibited Conduct</h3>
    <p>You agree NOT to:</p>
    <ul>
        <li>Impersonate any person or entity, or falsely state or misrepresent your affiliation with a person or entity</li>
        <li>Use the Service to harass, abuse, threaten, or intimidate other users</li>
        <li>Interfere with or disrupt the Service or servers/networks connected to the Service</li>
        <li>Attempt to gain unauthorized access to any portion of the Service, other accounts, computer systems, or networks</li>
        <li>Use any automated means (bots, scrapers, etc.) to access the Service without our permission</li>
        <li>Upload, transmit, or distribute any viruses, malware, or malicious code</li>
        <li>Violate any applicable laws or regulations</li>
        <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
        <li>Use the Service for any commercial purpose without our written consent</li>
    </ul>

    <h2>5. Organization Owner and Manager Responsibilities</h2>

    <h3>5.1 Organization Creation</h3>
    <p>If you create an organization, you become the Organization Owner and are responsible for:</p>
    <ul>
        <li>Managing employee access, permissions, and roles within your organization</li>
        <li>Ensuring all schedules comply with applicable labor laws and regulations</li>
        <li>Handling employee data in accordance with applicable privacy laws (GDPR, CCPA, etc.)</li>
        <li>Resolving disputes within your organization</li>
        <li>Ensuring proper use of the Service by members of your organization</li>
    </ul>

    <h3>5.2 Legal Compliance</h3>
    <div class="warning">
        <strong>Important:</strong> LastCall is a scheduling tool, not a legal contract or compliance system. Organization owners and managers are responsible for ensuring compliance with all applicable employment laws, including but not limited to:
        <ul>
            <li>Minimum wage and overtime requirements</li>
            <li>Break and rest period requirements</li>
            <li>Maximum working hours regulations</li>
            <li>Child labor laws</li>
            <li>Equal employment opportunity laws</li>
        </ul>
    </div>

    <h3>5.3 Data Protection</h3>
    <p>Organization owners must:</p>
    <ul>
        <li>Have a lawful basis for processing employee data</li>
        <li>Obtain necessary consents from employees</li>
        <li>Comply with data protection laws (GDPR, CCPA, etc.)</li>
        <li>Respect employee privacy settings within the app</li>
    </ul>

    <h2>6. Intellectual Property Rights</h2>

    <h3>6.1 Our Intellectual Property</h3>
    <p>LastCall and its original content, features, functionality, design, and source code are owned by [Your Name/Company] and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.</p>

    <h3>6.2 Your Content</h3>
    <p>You retain ownership of data you create in the Service, including:</p>
    <ul>
        <li>Schedules and shifts</li>
        <li>Availability preferences</li>
        <li>Organization information</li>
    </ul>
    <p>By using the Service, you grant us a limited license to store, process, and display your content solely for the purpose of providing the Service to you.</p>

    <h3>6.3 Feedback</h3>
    <p>If you provide feedback, suggestions, or ideas about the Service, you grant us the right to use such feedback without compensation or obligation to you.</p>

    <h2>7. Service Availability and Modifications</h2>

    <h3>7.1 Service Availability</h3>
    <p>We strive to provide reliable service but do not guarantee:</p>
    <ul>
        <li>Uninterrupted or error-free operation of the Service</li>
        <li>That defects will be corrected promptly</li>
        <li>That the Service is free from viruses or other harmful components</li>
        <li>That data backup or storage will be maintained indefinitely</li>
    </ul>

    <h3>7.2 Maintenance and Downtime</h3>
    <p>We may suspend or terminate the Service temporarily for:</p>
    <ul>
        <li>Scheduled maintenance and updates</li>
        <li>Emergency repairs or security patches</li>
        <li>Technical issues or server problems</li>
    </ul>
    <p>We will make reasonable efforts to provide advance notice of scheduled maintenance.</p>

    <h3>7.3 Service Modifications</h3>
    <p>We reserve the right to:</p>
    <ul>
        <li>Modify, suspend, or discontinue any part of the Service at any time</li>
        <li>Change features, functionality, or availability</li>
        <li>Update the app through app store updates</li>
    </ul>
    <p>We will provide reasonable notice for material changes that negatively affect users.</p>

    <h2>8. Disclaimer of Warranties</h2>
    <p><strong>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.</strong></p>
    <p>To the maximum extent permitted by law, we disclaim all warranties, including but not limited to:</p>
    <ul>
        <li>Implied warranties of merchantability</li>
        <li>Fitness for a particular purpose</li>
        <li>Non-infringement</li>
        <li>Accuracy, reliability, or completeness of content</li>
        <li>Security or freedom from viruses</li>
    </ul>

    <h2>9. Limitation of Liability</h2>
    <p><strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW, [YOUR NAME/COMPANY] SHALL NOT BE LIABLE FOR:</strong></p>
    <ul>
        <li>Any indirect, incidental, special, consequential, or punitive damages</li>
        <li>Loss of profits, revenue, data, or business opportunities</li>
        <li>Damages arising from scheduling errors, missed shifts, or scheduling conflicts</li>
        <li>Damages from unauthorized access to or alteration of your data</li>
        <li>Damages from interruption or termination of the Service</li>
        <li>Damages from acts or omissions of third-party service providers</li>
    </ul>
    <p><strong>OUR TOTAL LIABILITY SHALL NOT EXCEED $100 USD OR THE AMOUNT YOU PAID US IN THE PAST 12 MONTHS, WHICHEVER IS GREATER.</strong></p>
    <p>Some jurisdictions do not allow limitation of liability, so these limitations may not apply to you.</p>

    <h2>10. Indemnification</h2>
    <p>You agree to indemnify, defend, and hold harmless LastCall, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:</p>
    <ul>
        <li>Your use or misuse of the Service</li>
        <li>Your violation of these Terms</li>
        <li>Your violation of any rights of another party</li>
        <li>Your violation of applicable laws or regulations</li>
        <li>Content you submit to the Service</li>
    </ul>

    <h2>11. Account Termination</h2>

    <h3>11.1 Termination by You</h3>
    <p>You may delete your account at any time through the app settings. Upon deletion:</p>
    <ul>
        <li>All your personal data will be permanently deleted</li>
        <li>You will lose access to all organizations you are a member of</li>
        <li>This action is permanent and cannot be undone</li>
    </ul>

    <h3>11.2 Termination by Us</h3>
    <p>We reserve the right to suspend or terminate your account immediately, without prior notice or liability, if you:</p>
    <ul>
        <li>Violate these Terms of Service</li>
        <li>Engage in fraudulent, illegal, or harmful activities</li>
        <li>Abuse, harass, or threaten other users</li>
        <li>Attempt to compromise the security or integrity of the Service</li>
        <li>Use the Service in a way that could damage our reputation or business</li>
    </ul>

    <h3>11.3 Effect of Termination</h3>
    <p>Upon termination:</p>
    <ul>
        <li>Your right to use the Service immediately ceases</li>
        <li>All provisions of these Terms which should survive termination shall survive (including liability limitations, indemnification, and dispute resolution)</li>
    </ul>

    <h2>12. Pricing and Payment</h2>
    <p>LastCall is currently provided free of charge. We reserve the right to:</p>
    <ul>
        <li>Introduce paid features or subscription plans in the future</li>
        <li>Provide advance notice before implementing any charges</li>
        <li>Grandfather existing users under favorable terms (at our discretion)</li>
    </ul>
    <p>If pricing is introduced, you will have the option to accept the new terms or discontinue use of the Service.</p>

    <h2>13. Modifications to Terms</h2>
    <p>We reserve the right to modify these Terms at any time. When we make changes:</p>
    <ul>
        <li>We will update the "Last Updated" date at the top</li>
        <li>For material changes, we will notify you via email or in-app notification at least 30 days before the changes take effect</li>
        <li>Your continued use of the Service after changes constitutes acceptance of the new Terms</li>
        <li>If you do not agree to the modified Terms, you must stop using the Service</li>
    </ul>

    <h2>14. Governing Law and Jurisdiction</h2>
    <p>These Terms are governed by and construed in accordance with the laws of [Your State/Country], without regard to its conflict of law provisions.</p>
    <p>Any legal action or proceeding arising under these Terms will be brought exclusively in the courts located in [Your City/County, State], and you consent to personal jurisdiction in such courts.</p>

    <h2>15. Dispute Resolution</h2>

    <h3>15.1 Informal Resolution</h3>
    <p>Before filing a claim, you agree to contact us at <strong>[YOUR EMAIL]</strong> to attempt to resolve the dispute informally. We will attempt to resolve disputes in good faith.</p>

    <h3>15.2 Arbitration Agreement</h3>
    <p>If informal resolution fails, you agree that any dispute arising from these Terms or your use of the Service shall be resolved through binding arbitration in [Your Location], in accordance with the rules of the American Arbitration Association.</p>
    <p><strong>YOU WAIVE YOUR RIGHT TO A JURY TRIAL AND TO PARTICIPATE IN CLASS ACTION LAWSUITS.</strong></p>

    <h3>15.3 Exceptions</h3>
    <p>Either party may seek injunctive relief in court to protect intellectual property rights or confidential information.</p>

    <h2>16. Miscellaneous Provisions</h2>

    <h3>16.1 Severability</h3>
    <p>If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary, and the remaining provisions will remain in full force and effect.</p>

    <h3>16.2 Waiver</h3>
    <p>Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.</p>

    <h3>16.3 Assignment</h3>
    <p>You may not assign or transfer these Terms or your account without our prior written consent. We may assign these Terms without restriction.</p>

    <h3>16.4 Entire Agreement</h3>
    <p>These Terms, together with our Privacy Policy, constitute the entire agreement between you and LastCall regarding the Service and supersede all prior agreements.</p>

    <h3>16.5 No Third-Party Beneficiaries</h3>
    <p>These Terms do not create any third-party beneficiary rights.</p>

    <h3>16.6 Headings</h3>
    <p>Section headings are for convenience only and do not affect interpretation.</p>

    <h2>17. Contact Information</h2>
    <p>For questions about these Terms of Service, please contact us:</p>
    <p>
        <strong>Email:</strong> [YOUR EMAIL]<br>
        <strong>GitHub:</strong> <a href="https://github.com/FrankieSoltero/LastCall">https://github.com/FrankieSoltero/LastCall</a><br>
        <strong>Response Time:</strong> We aim to respond within 48 hours
    </p>

    <h2>18. Acknowledgment</h2>
    <p>By using LastCall, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.</p>

    <hr style="margin: 40px 0; border: none; border-top: 1px solid #ddd;">

    <p style="text-align: center; color: #999; font-size: 14px;">
        © 2025 LastCall. All rights reserved.
    </p>
</body>
</html>
```

**Action Items:**
1. Replace `[INSERT DATE]` with current date
2. Replace `[YOUR EMAIL]` with your support email
3. Replace `[Your Name/Company]` with your legal name
4. Replace `[Your State/Country]` with your jurisdiction
5. Replace `[Your City/County, State]` with your location
6. Replace `[Your Location]` with arbitration location
7. Save to `docs/terms-of-service.html` in your repo

---

#### 1.3 Set Up GitHub Pages

**Steps:**

1. **Create docs folder in your repo:**
```bash
cd C:\Users\frank\Onedrive\Desktop\startUp\LastCall
mkdir docs
# Move the HTML files you created to docs/
```

2. **Commit and push:**
```bash
git add docs/
git commit -m "Add Privacy Policy and Terms of Service for App Store compliance"
git push origin main
```

3. **Enable GitHub Pages:**
   - Go to: https://github.com/FrankieSoltero/LastCall/settings/pages
   - Source: Deploy from a branch
   - Branch: `main`
   - Folder: `/docs`
   - Click Save

4. **Wait 1-2 minutes for deployment**

5. **Verify URLs work:**
   - https://frankiesoltero.github.io/LastCall/privacy-policy.html
   - https://frankiesoltero.github.io/LastCall/terms-of-service.html

---

## Phase 2: App Icons & Assets (2-3 hours)

### Tasks

#### 2.1 Create iOS App Icon (1024x1024px)

**Current Asset:** `lastCall/assets/images/logo.png` (2318x1536px)

**Requirements:**
- Dimensions: Exactly 1024x1024 pixels
- Format: PNG
- No transparency (iOS requirement)
- No rounded corners (iOS adds them automatically)
- High quality, no compression artifacts

**Tools:**
- **Online:** https://appicon.co (can generate all sizes from one image)
- **Figma:** https://figma.com (free, design tool)
- **Canva:** https://canva.com (free templates)
- **Photoshop/GIMP:** Desktop editing

**Process:**
1. Open logo.png in image editor
2. Resize/crop to 1024x1024 square
3. Ensure no transparency (fill with solid background color if needed)
4. Save as `app-icon.png`
5. Place in: `lastCall/assets/images/app-icon.png`

**Validation:**
- Use https://appicon.co to validate icon meets Apple requirements
- Check file size < 1MB

---

#### 2.2 Create Android Adaptive Icon

**Requirements:**
- Foreground image (icon without background)
- Background color already set in app.json: `#E6F4FE`

**Process:**
1. Extract the main icon element from your logo (remove background)
2. Save as transparent PNG
3. Name it `adaptive-icon.png`
4. Place in: `lastCall/assets/images/adaptive-icon.png`

---

## Phase 3: Backend Deployment (3-5 hours) ⚠️ CRITICAL

### 3.1 Prepare Backend for Production

#### Update server/package.json

**File:** `server/package.json`

**Add:**
```json
{
  "scripts": {
    "dev": "nodemon --watch src --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "postinstall": "prisma generate",
    "prisma:generate": "prisma generate"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

---

#### Update CORS Configuration

**File:** `server/src/index.ts`

**Find (around line 15-20):**
```typescript
app.use(cors({
    origin: '*',
    credentials: true
}));
```

**Replace with:**
```typescript
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL || 'https://lastcall-app.com'
        : '*',
    credentials: true
}));
```

---

### 3.2 Deploy to Render

**Steps:**

1. **Create Render Account:**
   - Go to https://render.com
   - Sign up with GitHub (recommended)

2. **Create New Web Service:**
   - Click "New +" → "Web Service"
   - Connect to GitHub repository: `FrankieSoltero/LastCall`
   - Grant Render access to repo

3. **Configure Service:**
   - **Name:** `lastcall-backend`
   - **Region:** Oregon (US West) or closest to you
   - **Branch:** `main`
   - **Root Directory:** `server`
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run prisma:generate && npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** Free

4. **Add Environment Variables:**

Click "Advanced" → "Add Environment Variable"

```
DATABASE_URL=postgresql://postgres.fmgpbzykzjyziqzwkmtc:eLak1DUuwfm7lMaa@aws-1-us-east-1.pooler.supabase.com:5432/postgres

PORT=3000

SUPABASE_URL=https://fmgpbzykzjyziqzwkmtc.supabase.co

SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtZ3BienlyempuemlxendrbXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQyNDA3MjksImV4cCI6MjA0OTgxNjcyOX0.0NhobNgxm3phTHdQPp-qWg_rCsT74Pe

NODE_ENV=production

FRONTEND_URL=https://lastcall-app.com
```

5. **Create Web Service:**
   - Click "Create Web Service"
   - Wait for deployment (5-15 minutes)
   - Monitor logs for errors

6. **Note Your Production URL:**
   - Will be: `https://lastcall-backend.onrender.com`
   - Save this URL for next step

7. **Test Deployment:**
   - Open: `https://lastcall-backend.onrender.com/health`
   - Should return: `{"status":"ok","message":"Server is running"}`

---

### 3.3 Update App API URL

**File:** `lastCall/lib/api.ts`

**Find (line 37):**
```typescript
const API_URL = 'http://192.168.1.233:3000/api';
```

**Replace with:**
```typescript
const API_URL = __DEV__
    ? 'http://192.168.1.233:3000/api'  // Development (localhost)
    : 'https://lastcall-backend.onrender.com/api'; // Production (Render)
```

**Explanation:**
- `__DEV__` is true when running with Expo Dev Client or metro bundler
- `__DEV__` is false in production builds
- This allows local development with localhost, production builds with Render

---

## Phase 4: App Configuration Updates (2-3 hours)

### 4.1 Update app.json - iOS Configuration

**File:** `lastCall/app.json`

**Find the `ios` section and replace with:**

```json
"ios": {
  "supportsTablet": true,
  "bundleIdentifier": "com.lastcall.scheduling",
  "buildNumber": "1",
  "infoPlist": {
    "NSUserNotificationsUsageDescription": "LastCall sends you push notifications when new schedules are published or when shifts are assigned to you, so you never miss an update.",
    "NSCameraUsageDescription": "LastCall does not use your camera.",
    "NSPhotoLibraryUsageDescription": "LastCall does not access your photo library.",
    "NSLocationWhenInUseUsageDescription": "LastCall does not use your location."
  },
  "config": {
    "usesNonExemptEncryption": false
  }
}
```

---

### 4.2 Update app.json - General Metadata

**In the same file, update these fields:**

```json
{
  "expo": {
    "name": "LastCall",
    "description": "Employee scheduling and shift management made simple. Create schedules, track availability, and manage your team's shifts all in one place.",
    "icon": "./assets/images/app-icon.png",
    "privacy": "public",
    "platforms": ["ios", "android"],
    "githubUrl": "https://github.com/FrankieSoltero/LastCall",
    "extra": {
      "router": {},
      "eas": {
        "projectId": "cfb64a22-48e1-4fff-a2ff-f022f9d8274c"
      },
      "privacyPolicyUrl": "https://frankiesoltero.github.io/LastCall/privacy-policy.html",
      "termsOfServiceUrl": "https://frankiesoltero.github.io/LastCall/terms-of-service.html"
    }
  }
}
```

---

### 4.3 Update eas.json

**File:** `lastCall/eas.json`

**Replace entire file with:**

```json
{
  "cli": {
    "version": ">= 16.28.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false,
        "resourceClass": "m-medium"
      },
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true,
      "ios": {
        "simulator": false,
        "resourceClass": "m-medium"
      },
      "android": {
        "buildType": "app-bundle"
      },
      "env": {
        "NODE_ENV": "production"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "[YOUR_APPLE_EMAIL]",
        "ascAppId": "[FILL_IN_AFTER_APP_STORE_CONNECT_SETUP]",
        "appleTeamId": "[YOUR_APPLE_TEAM_ID]"
      }
    }
  }
}
```

**Note:** Replace placeholders after Phase 5 (Apple Developer setup)

---

## Phase 5-10: Remaining Phases

(Detailed in original plan - includes Apple Developer setup, metadata, screenshots, testing, submission, and monitoring)

---

## Critical File Changes Summary

### Files to Create:
1. `docs/privacy-policy.html` - Privacy Policy
2. `docs/terms-of-service.html` - Terms of Service
3. `lastCall/assets/images/app-icon.png` - iOS app icon
4. `lastCall/assets/images/adaptive-icon.png` - Android adaptive icon

### Files to Modify:
1. `server/package.json` - Add postinstall, engines
2. `server/src/index.ts` - Update CORS
3. `lastCall/lib/api.ts` - Update API_URL
4. `lastCall/app.json` - Add iOS config, metadata, legal URLs
5. `lastCall/eas.json` - Production build config

---

## Quick Start Checklist

**Week 1: Foundation**
- [ ] Create Privacy Policy HTML
- [ ] Create Terms of Service HTML
- [ ] Set up GitHub Pages
- [ ] Create app icons (1024x1024)
- [ ] Update server/package.json
- [ ] Update CORS in server/src/index.ts
- [ ] Deploy backend to Render
- [ ] Update API_URL in lastCall/lib/api.ts
- [ ] Update app.json with iOS config
- [ ] Update eas.json

**Week 2: Testing & Submission**
- [ ] Get Apple Team ID
- [ ] Run `npx eas credentials` setup
- [ ] Create App Store Connect app record
- [ ] Write app description and keywords
- [ ] Create preview build
- [ ] Submit to TestFlight
- [ ] Test thoroughly
- [ ] Capture screenshots
- [ ] Create production build
- [ ] Submit to App Store

---

## Resources & Links

**Documentation:**
- App Store Guidelines: https://developer.apple.com/app-store/review/guidelines/
- EAS Build Docs: https://docs.expo.dev/build/introduction/
- Render Docs: https://render.com/docs

**Tools:**
- App Icon Generator: https://appicon.co
- Privacy Policy Generator: https://www.termsfeed.com/privacy-policy-generator/
- GitHub Pages: https://pages.github.com/

**Support:**
- Expo Discord: https://chat.expo.dev
- Expo Forums: https://forums.expo.dev

---

## Contact & Questions

If you encounter issues during implementation:
1. Check the detailed plan sections above
2. Review Expo/Apple documentation
3. Ask for clarification on specific steps
4. Test in preview builds before production

Good luck with your submission! 🚀
