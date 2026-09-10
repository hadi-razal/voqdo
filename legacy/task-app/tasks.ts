export type WorkItem = {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  completed?: boolean;
};

export function isoDate(offsetDays = 0) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDayLabel(date = new Date()) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export function formatClockTime(date = new Date()) {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function timeToMinutes(time: string) {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return Number.MAX_SAFE_INTEGER;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3].toUpperCase();
  if (meridiem === 'PM' && hours !== 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

const today = isoDate(0);
const tomorrow = isoDate(1);

export const INITIAL_TASKS: WorkItem[] = [
  {
    id: 1,
    title: 'Check office emails',
    description: 'Review important emails and reply to pending messages.',
    date: today,
    time: '09:00 AM',
    completed: true,
  },
  {
    id: 2,
    title: 'Daily team meeting',
    description: 'Discuss todays priorities and pending work with the team.',
    date: today,
    time: '09:30 AM',
    completed: true,
  },
  {
    id: 3,
    title: 'Update Zoho CRM',
    description: 'Review customer records and update missing information.',
    date: today,
    time: '10:00 AM',
  },
  {
    id: 4,
    title: 'Fix website issue',
    description: 'Investigate and fix the reported website loading issue.',
    date: today,
    time: '10:45 AM',
  },
  {
    id: 5,
    title: 'Review project requirements',
    description: 'Go through the requirements for the upcoming development task.',
    date: today,
    time: '11:30 AM',
  },
  {
    id: 6,
    title: 'Lunch break',
    description: 'Take a break and have lunch.',
    date: today,
    time: '01:00 PM',
  },
  {
    id: 7,
    title: 'Work on mobile app',
    description: 'Continue development of the current mobile application.',
    date: today,
    time: '02:00 PM',
  },
  {
    id: 8,
    title: 'Test API integration',
    description: 'Test API requests and verify returned data.',
    date: today,
    time: '03:00 PM',
  },
  {
    id: 9,
    title: 'Client follow-up',
    description: 'Follow up with the client regarding the pending approval.',
    date: today,
    time: '04:00 PM',
  },
  {
    id: 10,
    title: 'Backup project files',
    description: 'Create a backup of important project files and documents.',
    date: today,
    time: '05:00 PM',
  },
  {
    id: 11,
    title: 'Practice DSA',
    description: 'Solve two DSA problems and review the solutions.',
    date: today,
    time: '06:30 PM',
  },
  {
    id: 12,
    title: 'Study machine learning',
    description: 'Continue the current machine learning topic and take notes.',
    date: today,
    time: '07:30 PM',
  },
  {
    id: 13,
    title: 'Football',
    description: 'Play football and complete the evening workout.',
    date: today,
    time: '09:00 PM',
  },
  {
    id: 14,
    title: 'Review GitHub commits',
    description: 'Check today’s code changes and push pending updates.',
    date: today,
    time: '10:30 PM',
  },
  {
    id: 15,
    title: 'Plan tomorrow',
    description: 'Prepare the priority task list for tomorrow.',
    date: today,
    time: '11:00 PM',
  },
  {
    id: 16,
    title: 'Prepare client quotation',
    description: 'Update pricing and prepare the quotation for the client.',
    date: tomorrow,
    time: '10:00 AM',
  },
  {
    id: 17,
    title: 'Server maintenance',
    description: 'Check server status, storage usage, and application logs.',
    date: tomorrow,
    time: '02:30 PM',
  },
  {
    id: 18,
    title: 'Weekly progress review',
    description: 'Review completed tasks and progress for the week.',
    date: tomorrow,
    time: '05:30 PM',
  },
];
