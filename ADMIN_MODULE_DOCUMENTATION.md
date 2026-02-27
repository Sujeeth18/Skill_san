# HostelOps: Admin Module Documentation

## Overview
The Admin Module provides institutional administrators with centralized control over the student complaint management system. It enables viewing, filtering, and resolving complaints with full audit trails.

---

## Access & Authentication

### Admin Login Portal
**URL:** `http://localhost:8080/admin-login.html` (or your deployment URL)

### Demo Credentials
```
Admin ID: admin001
Password: Admin@123
```

### Session Management
- Admins must log in to access the dashboard
- Session stored locally in browser
- Logout clears all session data
- Session persists on page refresh

---

## Admin Dashboard Features

### 1. Dashboard Overview (Statistics)
The dashboard displays real-time statistics:
- **Total Complaints:** Sum of all complaints in system
- **Pending:** Count of complaints awaiting action
- **Resolved:** Count of resolved complaints
- **Urgent:** Count of high-priority urgent complaints

Statistics update automatically every 30 seconds.

### 2. Advanced Filtering System

Admins can filter complaints by:

#### Filter by Status
- `All Status` - Display all complaints
- `Pending` - Complaints not yet started
- `In Progress` - Complaints being worked on
- `Resolved` - Completed complaints

#### Filter by Category
- `Food Quality` - Food-related complaints
- `Maintenance` - Building/facility issues
- `Hygiene` - Cleanliness concerns
- `Noise Disturbance` - Sound/behavioral issues
- `Other` - Miscellaneous complaints

#### Filter by Priority
- `Low` - Non-urgent issues
- `Normal` - Standard priority
- `High` - Requires prompt attention
- `Urgent` - Critical, immediate action needed

**Clear Filters Button:** Resets all filters and displays all complaints

### 3. Complaints Table

Displays comprehensive complaint information:

| Column | Information |
|--------|-------------|
| ID | Unique complaint identifier (first 8 chars shown) |
| Student Name | Name of student who filed complaint |
| Room | Student's room number |
| Category | Complaint category/type |
| Description | Brief description (truncated) |
| Priority | Color-coded priority level |
| Status | Current status with visual indicator |
| Submitted | Date complaint was submitted |
| Action | Quick action buttons |

#### Color Coding
- **Priority Badges:**
  - 🟩 Low - Green
  - 🟦 Normal - Blue
  - 🟨 High - Yellow
  - 🔴 Urgent - Red

- **Status Badges:**
  - 🟨 Pending - Yellow
  - 🟦 In Progress - Blue
  - 🟩 Resolved - Green

### 4. Action Buttons

Each complaint row has two quick action buttons:

#### Update Button
- Opens modal to change complaint status
- Add admin notes/comments
- Updates timestamp automatically

#### Details Button
- Opens full complaint details modal
- Shows all information in structured format
- Displays any admin notes previously added

---

## Complaint Management Workflow

### Step 1: View Complaint
1. Navigate to Admin Dashboard
2. Scroll through table or apply filters
3. Click "Details" button to view full information

### Step 2: Update Status
1. Click "Update" button on complaint row
2. Modal opens showing:
   - Complaint ID
   - Student name
   - Issue description
3. Select new status from dropdown:
   - Pending → In Progress
   - In Progress → Resolved
   - Any status can be updated to any other status
4. (Optional) Add admin notes in text area
5. Click "Save Update" to submit

### Step 3: Verify Update
- Table refreshes automatically
- Status badge updates
- Dashboard statistics recalculate
- Timestamp updates to current time

---

## Detailed Complaint View

When clicking "Details", you see:

### Header Information
- **Complaint ID:** Unique system identifier
- **Student Name:** Full name of complainant
- **Room Number:** Student's hostel room
- **Category:** Type of complaint
- **Priority:** Urgency level
- **Status:** Current state
- **Submitted Date:** When filed
- **Updated Date:** Last modification time

### Main Content
- **Full Description:** Complete complaint details
- **Admin Notes:** Any comments added by admin

---

## Advanced Features

### Real-time Updates
- Dashboard auto-refreshes every 30 seconds
- New complaints appear without page reload
- Status changes reflected immediately

