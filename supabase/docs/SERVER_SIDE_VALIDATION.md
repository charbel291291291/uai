# Server-Side Validation Guide

Complete guide to server-side validation in Supabase PostgreSQL.

## Table of Contents

- [Overview](#overview)
- [Validation Functions](#validation-functions)
- [Sanitization Functions](#sanitization-functions)
- [Triggers](#triggers)
- [CHECK Constraints](#check-constraints)
- [RLS Policies with Validation](#rls-policies-with-validation)
- [Stored Procedures](#stored-procedures)
- [Data Integrity](#data-integrity)
- [Usage Examples](#usage-examples)

---

## Overview

All validation happens **server-side** in PostgreSQL. Frontend validation is considered untrusted and serves only as UX improvement.

### Security Principles

1. **Zero Trust**: Never trust client input
2. **Defense in Depth**: Multiple validation layers
3. **Fail Secure**: Invalid data is rejected
4. **Audit Everything**: Log validation failures

### Validation Layers

```
Client Input
    ↓
Edge Function Validation (Deno/TypeScript)
    ↓
RLS Policy Validation (PostgreSQL)
    ↓
Trigger Validation (PostgreSQL)
    ↓
CHECK Constraint Validation (PostgreSQL)
    ↓
Stored in Database
```

---

## Validation Functions

### Email Validation

```sql
-- Validate email format
SELECT validate_email('user@example.com');  -- Returns TRUE
SELECT validate_email('invalid-email');      -- Returns FALSE
```

**Rules:**
- Must contain @ symbol
- Must have domain with TLD
- No spaces allowed

### Username Validation

```sql
-- Validate username format
SELECT validate_username('john_doe123');  -- Returns TRUE
SELECT validate_username('123invalid');    -- Returns FALSE (must start with letter)
SELECT validate_username('ab');            -- Returns FALSE (too short)
```

**Rules:**
- 3-20 characters
- Must start with letter
- Alphanumeric and underscores only

### URL Validation

```sql
-- Validate URL format
SELECT validate_url('https://example.com');  -- Returns TRUE
SELECT validate_url('ftp://example.com');    -- Returns FALSE
```

**Rules:**
- Must start with http:// or https://
- Valid URL structure

### Password Strength

```sql
-- Check password strength
SELECT * FROM validate_password_strength('WeakPass');
-- Returns: FALSE, "Password must contain at least 8 characters, one number"

SELECT * FROM validate_password_strength('StrongPass123');
-- Returns: TRUE, "Password is strong"
```

**Requirements:**
- Minimum 8 characters
- At least one lowercase letter
- At least one uppercase letter
- At least one number

### XSS Detection

```sql
-- Detect XSS patterns
SELECT contains_xss('<script>alert("xss")</script>');  -- Returns TRUE
SELECT contains_xss('javascript:alert("xss")');        -- Returns TRUE
SELECT contains_xss('Normal text');                     -- Returns FALSE
```

**Detects:**
- `<script>` tags
- `javascript:` protocol
- Event handlers (`onclick=`, `onerror=`, etc.)
- `<iframe>`, `<object>`, `<embed>` tags
- Data URIs

### SQL Injection Detection

```sql
-- Detect SQL injection
SELECT contains_sql_injection('SELECT * FROM users');     -- Returns TRUE
SELECT contains_sql_injection('DROP TABLE users;');       -- Returns TRUE
SELECT contains_sql_injection('Normal text');             -- Returns FALSE
```

**Detects:**
- SQL keywords (SELECT, INSERT, UPDATE, DELETE, DROP, etc.)
- SQL comments (--, #, /* */)
- OR 1=1 patterns
- Semicolon-based attacks

---

## Sanitization Functions

### Text Sanitization

```sql
-- Sanitize text input
SELECT sanitize_text('  Hello World  ');           -- Returns 'Hello World'
SELECT sanitize_text('Text\x00With\x01Nulls');     -- Removes control characters
```

**Removes:**
- Leading/trailing whitespace
- Null bytes
- Control characters (except newlines and tabs)

### HTML Sanitization

```sql
-- Sanitize HTML
SELECT sanitize_html('<p>Safe <b>HTML</b></p>');                    -- Keeps safe tags
SELECT sanitize_html('<script>alert("xss")</script>');              -- Removes script
SELECT sanitize_html('<p onclick="alert()">Click</p>');             -- Removes onclick
SELECT sanitize_html('<a href="javascript:alert()">Link</a>');      -- Removes javascript:
```

**Removes:**
- `<script>` tags and content
- Event handlers (onclick, onerror, etc.)
- `javascript:` protocol
- `<iframe>`, `<object>`, `<embed>` tags

---

## Triggers

### Automatic Validation on INSERT/UPDATE

All tables have BEFORE triggers that validate data:

#### Profiles Table

```sql
-- This will fail - invalid username
INSERT INTO profiles (id, username, display_name)
VALUES ('uuid', '123invalid', 'John');
-- ERROR: Invalid username format

-- This will fail - XSS in bio
INSERT INTO profiles (id, username, display_name, bio)
VALUES ('uuid', 'john_doe', 'John', '<script>alert("xss")</script>');
-- ERROR: Bio contains invalid content
```

**Validations:**
- Username format
- Display name length (max 50)
- Bio length (max 500)
- Avatar URL format
- XSS detection in bio
- SQL injection detection

#### Contact Messages Table

```sql
-- This will fail - invalid email
INSERT INTO contact_messages (sender_email, subject, content)
VALUES ('invalid-email', 'Subject', 'Content');
-- ERROR: Invalid sender email format

-- This will fail - subject too long
INSERT INTO contact_messages (sender_email, subject, content)
VALUES ('user@example.com', REPEAT('A', 201), 'Content');
-- ERROR: Subject must be 200 characters or less
```

**Validations:**
- Email format
- Subject length (5-200 chars)
- Content length (10-5000 chars)
- XSS detection
- SQL injection detection

#### AI Requests Table

```sql
-- This will fail - prompt too long
INSERT INTO ai_requests (user_id, prompt)
VALUES ('uuid', REPEAT('A', 2001));
-- ERROR: Prompt must be 2000 characters or less

-- This will fail - XSS in prompt
INSERT INTO ai_requests (user_id, prompt)
VALUES ('uuid', '<script>alert("xss")</script>');
-- ERROR: Prompt contains invalid content
```

**Validations:**
- Prompt length (max 2000)
- Prompt not empty
- XSS detection
- SQL injection detection
- Non-negative token count
- Non-negative duration

---

## CHECK Constraints

### Enforced at Database Level

All tables have CHECK constraints that prevent invalid data:

#### Profiles Constraints

```sql
-- Username must be 3-20 characters
CHECK (LENGTH(username) >= 3 AND LENGTH(username) <= 20)

-- Display name max 50 characters
CHECK (LENGTH(display_name) <= 50)

-- Bio max 500 characters
CHECK (bio IS NULL OR LENGTH(bio) <= 500)

-- Username format (start with letter)
CHECK (username ~ '^[a-zA-Z][a-zA-Z0-9_]*$')
```

#### Subscriptions Constraints

```sql
-- Valid plan values only
CHECK (plan IN ('free', 'starter', 'pro', 'enterprise'))

-- Valid status values only
CHECK (status IN ('active', 'inactive', 'cancelled', 'expired'))

-- End date must be after start date
CHECK (current_period_end > current_period_start)
```

#### Contact Messages Constraints

```sql
-- Valid email format
CHECK (sender_email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$')

-- Subject max 200 characters
CHECK (LENGTH(subject) <= 200)

-- Content max 5000 characters
CHECK (LENGTH(content) <= 5000)

-- Valid status values
CHECK (status IN ('new', 'assigned', 'responded', 'resolved', 'spam'))

-- Valid priority values
CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
```

---

## RLS Policies with Validation

### Profiles - Validated Access

```sql
-- SELECT with validation
CREATE POLICY "profiles_select_with_validation"
ON profiles FOR SELECT
TO authenticated
USING (
    id = auth.uid() 
    OR 
    (username IS NOT NULL AND NOT contains_xss(username))
);

-- INSERT with validation
CREATE POLICY "profiles_insert_with_validation"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (
    id = auth.uid()
    AND validate_username(username)
    AND LENGTH(display_name) <= 50
    AND (bio IS NULL OR NOT contains_xss(bio))
);
```

### Contact Messages - Validated Submission

```sql
-- INSERT with validation
CREATE POLICY "contact_messages_insert_auth_with_validation"
ON contact_messages FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid()
    AND validate_email(sender_email)
    AND LENGTH(subject) <= 200
    AND LENGTH(content) <= 5000
    AND NOT contains_xss(subject)
    AND NOT contains_xss(content)
);
```

---

## Stored Procedures

### Insert Validated Profile

```sql
-- Insert profile with full validation
CALL insert_validated_profile(
    '00000000-0000-0000-0000-000000000001',  -- id
    'john_doe',                               -- username
    'John Doe',                               -- display_name
    'Software developer',                     -- bio (optional)
    'https://example.com/avatar.jpg'          -- avatar_url (optional)
);
```

**Validations:**
- Username format
- Username uniqueness
- Display name length
- Bio length
- XSS detection

### Update Validated Profile

```sql
-- Update profile with validation
CALL update_validated_profile(
    '00000000-0000-0000-0000-000000000001',  -- id
    'John D.',                                -- display_name (optional)
    'Updated bio',                            -- bio (optional)
    NULL                                      -- avatar_url (optional, NULL = no change)
);
```

**Validations:**
- Ownership verification
- Display name length
- Bio length
- XSS detection

### Insert Validated Contact Message

```sql
-- Insert contact message with validation
CALL insert_validated_contact_message(
    '00000000-0000-0000-0000-000000000001',  -- user_id (optional, NULL for anonymous)
    'user@example.com',                       -- sender_email
    'Question about pricing',                 -- subject
    'I have a question about your pricing...', -- content
    'John Doe'                                -- name (optional)
);
```

**Validations:**
- Email format
- Subject length
- Content length
- XSS detection
- SQL injection detection

---

## Data Integrity

### Integrity Report View

```sql
-- Check data integrity across all tables
SELECT * FROM data_integrity_report;
```

**Returns:**
- Total records per table
- Invalid usernames count
- Invalid emails count
- XSS content count
- Invalid dates count

### Cleanup Invalid Data

```sql
-- Remove invalid data (use with caution!)
SELECT * FROM cleanup_invalid_data();
```

**Cleans:**
- Profiles with invalid usernames
- Contact messages with invalid emails
- Expired rate limit counters

### Validate Specific Table

```sql
-- Validate profiles table
SELECT * FROM validate_table_data('profiles');

-- Validate subscriptions table
SELECT * FROM validate_table_data('subscriptions');

-- Validate contact messages
SELECT * FROM validate_table_data('contact_messages');
```

---

## Usage Examples

### Example 1: Insert Valid Profile

```sql
-- This will succeed
INSERT INTO profiles (id, username, display_name, bio)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'john_doe',
    'John Doe',
    'Software developer and open source enthusiast'
);

-- This will fail - invalid username
INSERT INTO profiles (id, username, display_name)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    '123invalid',  -- Starts with number
    'Invalid User'
);
```

### Example 2: Insert Valid Contact Message

```sql
-- This will succeed
INSERT INTO contact_messages (
    user_id, 
    sender_email, 
    subject, 
    content,
    status,
    priority
)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'user@example.com',
    'Question about pricing',
    'I would like to know more about your pricing plans.',
    'new',
    'normal'
);

-- This will fail - XSS in content
INSERT INTO contact_messages (
    sender_email, 
    subject, 
    content,
    status,
    priority
)
VALUES (
    'user@example.com',
    'Test',
    '<script>alert("xss")</script>',
    'new',
    'normal'
);
```

### Example 3: Use Stored Procedure

```sql
-- Using stored procedure for validated insert
BEGIN;
CALL insert_validated_profile(
    '00000000-0000-0000-0000-000000000003',
    'jane_doe',
    'Jane Doe',
    'Product designer',
    NULL
);
COMMIT;

-- This will fail and rollback
BEGIN;
CALL insert_validated_profile(
    '00000000-0000-0000-0000-000000000004',
    'ab',  -- Too short
    'Jane',
    NULL,
    NULL
);
-- ERROR: Invalid username format
-- Transaction automatically rolled back
```

### Example 4: Check Data Integrity

```sql
-- View integrity report
SELECT * FROM data_integrity_report;

-- Example output:
-- table_name      | total_records | invalid_usernames | invalid_emails | xss_content
-- ----------------|---------------|-------------------|----------------|------------
-- profiles        | 1000          | 0                 | 0              | 0
-- subscriptions   | 800           | 0                 | 0              | 0
-- contact_messages| 500           | 0                 | 2              | 0
```

---

## Testing Validation

### Test Email Validation

```sql
-- Valid emails
SELECT validate_email('user@example.com');        -- TRUE
SELECT validate_email('user.name@domain.co.uk');  -- TRUE

-- Invalid emails
SELECT validate_email('invalid');                 -- FALSE
SELECT validate_email('@example.com');            -- FALSE
SELECT validate_email('user@');                   -- FALSE
```

### Test XSS Detection

```sql
-- XSS patterns
SELECT contains_xss('<script>alert(1)</script>');     -- TRUE
SELECT contains_xss('javascript:alert(1)');           -- TRUE
SELECT contains_xss('<img src=x onerror=alert(1)>');  -- TRUE

-- Safe content
SELECT contains_xss('Hello World');                   -- FALSE
SELECT contains_xss('<p>Safe HTML</p>');              -- FALSE
```

### Test SQL Injection Detection

```sql
-- SQL injection patterns
SELECT contains_sql_injection('SELECT * FROM users');     -- TRUE
SELECT contains_sql_injection('DROP TABLE users;');       -- TRUE
SELECT contains_sql_injection(''' OR 1=1 --');           -- TRUE

-- Safe content
SELECT contains_sql_injection('Hello World');             -- FALSE
SELECT contains_sql_injection('What is SQL?');            -- FALSE
```

---

## Error Handling

### Common Validation Errors

| Error Code | Message | Cause |
|------------|---------|-------|
| `invalid_input` | Invalid username format | Username doesn't match pattern |
| `invalid_input` | Display name must be 50 characters or less | Name too long |
| `invalid_input` | Invalid sender email format | Email doesn't match pattern |
| `invalid_input` | Subject must be 200 characters or less | Subject too long |
| `invalid_input` | Message contains invalid content | XSS detected |
| `invalid_input` | Input contains invalid characters | SQL injection detected |

### Handling in Application

```typescript
// Supabase client error handling
try {
  const { data, error } = await supabase
    .from('profiles')
    .insert({ username: '123invalid', display_name: 'Test' });
  
  if (error) {
    console.error('Validation error:', error.message);
    // Show user-friendly error
  }
} catch (error) {
  console.error('Unexpected error:', error);
}
```

---

## Best Practices

### 1. Always Use Server-Side Validation

```sql
-- Don't rely on frontend validation only
-- The database will reject invalid data regardless
INSERT INTO profiles (username, display_name)
VALUES ('invalid', 'Test');  -- Will fail
```

### 2. Use Stored Procedures for Complex Validation

```sql
-- Use stored procedures for multi-step validation
CALL insert_validated_profile(
    'uuid',
    'username',
    'Display Name'
);
```

### 3. Monitor Data Integrity

```sql
-- Regular integrity checks
SELECT * FROM data_integrity_report
WHERE invalid_usernames > 0 
   OR invalid_emails > 0 
   OR xss_content > 0;
```

### 4. Sanitize Before Display

```sql
-- Always sanitize user-generated content
SELECT sanitize_html(bio) FROM profiles WHERE id = 'uuid';
```

---

<div align="center">
  <sub>Last updated: April 2026</sub>
</div>
