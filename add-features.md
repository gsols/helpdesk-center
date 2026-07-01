1. Email Notifications
What: Automatic email alerts when ticket status changes

Features:

Employee receives email when ticket is created
Employee notified when agent responds
Agent notified when new ticket assigned
Email contains ticket link and summary
Tech Stack:

Spring Boot Mail
Email templates (Thymeleaf)
SMTP configuration (Gmail, SendGrid)
Business Value: Reduces need for users to constantly check dashboard

2. 2. Ticket Search & Advanced Filtering
What: Full-text search and multi-criteria filtering

Features:

Search by keyword in title/description
Filter by date range
Filter by multiple statuses simultaneously
Filter by priority
Sort by created date, updated date, priority


3. 3. Ticket Assignment System
What: Manually or automatically assign tickets to specific agents

Features:

Dropdown to assign ticket to specific agent
"Assign to Me" button for agents
View "My Assigned Tickets" vs "Unassigned Tickets"
Assignment history tracking
Tech Stack:

Update tickets table (already has assigned_to field)
Add assignment endpoint
React dropdown component
Business Value: Clear ownership, accountability

4. Ticket Priority Escalation
What: Automatically escalate priority based on time

Features:

If ticket open > 24 hours → increase priority
If ticket open > 48 hours → mark as critical
Scheduled job runs every hour
Visual indicator for escalated tickets
Tech Stack:

Spring @Scheduled tasks
Update priority logic
Visual badges in UI
Business Value: Prevents tickets from being forgotten