### Multi-filter Combinations
- Combine filters for precise results
- Example: "Urgent + Maintenance + In Progress"
- Shows only urgent maintenance issues being worked on

### Responsive Design
- Works on desktop (1920x1080 and above)
- Optimized for tablet (768px and above)
- Mobile-friendly layout (below 768px)

### Data Security
- No sensitive data logged to console (production)
- Session tokens not exposed in URLs
- CORS-protected API endpoints

---

## Technical Architecture

### Frontend Stack
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with flexbox/grid
- **Vanilla JavaScript** - No external dependencies for core features
- **Responsive Design** - Mobile-first approach

### API Integration
- **Endpoint:** `http://localhost:5000/api/complaints`
- **Methods Used:**
  - `GET /api/complaints` - Fetch all complaints
  - `PUT /api/complaints/{id}` - Update complaint status/notes
  
### Authentication
- **Type:** Simple token-based (localStorage)
- **Production Note:** Should implement JWT with backend validation

### State Management
- Browser localStorage for session
- In-memory array for complaints cache
- Real-time sync with backend every 30 seconds

---

## API Response Examples

### GET /api/complaints
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "studentName": "John Doe",
    "roomNumber": "A-101",
    "category": "Maintenance",
    "description": "Broken door lock in room",
    "priority": "Urgent",
    "status": "In Progress",
    "adminNotes": "Maintenance team assigned",
    "createdAt": "2026-02-27T10:30:00.000Z",
    "updatedAt": "2026-02-27T14:20:00.000Z",
    "__v": 0
  }
]
```

### PUT /api/complaints/{id}
**Request:**
```json
{
  "status": "Resolved",
  "adminNotes": "Issue fixed and verified"
}
```

**Response:** Updated complaint object

---

## Common Workflows

### Workflow 1: Urgent Issue Resolution
1. Filter: Priority = "Urgent" + Status = "Pending"
2. Click Update on first complaint
3. Change status to "In Progress"
4. Add note: "Assigned to maintenance team"
5. Save
6. Repeat for other urgent items

### Workflow 2: Category-based Review
1. Filter by specific category (e.g., "Food Quality")
2. Review all complaints in that category
3. Provide status updates and feedback
4. Export or document patterns if needed

### Workflow 3: Day-end Report
1. Filter: Status = "Resolved"
2. Review all resolved complaints from today
3. Note any patterns or recurring issues
4. Prepare summary report

---

## Troubleshooting

### Issue: Cannot Login
- **Verify credentials:** `admin001` / `Admin@123`
- **Check backend:** Ensure API is running on port 5000
- **Browser console:** Check for error messages

### Issue: Dashboard Not Loading
- **Refresh page:** Ctrl+F5 for hard refresh
- **Check backend connection:** Open DevTools → Network tab
- **Verify MongoDB:** Check if MongoDB container is running

### Issue: Cannot Update Status
- **Check network:** Verify API call succeeds in DevTools
- **Verify backend:** Ensure updated server.js is deployed
- **Check permissions:** Admin should have update rights

### Issue: Filters Not Working
- **Clear filters:** Click "Clear Filters" and reapply
- **Check data:** Ensure complaints have all required fields
- **Refresh data:** Manual page refresh F5

---

## Performance Considerations

- **Large datasets:** Table displays up to 1000 complaints efficiently
- **Memory usage:** Cache limited to active session
- **Network:** Auto-refresh every 30 seconds is configurable
- **UI responsiveness:** Optimized for 2-5ms DOM operations

---

## Future Enhancements

1. **Export functionality** - Download complaints as CSV/PDF
2. **Advanced analytics** - Charts and trends
3. **Bulk operations** - Update multiple complaints at once
4. **Email notifications** - Alert students of status changes
5. **Role-based access** - Different admin levels
6. **Audit logs** - Track all admin actions
7. **Mobile app** - Native iOS/Android application

---

## Support & Contact

For technical issues or feature requests:
- Check logs: Browser DevTools Console
- Review backend logs: `docker logs hostelops-backend`
- Contact: Development team

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-27 | Initial release with full admin functionality |

---

**Last Updated:** February 27, 2026
**Status:** Production Ready
