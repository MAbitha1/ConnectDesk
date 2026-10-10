export const INITIAL_CUSTOMERS = [
  {
    id: 'cust-1',
    name: 'Sarah Jenkins',
    company: 'Acme Corporation',
    email: 'sarah.jenkins@acme.corp',
    phone: '+1 (555) 234-5678',
    status: 'Customer',
    dealValue: 24500,
    lastContact: '2026-10-07',
    notes: 'Key enterprise account. Interested in Q4 expansion package.'
  },
  {
    id: 'cust-2',
    name: 'Marcus Vance',
    company: 'Nexus Technologies',
    email: 'marcus.vance@nexus.io',
    phone: '+1 (555) 876-5432',
    status: 'Proposal',
    dealValue: 18000,
    lastContact: '2026-10-08',
    notes: 'Proposal sent on Oct 5th. Awaiting procurement review.'
  },
  {
    id: 'cust-3',
    name: 'Elena Rostova',
    company: 'Vanguard Global',
    email: 'elena@vanguardglobal.com',
    phone: '+1 (555) 345-6789',
    status: 'Contacted',
    dealValue: 12000,
    lastContact: '2026-10-06',
    notes: 'Initial discovery call completed. Scheduled demo presentation.'
  },
  {
    id: 'cust-4',
    name: 'David Chen',
    company: 'Horizon Financial',
    email: 'd.chen@horizonfin.com',
    phone: '+1 (555) 987-6543',
    status: 'Lead',
    dealValue: 35000,
    lastContact: '2026-10-04',
    notes: 'Inbound lead via web form. Needs product demo.'
  },
  {
    id: 'cust-5',
    name: 'Amara Okafor',
    company: 'Pulse Health Systems',
    email: 'a.okafor@pulsehealth.org',
    phone: '+1 (555) 456-7890',
    status: 'Customer',
    dealValue: 42000,
    lastContact: '2026-10-02',
    notes: 'Annual subscription renewed. Onboarding 15 team members.'
  },
  {
    id: 'cust-6',
    name: 'Liam Gallagher',
    company: 'Starlight Media Group',
    email: 'liam@starlightmedia.co',
    phone: '+1 (555) 654-3210',
    status: 'Inactive',
    dealValue: 8500,
    lastContact: '2026-09-15',
    notes: 'Paused contract pending internal budget realignment.'
  }
];

export const INITIAL_TASKS = [
  {
    id: 'task-1',
    title: 'Send updated contract draft to Nexus Technologies',
    customerName: 'Marcus Vance',
    priority: 'High',
    dueDate: '2026-10-10',
    status: 'Pending',
    category: 'Proposal'
  },
  {
    id: 'task-2',
    title: 'Schedule Q4 QBR with Sarah Jenkins',
    customerName: 'Sarah Jenkins',
    priority: 'Medium',
    dueDate: '2026-10-12',
    status: 'Pending',
    category: 'Account Management'
  },
  {
    id: 'task-3',
    title: 'Prepare product custom demo environment for Elena',
    customerName: 'Elena Rostova',
    priority: 'High',
    dueDate: '2026-10-09',
    status: 'In Progress',
    category: 'Sales Demo'
  },
  {
    id: 'task-4',
    title: 'Follow up on inbound lead inquiry from Horizon',
    customerName: 'David Chen',
    priority: 'Medium',
    dueDate: '2026-10-11',
    status: 'Pending',
    category: 'Lead Nurturing'
  },
  {
    id: 'task-5',
    title: 'Send welcome onboarding pack to Pulse Health',
    customerName: 'Amara Okafor',
    priority: 'Low',
    dueDate: '2026-10-07',
    status: 'Completed',
    category: 'Onboarding'
  }
];

export const INITIAL_FOLLOWUPS = [
  {
    id: 'fol-1',
    customerName: 'Marcus Vance',
    company: 'Nexus Technologies',
    scheduledDate: '2026-10-10T10:00',
    type: 'Call',
    notes: 'Review revised proposal terms and pricing structure.',
    completed: false
  },
  {
    id: 'fol-2',
    customerName: 'Elena Rostova',
    company: 'Vanguard Global',
    scheduledDate: '2026-10-11T14:30',
    type: 'Demo',
    notes: 'Live walkthrough of enterprise analytics feature set.',
    completed: false
  },
  {
    id: 'fol-3',
    customerName: 'David Chen',
    company: 'Horizon Financial',
    scheduledDate: '2026-10-12T11:15',
    type: 'Email',
    notes: 'Send technical compliance document and security overview.',
    completed: false
  },
  {
    id: 'fol-4',
    customerName: 'Sarah Jenkins',
    company: 'Acme Corporation',
    scheduledDate: '2026-10-14T15:00',
    type: 'Meeting',
    notes: 'Q4 strategic review and seat upgrade opportunity.',
    completed: false
  }
];

export const INITIAL_ACTIVITIES = [
  {
    id: 'act-1',
    text: 'Proposal sent to Marcus Vance (Nexus Technologies)',
    timestamp: '2 hours ago',
    type: 'deal'
  },
  {
    id: 'act-2',
    text: 'Completed onboarding call with Amara Okafor',
    timestamp: '5 hours ago',
    type: 'customer'
  },
  {
    id: 'act-3',
    text: 'New lead added: David Chen (Horizon Financial)',
    timestamp: '1 day ago',
    type: 'customer'
  },
  {
    id: 'act-4',
    text: 'Task completed: Send onboarding pack to Pulse Health',
    timestamp: '1 day ago',
    type: 'task'
  },
  {
    id: 'act-5',
    text: 'Follow-up scheduled with Elena Rostova for Oct 11',
    timestamp: '2 days ago',
    type: 'followup'
  }
];
