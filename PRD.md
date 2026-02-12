# Product Requirements Document (PRD)
# AMIK CHAT Database Management Dashboard

**Version:** 1.0  
**Date:** February 12, 2026  
**Product Name:** AMIK CHAT DB Manager  
**Platform:** Web Application (React)  
**Database:** Insforge.dev (PostgreSQL)

---

## 1. Executive Summary

### 1.1 Product Vision
A comprehensive, single-interface database management dashboard for AMIK CHAT application that eliminates the need to access Insforge.dev directly. The dashboard provides full CRUD operations, real-time monitoring, advanced querying, and data visualization capabilities while maintaining the clean, modern dark-mode aesthetic of the WorkDesk design system.

### 1.2 Target Users
- Database Administrators
- Backend Developers
- Product Managers
- Support Teams
- System Architects

### 1.3 Core Objectives
- **Complete Database Control**: Full CRUD operations on all 7 database tables
- **Real-time Monitoring**: Live connection status and data updates
- **Zero External Dependencies**: No need to access Insforge.dev portal
- **Data Integrity**: Safe operations with confirmation dialogs
- **Developer-Friendly**: SQL query builder and advanced filtering

---

## 2. Design System Specifications

### 2.1 Color Palette (MANDATORY - DO NOT CHANGE)
```css
--bg-primary: #020617        /* Main background */
--bg-card: #0F172A           /* Card background */
--border: #1E293B            /* All borders */
--accent-primary: #22D3EE    /* Primary accent (Cyan) */
--accent-secondary: #3B82F6  /* Secondary accent (Blue) */
--text-primary: #F8FAFC      /* Primary text */
--text-secondary: #94A388    /* Secondary text/labels */
```

