# 🔥 HabitGuard

### AI-Powered Accountability & Habit Tracking Platform

HabitGuard is a full-stack web application designed to help users stay accountable to their daily commitments.

Instead of simply marking a task as completed, HabitGuard provides a daily challenge and requires the user to submit visual proof of their work. The uploaded proof is analyzed using **Google Gemini AI** to determine whether it is reasonably relevant to the user's commitment.

The application combines habit tracking, AI-powered proof verification, streak management, progress visualization, and a test payment workflow into a single platform.

---

## 🚀 Features

### 🔐 User Authentication
- User registration and login
- JWT-based authentication
- Secure password hashing using bcrypt
- Forgot password functionality
- Password reset functionality

### 🎯 Commitment Management
Users can create commitments with:

- Commitment name
- Description
- Category
- Frequency
- Duration
- Starting commitment amount
- Escalation multiplier
- Maximum commitment amount
- Daily deadline

### 🤖 Daily Challenge

HabitGuard provides a daily task/challenge related to the user's commitment.

The current challenge system uses a category-based local challenge generator to provide relevant tasks for different commitment types such as:

- Study
- Reading
- Fitness
- Coding
- DSA
- Writing
- Meditation
- Language learning

### 📸 AI-Powered Proof Verification

Users must upload visual proof of their completed activity.

The application:

1. Receives the uploaded image.
2. Stores the proof using ImageKit.
3. Sends the image to Google Gemini AI.
4. Gemini analyzes the image in relation to the commitment.
5. The system determines whether the proof is reasonably relevant.
6. Unrelated proof can be rejected.
7. Only verified proof can be submitted as completed progress.

This helps make the accountability system more meaningful than a simple checkbox.

### 🔥 Streak Tracking

HabitGuard tracks:

- Current streak
- Best/longest streak
- Completed days
- Daily progress
- Missed days

Missing a day can reset the current streak and increase the commitment amount according to the configured escalation rules.

### 📊 Progress Visualization

The dashboard provides a contribution-style activity graph showing completed activity over time.

Users can easily see their consistency and progress throughout their commitment period.

### 💰 Test Payment Workflow

HabitGuard includes a **mock/test transaction system** for demonstrating the financial commitment workflow.

It generates a test transaction ID without transferring real money.

Example:

```text
TEST-XXXXXXXXXX-XXXX
