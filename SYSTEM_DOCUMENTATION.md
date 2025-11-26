# GoFlexConnect System Documentation

**Last Updated:** November 25, 2025
**Version:** 1.0
**Project:** GoFlexConnect - Cellular Signal Survey & Analysis Tool

---

## Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Features](#features)
5. [Database Schema](#database-schema)
6. [Authentication System](#authentication-system)
7. [Edge Functions](#edge-functions)
8. [Storage & File Management](#storage--file-management)
9. [Key Components](#key-components)
10. [Configuration](#configuration)
11. [Deployment](#deployment)

---

## Overview

GoFlexConnect is a professional cellular signal survey and analysis tool designed for RF engineers and network technicians. The application enables users to conduct site surveys, measure signal strength, generate heatmaps, and produce comprehensive reports for network planning and optimization.

### Primary Use Cases
- Indoor/outdoor cellular signal surveys
- Site commissioning and validation
- Network performance testing
- RF coverage heatmap generation
- Link budget calculations
- Cell tower location and navigation

---

## Technology Stack

### Frontend
- **Framework:** React 18.3.1 with TypeScript
- **Build Tool:** Vite 5.4.21
- **Styling:** Tailwind CSS 3.4.18
- **State Management:** Zustand 5.0.8
- **Icons:** Lucide React 0.344.0
- **UI Approach:** Custom components with Tailwind utility classes

### Backend
- **Database:** Supabase PostgreSQL
- **Authentication:** Supabase Auth (Email/Password)
- **Storage:** Supabase Storage
- **Serverless Functions:** Supabase Edge Functions (Deno runtime)
- **API:** Supabase Client SDK 2.57.4

### Email Service
- **SMTP Provider:** IONOS
- **Host:** smtp.ionos.com (Port 587)
- **Email Account:** forgot@goflexconnect.com

### Deployment
- **Hosting:** IONOS Web Hosting
- **Domain:** goflexconnect.com
- **Build Output:** Static files (dist/)

---

## Architecture

### Application Structure
```
goflexconnect/
├── src/
│   ├── components/        # React UI components
│   ├── services/          # API and business logic
│   ├── store/             # Zustand state management
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Helper functions and utilities
│   ├── App.tsx            # Main application component
│   └── main.tsx           # Application entry point
├── supabase/
│   ├── functions/         # Edge functions (serverless)
│   └── migrations/        # Database schema migrations
├── public/                # Static assets
└── dist/                  # Production build output
```

### Data Flow
1. **User Authentication** → Supabase Auth → Session Management
2. **Data Operations** → Supabase Client → PostgreSQL Database
3. **File Uploads** → Supabase Storage → Public Buckets
4. **Email Notifications** → Edge Functions → SMTP Server
5. **Offline Support** → IndexedDB (Local Storage) → Sync on Reconnect

---

## Features

### 1. Survey Projects
- Create and manage multiple site survey projects
- Upload floor plans with drag-and-drop support
- Create multiple floors per project
- Organize measurements by project and floor
- Generate visual heatmaps from measurement data

### 2. Survey Modes
- **Drive Test Mode:** Continuous automatic measurement logging
- **Survey Mode:** Manual point-by-point measurements with photo capture
- **Background Logging:** Passive data collection in the background

### 3. Measurement Collection
- RSRP (Reference Signal Received Power)
- RSRQ (Reference Signal Received Quality)
- SINR (Signal-to-Interference-plus-Noise Ratio)
- RSSI (Received Signal Strength Indicator)
- Cell ID and Network Information
- GPS Coordinates (Latitude/Longitude)
- Upload/Download Speed
- Ping and Jitter
- Network Type (LTE, 5G, etc.)

### 4. Heatmap Visualization
- Color-coded signal strength overlay on floor plans
- Toggle between different metrics (RSRP, SINR, RSRQ)
- Grid-based measurement display
- RF grid configuration (customizable grid spacing)
- Zoom and pan controls
- Real-time heatmap updates

### 5. Speed Testing
- Upload and download speed measurements
- Ping and jitter testing
- Network diagnostics
- Detailed cellular metrics
- Location-tagged results
- Historical speed test data

### 6. Link Budget Calculator
- Path loss calculations
- Support for multiple propagation models:
  - Free Space Path Loss
  - COST 231 Hald Model
  - Ericsson 9999 Model
- LTE and 5G frequency support
- Link budget reports

### 7. Cell Tower Compass
- Locate nearby cell towers via OpenCelliD
- Visual compass direction to towers
- Distance calculation
- Tower information display

### 8. Commissioning Checklist
- Customizable site commissioning tasks
- Progress tracking
- Photo attachments for verification
- Notes and observations per checkpoint

### 9. Report Generation
- Professional PDF reports
- Project summary with measurements
- Statistical analysis (min, max, average)
- Coverage percentage calculations
- Heatmap visualizations
- Export to multiple formats

### 10. Support System
- In-app support form
- Direct email to support@goflexconnect.com
- File attachment support (screenshots, documents)
- Accessible from Menu and Settings pages
- Success confirmation messaging

### 11. Settings & Configuration
- RSRP/SINR threshold customization
- Default metric selection
- Data export/import (backup/restore)
- Account management
- Diagnostics and debugging tools

### 12. AI Chatbot Assistant
- Context-aware help system
- Technical RF knowledge base
- Troubleshooting guidance
- Feature explanations
- Always accessible via floating button

---

## Database Schema

### Tables

#### `profiles`
User profile information
- `id` (uuid, PK) - References auth.users
- `email` (text)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

#### `projects`
Survey project management
- `id` (uuid, PK)
- `user_id` (uuid, FK → profiles)
- `name` (text)
- `location` (text)
- `description` (text)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

#### `floors`
Building floor plans
- `id` (uuid, PK)
- `project_id` (uuid, FK → projects)
- `name` (text)
- `floor_plan_url` (text) - Storage bucket URL
- `order` (integer) - Display order
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

#### `measurements`
Signal measurement data points
- `id` (uuid, PK)
- `project_id` (uuid, FK → projects)
- `floor_id` (uuid, FK → floors, nullable)
- `user_id` (uuid, FK → profiles)
- `latitude` (double precision)
- `longitude` (double precision)
- `rsrp` (double precision)
- `rsrq` (double precision)
- `sinr` (double precision)
- `rssi` (double precision)
- `cell_id` (text)
- `network_type` (text)
- `operator` (text)
- `frequency` (double precision)
- `bandwidth` (double precision)
- `x` (double precision) - Floor plan X coordinate
- `y` (double precision) - Floor plan Y coordinate
- `grid_x` (integer) - RF grid X position
- `grid_y` (integer) - RF grid Y position
- `photo_id` (text) - Associated photo reference
- `notes` (text)
- `created_at` (timestamptz)

#### `speed_tests`
Network speed test results
- `id` (uuid, PK)
- `user_id` (uuid, FK → profiles)
- `project_id` (uuid, FK → projects, nullable)
- `floor_id` (uuid, FK → floors, nullable)
- `download_speed` (double precision) - Mbps
- `upload_speed` (double precision) - Mbps
- `ping` (double precision) - ms
- `jitter` (double precision) - ms
- `server_location` (text)
- `latitude` (double precision)
- `longitude` (double precision)
- `rsrp` (double precision)
- `rsrq` (double precision)
- `sinr` (double precision)
- `rssi` (double precision)
- `cell_id` (text)
- `network_type` (text)
- `operator` (text)
- `ip_address` (text)
- `network_name` (text)
- `created_at` (timestamptz)

#### `commissioning_checklist`
Site commissioning task tracking
- `id` (uuid, PK)
- `project_id` (uuid, FK → projects)
- `user_id` (uuid, FK → profiles)
- `task_name` (text)
- `completed` (boolean, default: false)
- `notes` (text)
- `photo_url` (text)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### Row Level Security (RLS)

All tables have RLS enabled with policies ensuring:
- Users can only access their own data
- SELECT policies use `auth.uid() = user_id`
- INSERT policies verify `auth.uid() = user_id`
- UPDATE/DELETE policies check ownership
- All policies require authentication

---

## Authentication System

### Implementation
- **Provider:** Supabase Auth
- **Method:** Email/Password (no email confirmation required)
- **Session Management:** Automatic via Supabase client
- **Password Reset:** Email-based reset flow with custom redirect

### Auth Flow
1. User signs up with email/password
2. Account created in `auth.users` table
3. Database trigger creates profile in `profiles` table
4. Edge function sends welcome email notification
5. User automatically logged in

### Password Reset
- Uses `supabase.auth.resetPasswordForEmail()`
- Redirects to: `window.location.origin/reset-password`
- SMTP email sent via `forgot@goflexconnect.com`
- User clicks link and sets new password

### Protected Routes
All app features require authentication. Unauthenticated users see only the Auth component (login/signup screen).

---

## Edge Functions

Serverless functions running on Deno runtime in Supabase.

### 1. `send-email`
**Purpose:** Send emails via SMTP
**Method:** POST
**Authentication:** Bearer token required

**Request Body:**
```json
{
  "to": "recipient@example.com",
  "subject": "Email subject",
  "html": "<p>Email content</p>"
}
```

**Use Cases:**
- Password reset emails
- Support form submissions
- Welcome emails

**SMTP Configuration:**
- Host: smtp.ionos.com
- Port: 587 (STARTTLS)
- Username: forgot@goflexconnect.com
- Password: El3m3nt@lg33k@3050

### 2. `new-user-notification`
**Purpose:** Send notification when new user signs up
**Trigger:** Database trigger on auth.users INSERT
**Method:** Automatic (triggered by Supabase)

**Functionality:**
- Sends welcome email to new users
- Notifies admin of new registrations
- Uses send-email function internally

### 3. `chatbot`
**Purpose:** AI-powered help and support
**Method:** POST
**Authentication:** Bearer token required

**Request Body:**
```json
{
  "message": "User question",
  "context": "Optional context"
}
```

**Functionality:**
- Provides RF engineering guidance
- Answers technical questions
- References chatbot knowledge base
- Context-aware responses

### 4. `test-email`
**Purpose:** Development testing for email functionality
**Method:** POST
**Use:** Testing SMTP configuration

---

## Storage & File Management

### Storage Buckets

Currently, file uploads use public storage or base64 encoding for simplicity. Future implementation may include dedicated buckets:

**Planned Buckets:**
- `floor-plans` - Building floor plan images
- `measurement-photos` - Photos from survey points
- `support-attachments` - User-submitted support files (5MB limit)

### File Upload Limits
- Support attachments: 5MB maximum
- Accepted formats: JPG, PNG, GIF, WebP, PDF, DOC, DOCX

### Current Implementation
- Floor plans: Stored as data URLs or public URLs
- Measurement photos: Referenced by photo_id in measurements table
- Support form: Attachments noted in email, not stored in cloud

---

## Key Components

### Core Components

#### `App.tsx`
Main application orchestrator
- Handles authentication state
- Routes between major features
- Manages app-level state

#### `Auth.tsx`
Authentication interface
- Login/signup forms
- Password reset flow
- Styled branding with logo
- Error handling and validation

#### `Menu.tsx`
Main navigation hub
- Feature selection cards
- Settings access
- Support form access (help icon)
- Chatbot toggle
- Logout functionality

#### `Settings.tsx`
User preferences and configuration
- RSRP/SINR threshold adjustments
- Default metric selection
- Data export/import
- Support form access
- Diagnostics link
- Account management

### Project Management

#### `ProjectList.tsx`
Display all user projects
- Create new projects
- View project cards
- Navigate to project details
- Delete projects

#### `ProjectDetail.tsx`
Individual project management
- View project information
- Floor management
- Access survey modes
- Generate reports
- Commissioning checklist

#### `CreateProject.tsx`
New project creation form
- Project name, location, description
- Initial setup
- Validation

### Floor Plan Management

#### `FloorList.tsx`
Display floors within a project
- List all floors
- Create new floors
- Navigate to floor details
- Delete floors

#### `FloorDetail.tsx`
Individual floor management
- View floor plan
- Start surveys
- View measurements
- Generate heatmaps

#### `CreateFloor.tsx`
New floor creation
- Floor naming
- Floor plan upload
- Order/level specification

#### `FloorPlanUpload.tsx`
Floor plan image upload
- Drag-and-drop support
- Image preview
- File validation

#### `ZoomableFloorPlan.tsx`
Interactive floor plan viewer
- Zoom controls
- Pan functionality
- Touch/mouse support

### Survey Components

#### `SurveyMode.tsx`
Manual point-by-point surveying
- Measure button (collects data)
- Photo capture
- Real-time metrics display
- Save to current floor
- Grid position tracking

#### `DriveTestMode.tsx`
Continuous automatic logging
- Start/stop controls
- Auto-logging at intervals
- Time-series data collection
- No floor plan requirement

#### `BackgroundLogging.tsx`
Passive data collection
- Runs in background
- Periodic measurements
- Low battery impact
- Optional feature

### Visualization

#### `HeatmapView.tsx`
Signal strength heatmap overlay
- Color-coded signal levels
- Metric selection (RSRP, SINR, RSRQ)
- Grid-based visualization
- Legend with thresholds
- Zoom and pan support

#### `TimeSeriesChart.tsx`
Historical data graphing
- Line charts for trends
- Multiple metrics
- Time-based X-axis

### Tools & Utilities

#### `SpeedTest.tsx`
Network speed testing
- Upload/download measurement
- Ping and jitter
- Server selection
- Cellular metrics included
- Save to database

#### `LinkBudgetCalculator.tsx`
RF link budget calculations
- Propagation model selection
- Frequency and distance inputs
- Path loss calculations
- Link margin analysis

#### `CellTowerCompass.tsx`
Cell tower finder and navigator
- OpenCelliD API integration
- Compass direction overlay
- Distance calculation
- Tower information display

#### `BenchmarkTest.tsx`
Performance benchmarking
- Device capability testing
- Network performance metrics

#### `Diagnostics.tsx`
Debug and troubleshooting
- System information
- Network diagnostics
- Error logs
- Debug data export

### Support & Help

#### `SupportForm.tsx`
User support interface
- Name, email, phone fields
- Message/issue description
- File attachment (5MB limit)
- Submit via email
- Success confirmation
- Styled to match app design

#### `Chatbot.tsx`
AI assistant interface
- Floating action button
- Chat interface
- Knowledge base integration
- Context-aware help

#### `ChatbotButton.tsx`
Floating help button
- Always accessible
- Opens chatbot dialog
- Visual indicator

### Report Generation

#### `ReportGenerator.tsx`
Professional report creation
- Project summary
- Statistical analysis
- Coverage calculations
- Heatmap images
- Export to PDF/formats

#### `CommissioningChecklist.tsx`
Site commissioning task list
- Task creation
- Completion tracking
- Photo attachments
- Notes per task

### Utility Components

#### `OnlineStatus.tsx`
Network connectivity indicator
- Online/offline detection
- Visual indicator
- Sync status

#### `VpnWarning.tsx`
VPN detection alert
- Warns about VPN issues
- Suggests disabling for accuracy

#### `ThankYouPage.tsx`
Success confirmation pages
- Form submission success
- User feedback
- Navigation options

#### `SplashScreen.tsx`
App loading screen
- Brand display
- Loading animation
- Initial setup

#### `Onboarding.tsx`
First-time user guidance
- Feature walkthrough
- Setup wizard
- Tutorial flow

#### `RFGridSettings.tsx`
Configure measurement grid
- Grid spacing adjustment
- Snap-to-grid toggle
- Visual grid overlay

---

## Configuration

### Environment Variables

#### Required Variables (`.env`)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Supabase Configuration
- Project URL: Configured in environment
- Anonymous Key: Public client access
- Service Role Key: Server-side operations (not exposed)

### SMTP Configuration
- Host: smtp.ionos.com
- Port: 587
- Security: STARTTLS
- From: forgot@goflexconnect.com
- Password: El3m3nt@lg33k@3050

### Tailwind Theme
Custom colors:
- `goflex-blue`: #27AAE1
- `goflex-blue-dark`: #0178B7
- `goflex-blue-light`: #06B4D7

Font family: System UI stack

### Default Thresholds

**RSRP (dBm):**
- Good: ≥ -90
- Fair: -90 to -110
- Poor: < -110

**SINR (dB):**
- Good: ≥ 10
- Fair: 0 to 10
- Poor: < 0

---

## Deployment

### Build Process
```bash
npm run build
```

Outputs to `dist/` directory.

### Deployment Package
```bash
tar -czf goflexconnect-production.tar.gz -C dist .
```

Creates compressed archive for upload.

### IONOS Hosting Setup
1. Upload `goflexconnect-production.tar.gz` to web hosting
2. Extract to web root directory (`/` or `/app`)
3. Ensure `.htaccess` configured for SPA routing
4. Verify environment variables are accessible

### SPA Routing
For proper client-side routing, ensure hosting supports:
- All routes redirect to `index.html`
- 404 handling returns `index.html`

Example `.htaccess`:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### Post-Deployment Verification
1. Test authentication (login/signup)
2. Verify database connectivity
3. Test file uploads
4. Check email functionality (password reset)
5. Validate support form submissions
6. Test offline functionality
7. Verify heatmap generation

---

## Maintenance & Updates

### Version Control
All changes tracked in Git repository.

### Database Migrations
New migrations created in `supabase/migrations/`
Applied via Supabase CLI or MCP tools.

### Edge Function Deployment
Deploy via Supabase dashboard or MCP tools.

### Backup & Recovery
- Use Settings → Export Data for user-level backups
- Database backups managed by Supabase
- Manual exports available via Supabase dashboard

---

## Future Enhancements

### Planned Features
- Multi-user collaboration on projects
- Real-time team synchronization
- Advanced analytics dashboard
- Custom report templates
- Integration with third-party RF tools
- Mobile app (iOS/Android)
- Offline-first architecture improvements
- Automated report scheduling
- API access for external integrations

### Technical Debt
- Implement code splitting for smaller bundle size
- Add comprehensive unit test coverage
- Implement E2E testing
- Optimize image loading and caching
- Add service worker for better offline support
- Implement proper storage buckets with RLS

---

## Support & Documentation

### Internal Resources
- Source code: `/tmp/cc-agent/60603077/project/`
- Database migrations: `supabase/migrations/`
- Edge functions: `supabase/functions/`

### External Resources
- Supabase Documentation: https://supabase.com/docs
- React Documentation: https://react.dev
- Tailwind CSS: https://tailwindcss.com
- OpenCelliD API: https://opencellid.org

### Contact
- Support Email: support@goflexconnect.com
- Website: https://goflexconnect.com

---

**Document Version:** 1.0
**Last Updated:** November 25, 2025
**Maintained By:** Development Team

*This document will be updated as new features are added and the system evolves.*