### 2.2 Visual Elements (MANDATORY)
- **Cards**: Rounded corners (12px), subtle shadows with cyan tint
- **Gradients**: Cyan to Blue (#22D3EE → #3B82F6)
- **Shadows**: Soft indigo-tinted `shadow-[#22D3EE]/10`
- **Hover Effects**: Scale(1.02), shadow intensity increase
- **Transitions**: All animations 200-300ms ease-in-out
- **Borders**: 1px solid with opacity variations
- **Icons**: Lucide React library
- **Typography**: Sans-serif, weighted hierarchy

### 2.3 Component Patterns
- Sidebar navigation (fixed left, 256px width)
- Card-based layouts with consistent padding (24px)
- Modal overlays with backdrop blur
- Data tables with alternating row colors
- Action buttons with icon + text
- Status badges with color coding
- Loading states with skeleton screens

---

## 3. Database Schema Overview

### 3.1 Tables Structure

#### Table 1: `users`
**Purpose**: Core user profiles and authentication  
**Primary Key**: `id` (text)  
**Columns**: 
- `id`, `email`, `name`, `display_name`
- `avatar_url`, `photo_url`, `phone_number`
- `gender`, `region`, `address`
- `created_at`, `last_seen` (timestamptz)
- `is_online` (boolean)
- `status`, `bio`, `security_pin`

**Key Relationships**: 
- One-to-Many → messages (via sender_id)
- Many-to-Many → chats (via participant_ids array)
- Self-referencing → user_contacts

---

#### Table 2: `chats`
**Purpose**: Chat conversation containers  
**Primary Key**: `id` (text)  
**Columns**:
- `id`
- `participant_ids` (text[] - array of user IDs)
- `participants_info` (jsonb - denormalized user data)
- `last_message` (jsonb - message object)
- `created_at`, `updated_at` (timestamptz)
- `unread_count` (jsonb - per-user unread counts)

**Key Relationships**:
- One-to-Many → messages (via chat_id)
- Many-to-Many → users (via participant_ids)

---

#### Table 3: `messages`
**Purpose**: Individual chat messages with rich media support  
**Primary Key**: `id` (text)  
**Foreign Keys**: `chat_id` → chats(id) ON DELETE CASCADE  
**Columns**:
- `id`, `chat_id`, `sender_id`, `text`
- `timestamp` (timestamptz)
- `is_read`, `is_deleted`, `is_forwarded` (boolean)
- `deleted_for` (jsonb - user-specific deletions)
- `deleted_at`, `deleted_by`
- `reactions` (jsonb - emoji reactions)
- `type` (text, audio, image, file, location)
- Media fields: `audio_url`, `duration`, `file_url`, `file_name`, `file_size`, `file_type`, `image_url`
- `location` (jsonb - GPS coordinates)

**Key Relationships**:
- Many-to-One → chats
- Many-to-One → users (via sender_id)

---

#### Table 4: `contact_requests`
**Purpose**: Friend request management system  
**Primary Key**: `id` (text)  
**Columns**:
- `id`
- `from_user_id`, `to_user_id`
- `from_name`, `to_name`
- `from_avatar_url`, `to_avatar_url`
- `direction` (sent/received)
- `status` (pending, accepted, rejected)
- `created_at`, `updated_at` (timestamptz)

**Key Relationships**:
- References users (not enforced FK)

---

#### Table 5: `user_contacts`
**Purpose**: User friendship/contact adjacency table  
**Primary Key**: Composite (`user_id`, `contact_id`)  
**Foreign Keys**: 
- `user_id` → users(id)
- `contact_id` → users(id)

**Columns**:
- `user_id`, `contact_id`
- `contact_name`, `contact_avatar_url`
- `added_at` (timestamptz)

**Key Relationships**:
- Self-referencing user relationships

---

#### Table 6: `calls`
**Purpose**: WebRTC call session tracking  
**Primary Key**: `id` (text)  
**Columns**:
- `id`
- `participants` (text[] - array of user IDs)
- `is_video` (boolean)
- `status` (active, ended, missed)
- `created_at` (timestamptz)

**Key Relationships**:
- One-to-Many → call_signals

---

#### Table 7: `call_signals`
**Purpose**: WebRTC signaling data (SDP, ICE candidates)  
**Primary Key**: `id` (text)  
**Foreign Keys**: `call_id` → calls(id) ON DELETE CASCADE  
**Columns**:
- `id`, `call_id`
- `type` (offer, answer, ice-candidate)
- `data` (jsonb - WebRTC payload)
- `from_user_id`, `to_user_id`
- `timestamp` (timestamptz)

**Key Relationships**:
- Many-to-One → calls

---

### 3.2 Database Extensions
- **pgcrypto**: Cryptographic functions (encryption, hashing)
- **http**: HTTP request capabilities from database

### 3.3 Real-time Triggers
Each table has AFTER INSERT/UPDATE triggers that publish to PostgreSQL NOTIFY channels:
- `notify_user_changes` → `users:*`
- `notify_chat_changes` → `chats:*`
- `notify_message_changes` → `messages:*`
- `notify_contact_request_changes` → `contact_requests:*`
- `notify_user_contacts_update_v2` → `user_contacts:*`
- `notify_call_signals` → `call:*`

---

## 4. Feature Requirements

### 4.1 Navigation & Layout

#### 4.1.1 Sidebar Navigation (Fixed Left, 256px)
**Components**:
- Logo/Branding Area
  - Database icon with gradient background
  - "AMIK CHAT" title with gradient text
  - "Database Manager" subtitle in secondary text

- Navigation Menu Items:
  1. **Dashboard** (Activity icon) - Overview & stats
  2. **Users** (Users icon) - User management
  3. **Chats** (MessageSquare icon) - Chat management
  4. **Messages** (MessageSquare icon) - Message management
  5. **User Contacts** (UserPlus icon) - Contact relationships
  6. **Contact Requests** (UserPlus icon) - Friend requests
  7. **Calls** (Phone icon) - Call sessions
  8. **Call Signals** (Activity icon) - WebRTC signals
  9. **Query Builder** (PlayCircle icon) - SQL executor
  10. **Analytics** (BarChart3 icon) - Data visualization
  11. **Settings** (Settings icon) - Configuration

- Connection Status Footer:
  - Live indicator dot (green=connected, red=disconnected)
  - Connection status text
  - Last sync timestamp

**Interaction**:
- Active tab: Gradient background (cyan/blue), accent text, border, shadow
- Inactive tab: Secondary text, hover to show background
- Smooth transitions (200ms)

---

### 4.2 Dashboard Overview Page

#### 4.2.1 Top Header Bar
- Page title: "Database Overview" (gradient text)
- Subtitle: "Real-time statistics and activity monitoring"
- **Sync Database** button (icon + text, gradient background)
- Connection status badge
- Last updated timestamp

#### 4.2.2 Key Metrics Cards (4-column grid, responsive)

**Card 1: Total Users**
- Large number display
- Users icon in gradient container
- Percentage change indicator
- Sparkline chart (optional)
- Click to navigate to Users page

**Card 2: Total Chats**
- Large number display
- MessageSquare icon in gradient container
- Percentage change indicator
- Sparkline chart (optional)
- Click to navigate to Chats page

**Card 3: Messages Sent**
- Large number display
- MessageSquare icon in gradient container
- Percentage change indicator
- Sparkline chart (optional)
- Click to navigate to Messages page

**Card 4: Online Users**
- Large number display (real-time)
- Activity icon in gradient container
- "Live" indicator
- Pulse animation on count
- Click to filter online users

**Card 5: Pending Requests**
- Large number display
- UserPlus icon
- Click to navigate to Contact Requests

**Card 6: Active Calls**
- Large number display
- Phone icon
- Real-time indicator

#### 4.2.3 Quick Actions Bar (Horizontal buttons)
- **Add User** (Plus + Users icon)
- **Create Chat** (Plus + MessageSquare icon)
- **View Analytics** (BarChart3 icon)
- **Execute Query** (PlayCircle icon)
- **Export Database** (Download icon)
- **Import Data** (Upload icon)

#### 4.2.4 Recent Activity Feed (2-column layout)

**Left Column: Recent Changes**
- Last 10 database operations
- Each item shows:
  - Operation type (INSERT/UPDATE/DELETE) with color badge
  - Table name
  - Record ID (truncated)
  - Timestamp (relative, e.g., "2 minutes ago")
  - User who performed action (if tracked)
- Auto-refresh every 5 seconds
- Click item to view details

**Right Column: System Health**
- Database connection status
- Response time metrics
- Active subscriptions count
- Trigger status indicators
- Error log (last 5 errors)

#### 4.2.5 Data Distribution Charts (Optional)
- **Pie Chart**: Messages by type (text, image, audio, file)
- **Line Chart**: User registrations over time
- **Bar Chart**: Messages per hour (last 24h)
- **Donut Chart**: Chat activity by user

---

### 4.3 Users Management Page

#### 4.3.1 Page Header
- Title: "Users Management"
- Subtitle: "Total: {count} users | Online: {online_count}"
- **Add User** button (gradient, icon)
- **Export Users** button
- **Bulk Actions** dropdown

#### 4.3.2 Search & Filter Bar
- **Search Input**: 
  - Placeholder: "Search by name, email, phone, ID..."
  - Real-time search (debounced 300ms)
  - Search icon left, clear button right

- **Filter Dropdowns**:
  - Status: All / Online / Offline
  - Region: All / {unique regions}
  - Gender: All / {unique genders}
  - Date Range: Created At / Last Seen

- **Sort Dropdown**:
  - Name (A-Z)
  - Name (Z-A)
  - Newest First
  - Oldest First
  - Last Seen

- **View Toggle**: Table / Card Grid view

#### 4.3.3 Users Data Table
**Columns**:
1. Avatar (thumbnail image or initials)
2. Name / Display Name
3. Email
4. Phone Number
5. Status (online indicator dot + text)
6. Last Seen (relative time)
7. Region
8. Created At (date)
9. Actions (Edit, View, Delete icons)

**Features**:
- Row hover: Background color change
- Clickable row: Opens view modal
- Pagination: 20/50/100 per page
- Column sorting (click header)
- Checkbox selection for bulk actions
- Status badge: Green (online) / Gray (offline)
- Avatar fallback: Initials with gradient background

#### 4.3.4 User Actions

**Add User Modal**:
- Form fields (all aligned, labeled):
  - ID (auto-generated or manual input)
  - Email (required, validated)
  - Name (required)
  - Display Name
  - Avatar URL / Photo URL
  - Phone Number
  - Gender (dropdown)
  - Region (dropdown or input)
  - Address (textarea)
  - Status (text input)
  - Bio (textarea)
  - Security PIN (password input)
- **Cancel** and **Create User** buttons
- Real-time validation
- Success toast notification

**Edit User Modal**:
- Same form as Add User
- Pre-filled with existing data
- **Cancel** and **Update User** buttons
- Show "Last updated" timestamp
- Confirmation on close if unsaved changes

**View User Modal** (Read-only):
- All user fields displayed in organized sections:
  - Personal Information
  - Contact Details
  - Account Status
  - Activity Statistics
- **Edit** button (opens Edit modal)
- **Delete** button (confirmation required)
- **View Messages** link (filters messages by sender)
- **View Chats** link (filters chats by participant)

**Delete User Confirmation**:
- Warning message: "This will delete the user and all related data. This action cannot be undone."
- Checkbox: "I understand the consequences"
- **Cancel** and **Delete Permanently** buttons

#### 4.3.5 Bulk Actions
- Select all checkbox (header)
- Selected count indicator
- **Bulk Delete** (with confirmation)
- **Export Selected** (JSON/CSV)
- **Update Status** (online/offline)

---

### 4.4 Chats Management Page

#### 4.4.1 Page Header
- Title: "Chats Management"
- Subtitle: "Total: {count} conversations"
- **Create Chat** button
- **Export Chats** button

#### 4.4.2 Search & Filter
- Search by: Participant names, Chat ID
- Filter by:
  - Participant count (1-1, Group 3+)
  - Date Created
  - Last Activity
  - Has unread messages

#### 4.4.3 Chats Data Table
**Columns**:
1. Chat ID (truncated with copy button)
2. Participants (avatar row, max 5 shown + counter)
3. Last Message Preview (text + timestamp)
4. Participant Count
5. Unread Count (badge)
6. Created At
7. Last Activity
8. Actions (View, Edit, Delete)

**Features**:
- Expandable rows: Show full participants list
- Last message truncated to 50 chars
- Click row: Opens chat details modal
- Real-time last_message updates

#### 4.4.4 Chat Actions

**Create Chat Modal**:
- **Participants Selection**:
  - Multi-select dropdown with search
  - Shows user avatars + names
  - Minimum 2 participants
- **Chat Type**: Direct / Group
- Auto-generate Chat ID or manual input
- **Cancel** and **Create Chat** buttons

**View Chat Modal**:
- **Chat Information**:
  - Chat ID (with copy button)
  - Participants list (avatars + names)
  - Created date
  - Last activity
  - Unread counts per user (JSONB display)
- **Last Message Section**:
  - Message text
  - Sender name
  - Timestamp
- **Quick Actions**:
  - View All Messages (filters messages table)
  - Add Participant
  - Remove Participant
  - Delete Chat

**Edit Chat Modal**:
- Update participant_ids array
- Update participants_info JSONB
- Manually update last_message JSONB
- Update unread_count JSONB

**Delete Chat Confirmation**:
- Warning: "This will delete the chat and all {message_count} messages. This action cannot be undone."
- Cascade delete warning
- Checkbox confirmation
- **Cancel** and **Delete Permanently** buttons

---

### 4.5 Messages Management Page

#### 4.5.1 Page Header
- Title: "Messages Management"
- Subtitle: "Total: {count} messages"
- **Filter by Chat** dropdown
- **Export Messages** button

#### 4.5.2 Search & Filter
- Search by: Text content, Sender name, Message ID
- Filter by:
  - Chat (dropdown, searchable)
  - Sender (dropdown, searchable)
  - Message Type (text, image, audio, file, location)
  - Status (read/unread, deleted/active)
  - Date Range (timestamp)
  - Has Reactions (yes/no)
  - Is Forwarded (yes/no)

#### 4.5.3 Messages Data Table
**Columns**:
1. Message ID (truncated)
2. Chat ID (truncated, link to chat)
3. Sender (avatar + name)
4. Message Preview (text truncated or media type badge)
5. Type (badge: text, image, audio, file, location)
6. Status (read/unread, deleted badges)
7. Reactions (emoji display, count)
8. Timestamp
9. Actions (View, Edit, Delete)

**Features**:
- Row colors based on type
- Expandable rows: Show full message content
- Media preview on hover (images, audio player icon)
- Reaction emojis inline
- Deleted messages: Strikethrough or "Deleted" badge

#### 4.5.4 Message Actions

**View Message Modal**:
- **Message Content**:
  - Full text (with proper formatting)
  - Media display (image, audio player, file download link)
  - Location map preview (if location type)
- **Message Metadata**:
  - Message ID
  - Chat ID (link)
  - Sender (link)
  - Type
  - Timestamp
  - Read status
  - Deleted status
  - Forwarded status
- **Reactions Section** (JSONB display):
  - Emoji + user who reacted
- **Deleted For** (JSONB display):
  - User IDs who deleted this message
- **Quick Actions**:
  - Edit Message
  - Delete Message
  - View Chat
  - View Sender Profile

**Edit Message Modal**:
- Editable fields:
  - Text content
  - Type (dropdown)
  - Media URLs (text inputs)
  - Reactions (JSONB editor)
  - Status toggles (is_read, is_deleted, is_forwarded)
- Warning: "Editing messages may affect chat history"
- **Cancel** and **Update Message** buttons

**Add Message Modal**:
- Select Chat (dropdown)
- Select Sender (dropdown)
- Message Type (radio buttons: text, image, audio, file, location)
- Conditional fields based on type:
  - **Text**: Text area
  - **Image**: Image URL input
  - **Audio**: Audio URL + Duration
  - **File**: File URL + Name + Size + Type
  - **Location**: Latitude + Longitude (JSONB editor)
- Advanced options (collapsible):
  - Set as read
  - Add reactions (JSONB editor)
  - Mark as forwarded
- **Cancel** and **Send Message** buttons

**Delete Message**:
- Options:
  - Delete for everyone (permanent)
  - Delete for specific users (update deleted_for JSONB)
- Confirmation required

---

### 4.6 User Contacts Management Page

#### 4.6.1 Page Header
- Title: "User Contacts"
- Subtitle: "Total: {count} contact relationships"
- **Add Contact Relationship** button
- **Export Contacts** button

#### 4.6.2 Search & Filter
- Search by: User name, Contact name, User ID, Contact ID
- Filter by:
  - Specific User (dropdown)
  - Date Added range
- Sort by: Added Date, User Name, Contact Name

#### 4.6.3 Contacts Data Table
**Columns** (Composite Key Display):
1. User (avatar + name + ID)
2. ↔ (Bidirectional indicator)
3. Contact (avatar + name + ID)
4. Contact Display Name (from user_contacts.contact_name)
5. Added At
6. Actions (View, Edit, Delete)

**Features**:
- Bidirectional relationship visualization
- Hover: Highlight both user and contact
- Click row: View relationship details

#### 4.6.4 Contact Actions

**Add Contact Relationship Modal**:
- **Select User** (dropdown with search)
- **Select Contact** (dropdown with search, exclude selected user)
- **Contact Display Name** (how User sees Contact)
- **Contact Avatar URL** (optional override)
- Auto-set Added At (current timestamp)
- **Cancel** and **Add Relationship** buttons
- Validation: Prevent duplicate relationships

**View Relationship Modal**:
- Display both User and Contact info side-by-side
- Show bidirectional status (check if reverse relationship exists)
- Added date
- **Quick Actions**:
  - Edit relationship
  - Delete relationship
  - View User profile
  - View Contact profile
  - View shared chats

**Edit Relationship Modal**:
- Update contact_name
- Update contact_avatar_url
- **Cancel** and **Update** buttons

**Delete Relationship**:
- Warning: "This will remove the contact relationship. The users will no longer see each other in their contacts list."
- Option: "Also delete reverse relationship" (if exists)
- Confirmation required

---

### 4.7 Contact Requests Management Page

#### 4.7.1 Page Header
- Title: "Contact Requests"
- Subtitle: "Pending: {pending_count} | Total: {count}"
- **Create Request** button (for testing)
- **Filter by Status** buttons (All, Pending, Accepted, Rejected)

#### 4.7.2 Search & Filter
- Search by: From name, To name, User IDs
- Filter by:
  - Status (pending, accepted, rejected)
  - Direction (sent, received)
  - Date Range (created_at)

#### 4.7.3 Requests Data Table
**Columns**:
1. Request ID (truncated)
2. From User (avatar + name)
3. → (Arrow indicator)
4. To User (avatar + name)
5. Direction (badge: sent/received from perspective)
6. Status (badge with color: pending=yellow, accepted=green, rejected=red)
7. Created At
8. Updated At
9. Actions (Approve, Reject, Delete)

**Features**:
- Status color coding
- Direction indicator (arrow)
- Quick approve/reject buttons for pending requests
- Expandable row: Show avatar URLs

#### 4.7.4 Request Actions

**Create Request Modal** (For Testing):
- Select From User (dropdown)
- Select To User (dropdown)
- Auto-populate names and avatars
- Direction (auto-set as "sent")
- Status (default: pending)
- **Cancel** and **Create Request** buttons

**View Request Modal**:
- Full request details:
  - Request ID
  - From User (avatar, name, ID)
  - To User (avatar, name, ID)
  - Direction
  - Status
  - Created date
  - Updated date
- **Quick Actions** (if pending):
  - Approve Request (changes status to "accepted")
  - Reject Request (changes status to "rejected")
  - Delete Request

**Update Request Status**:
- Dropdown to change status: pending → accepted/rejected
- Confirmation: "Update request status to {new_status}?"
- Auto-update updated_at timestamp
- **Cancel** and **Update Status** buttons

**Delete Request**:
- Simple confirmation
- **Cancel** and **Delete** buttons

---

### 4.8 Calls Management Page

#### 4.8.1 Page Header
- Title: "Calls Management"
- Subtitle: "Active: {active_count} | Total: {count}"
- **View Active Calls** button
- **Export Calls** button

#### 4.8.2 Search & Filter
- Search by: Call ID, Participant names
- Filter by:
  - Status (active, ended, missed)
  - Call Type (audio/video)
  - Participant Count
  - Date Range (created_at)

#### 4.8.3 Calls Data Table
**Columns**:
1. Call ID (truncated)
2. Participants (avatar row)
3. Type (badge: Audio/Video with icon)
4. Status (badge: Active=green, Ended=gray, Missed=red)
5. Duration (calculated from signals or manual)
6. Created At
7. Actions (View, End, Delete)

**Features**:
- Active calls: Pulse animation on row
- Duration timer (if active)
- Participants preview (max 4 avatars + counter)

#### 4.8.4 Call Actions

**View Call Modal**:
- **Call Information**:
  - Call ID
  - Participants list (avatars + names + IDs)
  - Type (audio/video)
  - Status
  - Created timestamp
  - Duration (if ended)
- **Call Signals** (expandable section):
  - List of all associated call_signals
  - Signal type (offer, answer, ice-candidate)
  - From/To users
  - Timestamp
- **Quick Actions**:
  - View Signals (filters call_signals table)
  - End Call (if active)
  - Delete Call

**End Call** (If Active):
- Confirmation: "End active call?"
- Updates status to "ended"
- **Cancel** and **End Call** buttons

**Delete Call**:
- Warning: "This will delete the call and all {signal_count} associated signals. This action cannot be undone."
- Cascade delete warning
- Confirmation required

---

### 4.9 Call Signals Management Page

#### 4.9.1 Page Header
- Title: "Call Signals"
- Subtitle: "Total: {count} signals"
- **Filter by Call** dropdown
- **Export Signals** button

#### 4.9.2 Search & Filter
- Search by: Signal ID, Call ID, User IDs
- Filter by:
  - Call (dropdown)
  - Signal Type (offer, answer, ice-candidate)
  - From User (dropdown)
  - To User (dropdown)
  - Date Range (timestamp)

#### 4.9.3 Signals Data Table
**Columns**:
1. Signal ID (truncated)
2. Call ID (truncated, link to call)
3. Type (badge)
4. From User (avatar + name)
5. → To User (avatar + name)
6. Data Preview (JSONB truncated)
7. Timestamp
8. Actions (View, Delete)

**Features**:
- Type color coding
- Expandable rows: Show full JSONB data
- JSON syntax highlighting

#### 4.9.4 Signal Actions

**View Signal Modal**:
- **Signal Information**:
  - Signal ID
  - Call ID (link)
  - Type
  - From User (link)
  - To User (link)
  - Timestamp
- **Signal Data** (JSONB):
  - Pretty-printed JSON editor
  - Syntax highlighting
  - Read-only view or editable
  - Copy to clipboard button
- **Quick Actions**:
  - View Call
  - Delete Signal

**Delete Signal**:
- Simple confirmation
- Warning: "This may affect call connectivity"
- **Cancel** and **Delete** buttons

---

### 4.10 Query Builder Page

#### 4.10.1 Page Layout

**Left Panel (30% width): Query Builder UI**
- **Visual Query Builder** (Tab 1):
  - Table Selector (dropdown, multi-select)
  - Column Selector (checkboxes)
  - WHERE Conditions:
    - Add Condition button
    - Field dropdown
    - Operator dropdown (=, !=, <, >, LIKE, IN, IS NULL, etc.)
    - Value input
    - AND/OR toggle
  - ORDER BY (field + ASC/DESC)
  - LIMIT input
  - **Generate SQL** button

- **Raw SQL Editor** (Tab 2):
  - Syntax-highlighted SQL textarea
  - Line numbers
  - Auto-complete suggestions
  - Saved queries dropdown
  - **Execute Query** button

- **Query History** (Bottom Section):
  - Last 20 queries
  - Timestamp
  - Query preview (truncated)
  - Click to load query

**Right Panel (70% width): Results Display**
- **Results Table**:
  - Dynamic columns based on SELECT
  - Row count indicator
  - Pagination
  - Export results (JSON/CSV)
  - Copy results button
  
- **Query Info Bar**:
  - Execution time
  - Rows returned
  - Query status (success/error)

- **Error Display** (if query fails):
  - Error message
  - Error type
  - Suggested fix (if available)

#### 4.10.2 Saved Queries Feature
- **Save Current Query** button
- **Saved Queries Library**:
  - Query name
  - Description
  - Last used
  - Edit/Delete actions
- **Load Saved Query** (populates editor)

#### 4.10.3 Common Query Templates
- Predefined useful queries:
  - "All online users"
  - "Unread messages by chat"
  - "Pending contact requests"
  - "Active calls with participants"
  - "Message statistics by type"
  - "User activity in last 24h"
- Click template to load

---

### 4.11 Analytics & Visualization Page

#### 4.11.1 Page Header
- Title: "Analytics & Insights"
- Subtitle: "Data visualizations and trends"
- Date Range Picker (Last 7/30/90 days, Custom)
- **Refresh Data** button

#### 4.11.2 Charts Grid (2-column responsive)

**Chart 1: User Growth Over Time**
- Line chart
- X-axis: Date
- Y-axis: Total users
- Displays created_at trend

**Chart 2: Message Activity**
- Bar chart
- X-axis: Date
- Y-axis: Message count
- Grouped by message type (color-coded)

**Chart 3: Message Type Distribution**
- Donut chart
- Segments: text, image, audio, file, location
- Click segment to filter messages table

**Chart 4: Online vs Offline Users**
- Pie chart
- Real-time indicator

**Chart 5: Contact Request Status**
- Stacked bar chart
- Pending, Accepted, Rejected over time

**Chart 6: Call Statistics**
- Mixed chart (line + bar)
- Total calls, Average duration, Video vs Audio

**Chart 7: Chat Activity Heatmap**
- Calendar heatmap
- Shows messages per day
- Color intensity = activity level

**Chart 8: Top Active Users**
- Horizontal bar chart
- Top 10 users by message count
- Avatar + name labels

#### 4.11.3 Export Charts
- **Export as PNG** button per chart
- **Export All Data** (CSV) button

---

### 4.12 Settings & Configuration Page

#### 4.12.1 Database Connection Settings
- **Connection Status** (green/red indicator)
- **Database URL** (masked, show/hide toggle)
- **Connection Pool Info**:
  - Active connections
  - Max connections
  - Connection timeout
- **Test Connection** button
- **Reconnect** button

#### 4.12.2 Real-time Subscription Settings
- **Active Subscriptions** (list):
  - Channel name
  - Table
  - Status (active/inactive)
  - Toggle on/off
- **Subscription Health**:
  - Messages received count
  - Last message timestamp
- **Refresh All Subscriptions** button

#### 4.12.3 Display Preferences
- **Theme** (locked to dark mode, but show as preference)
- **Rows Per Page**: 10/20/50/100
- **Date Format**: MM/DD/YYYY, DD/MM/YYYY, ISO 8601
- **Time Zone**: User's local or UTC
- **Enable Animations**: Toggle
- **Compact View**: Toggle (reduces padding)

#### 4.12.4 Data Management
- **Backup Database**:
  - Export all tables as single JSON file
  - Include timestamp in filename
  - Download button
- **Import Data**:
  - Upload JSON file
  - Parse and validate
  - Preview before import
  - **Import** button
- **Clear All Data**:
  - Danger zone (red border card)
  - Requires typing "DELETE ALL" to confirm
  - **Clear Database** button

#### 4.12.5 Trigger & Function Status
- **Database Triggers** (list):
  - Trigger name
  - Associated table
  - Status (enabled/disabled)
  - Last fired timestamp (if tracked)
- **Database Functions** (list):
  - Function name
  - Purpose
  - Status
- Read-only display (no edit functionality)

#### 4.12.6 Extensions Info
- **Installed Extensions**:
  - pgcrypto (Cryptographic functions)
  - http (HTTP requests)
  - Version info
  - Status

---

## 5. Modal Components Specifications

### 5.1 Global Modal Design
- **Backdrop**: Semi-transparent dark overlay with blur effect
- **Container**: 
  - Max width: 600px (forms) / 900px (view modals)
  - Centered vertically and horizontally
  - Card background (#0F172A)
  - Border (#1E293B)
  - Shadow: Large cyan-tinted shadow
  - Rounded corners (16px)
- **Animation**: 
  - Fade in (300ms ease-in-out)
  - Scale from 0.95 to 1.0
- **Close Button**: 
  - X icon (top-right)
  - Hover: Rotate 90deg
  - ESC key support

### 5.2 Form Modal Pattern
- **Header**: 
  - Title (gradient text)
  - Subtitle (secondary text)
  - Close button
- **Body**: 
  - Form fields with labels
  - Consistent spacing (16px between fields)
  - Input styling: Border, focus cyan glow
  - Validation errors (red text below field)
- **Footer**: 
  - Left: Cancel button (secondary style)
  - Right: Action button (gradient primary style)
  - Separated by flex-grow spacer

### 5.3 View Modal Pattern
- **Header**: Same as Form Modal
- **Body**: 
  - Read-only data in sections
  - Section headers (secondary text, uppercase)
  - Data rows (label + value)
  - Copy buttons for IDs
  - Links to related entities (cyan underline)
- **Footer**: 
  - Action buttons (Edit, Delete, etc.)

### 5.4 Confirmation Modal Pattern
- **Compact size**: Max width 400px
- **Warning icon**: Red or yellow alert icon
- **Message**: Clear warning text
- **Checkbox**: "I understand the consequences" (if destructive)
- **Buttons**: 
  - Cancel (default)
  - Confirm (danger style: red background)

---

## 6. Data Table Component Specifications

### 6.1 Table Structure
- **Container**: Card background, border, padding
- **Header Row**: 
  - Sticky (position: sticky, top: 0)
  - Background with slight transparency
  - Sortable columns (click header)
  - Sort indicator (arrow icon)
- **Data Rows**: 
  - Alternating row colors (subtle)
  - Hover: Background change + border
  - Click: Highlight + trigger action
  - Height: 56px (comfortable)
- **Pagination**: 
  - Bottom footer
  - Page numbers
  - Prev/Next buttons
  - Rows per page selector
  - Total count display

### 6.2 Column Types
- **Text Column**: Left-aligned, truncate with ellipsis
- **Number Column**: Right-aligned
- **Date Column**: Formatted display (relative or absolute)
- **Boolean Column**: Badge (Yes/No, True/False)
- **Status Column**: Color-coded badge
- **Array Column**: Comma-separated or badge row
- **JSONB Column**: "View" button → opens JSON modal
- **Actions Column**: Icon buttons (Edit, Delete, View)

### 6.3 Table Features
- **Selection**: 
  - Checkbox column (first)
  - Select all (header checkbox)
  - Selected count indicator
  - Bulk actions bar (appears when items selected)
- **Expandable Rows**: 
  - Chevron icon (first or last)
  - Click to expand
  - Nested content (full details or related data)
- **Empty State**: 
  - Icon (database icon)
  - Message: "No records found"
  - Action button: "Add First Record"
- **Loading State**: 
  - Skeleton rows (shimmer animation)
  - Loading spinner in header

---

## 7. Input Components Specifications

### 7.1 Text Input
- Border: 1px solid #1E293B
- Background: #0F172A
- Padding: 12px 16px
- Border radius: 8px
- Focus: Border cyan (#22D3EE), glow shadow
- Placeholder: #94A388

### 7.2 Textarea
- Same styling as Text Input
- Min height: 100px
- Resize: vertical only

### 7.3 Dropdown/Select
- Same styling as Text Input
- Chevron icon (right)
- Options: Dark dropdown menu
- Search within dropdown (if many options)
- Selected: Cyan accent

### 7.4 Multi-Select
- Tags/chips for selected items
- Remove button per tag (X icon)
- Dropdown for adding more

### 7.5 Date Picker
- Calendar popup
- Dark theme
- Cyan accent for selected date
- Range selection support

### 7.6 Time Picker
- Hour : Minute selector
- AM/PM toggle or 24h format

### 7.7 Checkbox
- Custom styled
- Checked: Cyan background, white checkmark
- Unchecked: Border only

### 7.8 Radio Button
- Custom styled
- Selected: Cyan fill with white dot
- Unselected: Border only

### 7.9 Toggle Switch
- Track: Gray (off), Cyan (on)
- Knob: White with shadow
- Smooth slide animation

### 7.10 JSON Editor
- Code editor component
- Syntax highlighting
- Line numbers
- Format/Beautify button
- Validate button
- Error highlighting

---

## 8. Badge & Status Indicators

### 8.1 Status Badges
- **Online**: Green background, white text, pulse dot
- **Offline**: Gray background, white text
- **Active**: Green background
- **Pending**: Yellow background
- **Completed/Accepted**: Blue/Cyan background
- **Rejected**: Red background
- **Deleted**: Red background, strikethrough

### 8.2 Message Type Badges
- **Text**: Blue badge, "A" icon
- **Image**: Purple badge, Image icon
- **Audio**: Green badge, Mic icon
- **File**: Orange badge, File icon
- **Location**: Red badge, Map Pin icon

### 8.3 Call Type Badges
- **Audio**: Green badge, Phone icon
- **Video**: Blue badge, Video icon

### 8.4 Badge Styling
- Padding: 4px 8px
- Border radius: 4px
- Font size: 12px
- Font weight: 600
- Inline-flex with icon + text

---

## 9. Action Buttons Specifications

### 9.1 Primary Action Button
- Background: Gradient (cyan to blue)
- Text: White
- Padding: 10px 20px
- Border radius: 8px
- Font weight: 600
- Hover: Scale(1.05), shadow increase
- Active: Scale(0.98)
- Icon: Left or right of text
- Disabled: Opacity 0.5, cursor not-allowed

### 9.2 Secondary Action Button
- Background: Transparent
- Border: 1px solid #1E293B
- Text: #F8FAFC
- Same size as Primary
- Hover: Background #1E293B, border cyan

### 9.3 Danger Action Button
- Background: Red gradient (#EF4444 to #DC2626)
- Text: White
- Same size as Primary
- Hover: Shadow red-tinted

### 9.4 Icon Button
- Size: 36px × 36px
- Background: Transparent
- Hover: Background #1E293B
- Icon: 18px
- Border radius: 6px

### 9.5 Quick Action Buttons (Dashboard)
- Pill shape (rounded-full)
- Icon left, text right
- Padding: 12px 24px
- Background: #0F172A
- Border: #1E293B
- Hover: Border cyan, shadow

---

## 10. Loading & Empty States

### 10.1 Loading States
- **Full Page Loader**: 
  - Centered spinner (cyan gradient)
  - "Loading database..." text
  - Animated pulse

- **Table Skeleton**: 
  - Gray bars (shimmer animation)
  - Match table structure

- **Card Skeleton**: 
  - Gray rectangles (shimmer animation)
  - Match card layout

- **Button Loading**: 
  - Spinner icon (replaces button icon)
  - Text: "Processing..."
  - Disabled state

### 10.2 Empty States
- **Empty Table**: 
  - Database icon (large, gray)
  - "No {entity} found"
  - "Add your first {entity}" button

- **Empty Search**: 
  - Search icon (large, gray)
  - "No results for '{search_term}'"
  - "Try different keywords" text
  - Clear search button

- **Empty Filters**: 
  - Filter icon (large, gray)
  - "No results match your filters"
  - "Clear filters" button

---

## 11. Notification & Toast System

### 11.1 Toast Notifications
- **Position**: Top-right corner
- **Types**: Success, Error, Info, Warning
- **Duration**: 3-5 seconds (auto-dismiss)
- **Styling**: 
  - Card background
  - Icon (left)
  - Message (center)
  - Close button (right)
  - Colored left border (type-specific)
- **Animation**: Slide in from right, fade out

### 11.2 Toast Messages
- **Success**: 
  - "User created successfully"
  - "Message deleted"
  - "Data exported"
  
- **Error**: 
  - "Failed to update chat"
  - "Connection lost"
  - "Invalid query syntax"
  
- **Warning**: 
  - "Some fields are missing"
  - "Unsaved changes will be lost"
  
- **Info**: 
  - "Syncing database..."
  - "Query executed in 0.5s"

---

## 12. Responsive Design Requirements

### 12.1 Breakpoints
- **Desktop**: 1024px+
- **Tablet**: 768px - 1023px
- **Mobile**: < 768px

### 12.2 Mobile Adaptations
- **Sidebar**: 
  - Collapse to hamburger menu
  - Slide-in drawer from left
  - Overlay on content

- **Tables**: 
  - Horizontal scroll
  - Or Card view (stacked)
  - Reduce columns (hide non-essential)

- **Modals**: 
  - Full-screen on mobile
  - Slide up from bottom

- **Stats Cards**: 
  - Single column
  - Larger touch targets

- **Action Buttons**: 
  - Full width on mobile
  - Fixed bottom bar for primary actions

---

## 13. Performance Optimizations

### 13.1 Data Loading
- **Pagination**: Load 20-50 records at a time
- **Lazy Loading**: Load data on tab switch
- **Virtual Scrolling**: For large tables (1000+ rows)
- **Debounced Search**: 300ms delay
- **Cached Queries**: Store recent query results (5min cache)

### 13.2 Real-time Updates
- **WebSocket Connection**: Maintain single persistent connection
- **Selective Subscriptions**: Only subscribe to active table
- **Throttling**: Batch updates (max 1 update per second)
- **Optimistic UI**: Update UI immediately, rollback on error

### 13.3 Code Splitting
- Lazy load route components
- Lazy load chart library (on Analytics tab)
- Lazy load JSON editor (on Query Builder)

---

## 14. Error Handling

### 14.1 Error Types
- **Connection Error**: Database unreachable
- **Query Error**: Invalid SQL syntax
- **Permission Error**: Unauthorized operation
- **Validation Error**: Invalid form data
- **Not Found Error**: Record doesn't exist

### 14.2 Error Display
- **Toast Notification**: For quick errors
- **Inline Validation**: Below form fields
- **Error Modal**: For critical errors (with retry button)
- **Error Boundary**: Catch React errors, show fallback UI

### 14.3 Error Recovery
- **Retry Button**: For failed operations
- **Auto-Reconnect**: For connection losses (exponential backoff)
- **Undo Action**: For accidental deletions (5sec window)

---

## 15. Security & Permissions (Future)

### 15.1 Authentication (Placeholder)
- **Login Modal**: Username/Password
- **Session Management**: JWT token storage
- **Auto-Logout**: After 30min inactivity

### 15.2 Role-Based Access (Future)
- **Admin**: Full CRUD access
- **Editor**: Can edit, no delete
- **Viewer**: Read-only access

### 15.3 Audit Log (Future)
- Track all CRUD operations
- User, timestamp, action, table, record ID
- Display in Settings → Audit Log tab

---

## 16. Technical Stack

### 16.1 Core Technologies
- **Framework**: React 18+
- **Language**: TypeScript or JavaScript
- **State Management**: React useState/useReducer (LocalStorage for now)
- **Routing**: React Router v6 (or hash-based routing)
- **Styling**: Tailwind CSS (for design system consistency)
- **Icons**: Lucide React

### 16.2 Data Libraries
- **Charts**: Recharts or Chart.js
- **Date Handling**: date-fns or Day.js
- **JSON Editor**: Monaco Editor or react-json-view
- **UUID Generation**: uuid library

### 16.3 Database Connection (Phase 2)
- **Insforge SDK**: @insforge/client
- **API Integration**: REST or GraphQL endpoints
- **Real-time**: WebSocket subscriptions (via Insforge)

---

## 17. Data Flow Architecture

### 17.1 Phase 1 (Current - Mock Data)
```
UI Component
    ↓
useState (Local State)
    ↓
LocalStorage (Persistence)
```

### 17.2 Phase 2 (Insforge Integration)
```
UI Component
    ↓
React Query / SWR (Caching)
    ↓
Insforge SDK Functions
    ↓
Insforge API (PostgreSQL)
```

### 17.3 Real-time Subscriptions
```
Insforge PostgreSQL Trigger
    ↓
NOTIFY Channel
    ↓
WebSocket (Insforge)
    ↓
onSnapshotFromInsforge
    ↓
Update Local State
    ↓
Re-render UI
```

---

## 18. Development Phases

### Phase 1: Core UI & Mock Data (Current)
**Deliverables**:
- ✅ Complete UI implementation
- ✅ All 7 table management pages
- ✅ Dashboard with statistics
- ✅ CRUD modals
- ✅ LocalStorage persistence
- ✅ Search, filter, sort functionality
- ✅ WorkDesk design system applied

**Duration**: 1-2 weeks

### Phase 2: Insforge Integration
**Tasks**:
- Replace mock data with Insforge SDK calls
- Implement real-time subscriptions
- Error handling for API calls
- Loading states during fetch
- Connection status management

**Duration**: 1 week

### Phase 3: Advanced Features
**Tasks**:
- Query Builder (SQL execution)
- Analytics charts (Recharts integration)
- Export/Import functionality (JSON/CSV)
- Bulk operations
- Saved queries

**Duration**: 1 week

### Phase 4: Polish & Optimization
**Tasks**:
- Performance optimization (virtual scrolling)
- Mobile responsiveness refinements
- Accessibility (ARIA labels, keyboard navigation)
- Unit tests
- Documentation

**Duration**: 1 week

---

## 19. User Stories

### 19.1 Database Administrator

**Story 1**: As a DB Admin, I want to view all users in the database so I can monitor user registrations.
- **Acceptance Criteria**: 
  - Users page loads with table of all users
  - Table shows: name, email, status, created date
  - Search and filter work correctly

**Story 2**: As a DB Admin, I want to edit a user's information so I can correct errors.
- **Acceptance Criteria**: 
  - Click Edit button on user row
  - Modal opens with pre-filled form
  - Can update any field
  - Save button updates data

**Story 3**: As a DB Admin, I want to delete a user so I can remove test accounts.
- **Acceptance Criteria**: 
  - Click Delete button
  - Confirmation modal appears
  - Must check "I understand" box
  - User is removed from table after confirm

### 19.2 Support Team

**Story 4**: As a Support Agent, I want to search messages so I can investigate user-reported issues.
- **Acceptance Criteria**: 
  - Messages page has search input
  - Search works on message text, sender name
  - Results update in real-time (debounced)
  - Can click result to view full message

**Story 5**: As a Support Agent, I want to view a chat's messages so I can understand context of a report.
- **Acceptance Criteria**: 
  - Chats page shows list of chats
  - Click "View Messages" on chat row
  - Filters messages table to show only that chat's messages
  - Can see full conversation timeline

### 19.3 Developer

**Story 6**: As a Developer, I want to execute custom SQL queries so I can debug issues.
- **Acceptance Criteria**: 
  - Query Builder page has SQL editor
  - Can type any SELECT query
  - Click Execute shows results in table
  - Errors are displayed clearly

**Story 7**: As a Developer, I want to export all database data so I can create a backup.
- **Acceptance Criteria**: 
  - Dashboard has "Export Database" button
  - Click downloads JSON file with all tables
  - Filename includes timestamp
  - Data is properly formatted JSON

### 19.4 Product Manager

**Story 8**: As a Product Manager, I want to see user growth trends so I can report on KPIs.
- **Acceptance Criteria**: 
  - Analytics page shows "User Growth Over Time" chart
  - Line chart displays daily/weekly/monthly data
  - Can select date range
  - Chart is visually clear with cyan styling

**Story 9**: As a Product Manager, I want to see message activity statistics so I can understand engagement.
- **Acceptance Criteria**: 
  - Analytics page shows message count by type
  - Donut chart with percentages
  - Can click segment to filter messages table
  - Legend shows type names and counts

---

## 20. Testing Requirements

### 20.1 Unit Tests
- Test CRUD functions (add, edit, delete)
- Test search/filter logic
- Test form validation
- Test data transformation functions

### 20.2 Integration Tests
- Test Insforge SDK integration (Phase 2)
- Test real-time subscription updates
- Test data persistence (LocalStorage)

### 20.3 UI Tests
- Test modal open/close
- Test table sorting
- Test pagination
- Test responsive behavior

### 20.4 Manual Testing Checklist
- [ ] All pages load without errors
- [ ] All modals open and close properly
- [ ] Search works on all tables
- [ ] Filters apply correctly
- [ ] Sort works on all columns
- [ ] CRUD operations persist data
- [ ] Delete confirmations work
- [ ] Export functionality works
- [ ] Connection status updates
- [ ] Toast notifications appear
- [ ] Mobile view is usable

---

## 21. Accessibility Requirements

### 21.1 Keyboard Navigation
- All interactive elements focusable
- Tab order logical
- ESC closes modals
- Enter submits forms
- Arrow keys navigate tables

### 21.2 Screen Reader Support
- ARIA labels on all buttons
- ARIA roles on tables
- ARIA live regions for dynamic content
- Form labels properly associated

### 21.3 Visual Accessibility
- Sufficient color contrast (WCAG AA)
- Focus indicators visible
- Text resizable to 200%
- No content solely conveyed by color

---

## 22. Documentation Requirements

### 22.1 User Documentation
- **Getting Started Guide**: How to navigate the dashboard
- **Feature Guide**: Detailed explanation of each feature
- **FAQ**: Common questions and troubleshooting

### 22.2 Developer Documentation
- **Setup Instructions**: How to run locally
- **Code Structure**: Explanation of file organization
- **API Integration Guide**: How to connect to Insforge
- **Component Library**: Reusable component documentation

### 22.3 Database Schema Documentation
- ER diagram
- Table descriptions
- Relationship explanations
- Sample queries

---

## 23. Future Enhancements (Post-MVP)

### 23.1 Advanced Features
- **Batch Import**: CSV/Excel upload for bulk inserts
- **Data Relationships Graph**: Visual ERD with clickable nodes
- **Automated Backups**: Scheduled exports
- **Change History**: Audit log with undo/redo
- **Custom Dashboards**: User-configurable widgets
- **Report Builder**: Generate PDF reports
- **API Key Management**: Generate keys for external access
- **Webhook Configuration**: Trigger external APIs on data changes

### 23.2 Collaboration Features
- **Multi-user Support**: See who's online
- **Shared Queries**: Save and share queries with team
- **Comments**: Add notes to records
- **Activity Feed**: Real-time updates of team actions

### 23.3 Advanced Analytics
- **Predictive Analytics**: ML-based insights
- **Custom Metrics**: Define and track KPIs
- **Anomaly Detection**: Alert on unusual patterns
- **Trend Analysis**: Forecast future data

---

## 24. Success Metrics

### 24.1 Product Metrics
- **Time to Insight**: How quickly can user find data (target: <30s)
- **Task Completion Rate**: % of successful CRUD operations (target: >95%)
- **Error Rate**: % of failed operations (target: <5%)
- **User Satisfaction**: NPS score (target: >8/10)

### 24.2 Technical Metrics
- **Page Load Time**: <2s for any page
- **Query Execution Time**: <1s for most queries
- **Real-time Latency**: <500ms for updates
- **Uptime**: 99.9% availability

### 24.3 Usage Metrics
- **Daily Active Users**: Track adoption
- **Feature Usage**: Which pages are most visited
- **Average Session Duration**: Engagement indicator
- **Queries per Day**: Developer productivity metric

---

## 25. Risk Assessment

### 25.1 Technical Risks
**Risk**: Insforge API rate limiting  
**Mitigation**: Implement caching, batch requests, show loading states

**Risk**: Large dataset performance (100k+ messages)  
**Mitigation**: Virtual scrolling, server-side pagination, indexed queries

**Risk**: Real-time connection drops  
**Mitigation**: Auto-reconnect with exponential backoff, offline mode

### 25.2 User Experience Risks
**Risk**: Accidental data deletion  
**Mitigation**: Confirmation dialogs, undo functionality, soft deletes

**Risk**: Overwhelming interface for new users  
**Mitigation**: Tooltips, onboarding tour, clear empty states

**Risk**: Mobile usability issues  
**Mitigation**: Responsive design, touch-friendly targets, swipe gestures

### 25.3 Security Risks
**Risk**: Exposed database credentials  
**Mitigation**: Environment variables, never commit secrets, use proxy API

**Risk**: Unauthorized access  
**Mitigation**: Authentication layer, role-based permissions (Phase 3)

**Risk**: SQL injection in Query Builder  
**Mitigation**: Parameterized queries, input sanitization, read-only user

---

## 26. Dependencies

### 26.1 External Dependencies
- **Insforge.dev**: Database hosting and API
- **Antigravity**: Database setup tool
- **Lucide React**: Icon library
- **Tailwind CSS**: Styling framework

### 26.2 Optional Dependencies
- **Recharts**: Chart library (Analytics)
- **Monaco Editor**: Code editor (Query Builder)
- **date-fns**: Date formatting
- **React Query**: Data fetching (Phase 2)

---

## 27. Deployment Strategy

### 27.1 Local Development
- Run with `npm run dev` or `yarn dev`
- Environment variables in `.env.local`
- Hot reload enabled

### 27.2 Production Build
- Build with `npm run build`
- Optimize bundle size
- Deploy to Vercel/Netlify/Cloudflare Pages

### 27.3 Environment Variables
```
REACT_APP_INSFORGE_API_URL=
REACT_APP_INSFORGE_PROJECT_ID=
REACT_APP_INSFORGE_API_KEY=
```

---

## 28. Conclusion

This PRD defines a comprehensive database management dashboard for AMIK CHAT that maintains the clean, modern aesthetic of the WorkDesk design system while providing full database control without needing to access Insforge.dev directly.

**Key Takeaways**:
- **7 database tables** with complete CRUD functionality
- **Real-time monitoring** and updates
- **Advanced features**: Query builder, analytics, export/import
- **Consistent design**: Dark mode, cyan/blue accents, smooth animations
- **Mobile-responsive** and accessible
- **Phased development**: Mock data → Insforge integration → Advanced features

**Next Steps**:
1. Review and approve PRD
2. Begin Phase 1 development (UI + Mock data)
3. Set up Insforge SDK integration
4. Iterate based on user feedback

---

**Document Status**: Draft v1.0  
**Last Updated**: February 12, 2026  
**Prepared By**: Product Team  
**Approved By**: [Pending]

---

*End of Product Requirements Document*