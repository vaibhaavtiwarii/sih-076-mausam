export const weather = {
  location: 'Bengaluru, Karnataka',
  date: 'Thursday, September 3',
  time: '10:42 AM',
  temperature: 28,
  condition: 'Partly Cloudy',
  feelsLike: 30,
  humidity: 80,
  wind: 8,
  uv: 7,
  rain: 15,
}

export const hourlyForecast = [
  { time: '6 AM', temp: 26, icon: 'sun', rain: 8 },
  { time: '7 AM', temp: 27, icon: 'sun', rain: 8 },
  { time: '8 AM', temp: 28, icon: 'cloud-sun', rain: 10 },
  { time: '9 AM', temp: 29, icon: 'cloud-sun', rain: 11 },
  { time: '12 PM', temp: 32, icon: 'sun', rain: 15 },
  { time: '3 PM', temp: 33, icon: 'cloud', rain: 24 },
  { time: '5 PM', temp: 31, icon: 'rain', rain: 62 },
  { time: '7 PM', temp: 28, icon: 'rain', rain: 70 },
]

export const personas = {
  Fitness: {
    icon: 'fitness',
    title: 'Fitness Enthusiast',
    activity: 'Running',
    preferences: ['Outdoor activities', 'Morning workouts'],
    summary: 'Best workout window',
    score: 88,
    metricLabel: 'Running score',
    metric: '88 / 100',
    details: ['UV 7 → moderate', 'Heat → manageable', 'Rain → low risk'],
  },
  Agriculture: {
    icon: 'leaf',
    title: 'Agriculture',
    activity: 'Field planning',
    preferences: ['Crop health', 'Water planning'],
    summary: 'Rainfall outlook',
    score: 79,
    metricLabel: 'Irrigation readiness',
    metric: '79 / 100',
    details: ['Rainfall → moderate', 'Soil moisture → stable', 'Frost → minimal risk'],
  },
  Travel: {
    icon: 'plane',
    title: 'Travel',
    activity: 'City exploration',
    preferences: ['Flexible plans', 'Outdoor sightseeing'],
    summary: 'Destination conditions',
    score: 84,
    metricLabel: 'Travel confidence',
    metric: '84 / 100',
    details: ['Visibility → good', 'Rain → manageable', 'Packing → light layer'],
  },
  Family: {
    icon: 'users',
    title: 'Family',
    activity: 'School commute',
    preferences: ['School timings', 'Rain awareness'],
    summary: 'School commute',
    score: 81,
    metricLabel: 'Family comfort',
    metric: '81 / 100',
    details: ['Morning → clear', 'Rain → low risk', 'Outdoor time → good'],
  },
  Commute: {
    icon: 'car',
    title: 'Commute',
    activity: 'Morning commute',
    preferences: ['Traffic timing', 'Visibility'],
    summary: 'Commute impact',
    score: 76,
    metricLabel: 'Commute confidence',
    metric: '76 / 100',
    details: ['Fog → low', 'Visibility → good', 'Storm risk → low'],
  },
  Events: {
    icon: 'calendar',
    title: 'Events',
    activity: 'Outdoor Event',
    preferences: ['Guest comfort', 'Rain protection'],
    summary: 'Best event window',
    score: 74,
    metricLabel: 'Event suitability',
    metric: '74 / 100',
    details: ['Rain → moderate later', 'Comfort → good', 'Window → 4–6 PM'],
  },
}

export const activities = [
  { name: 'Running', icon: 'run', score: 88, time: '6:00–7:15 AM', explanation: 'Cooler, lower UV, low rain risk.' },
  { name: 'Cycling', icon: 'bike', score: 82, time: '6:30–8:00 AM', explanation: 'Comfortable wind and mild temperatures.' },
  { name: 'Outdoor Event', icon: 'event', score: 74, time: '4:00–6:00 PM', explanation: 'Good comfort before showers build.' },
]

export const alerts = [
  { level: 'HIGH PRIORITY', tone: 'danger', title: 'Morning commute at risk', body: 'Heavy rain expected around 8:00 AM.', action: 'View impact' },
  { level: 'MEDIUM PRIORITY', tone: 'warning', title: 'Your run window may change', body: 'Rain probability increases after 5 PM.', action: 'See alternatives' },
  { level: 'SAFE', tone: 'safe', title: 'Evening event looks good', body: 'No significant weather changes detected.', action: 'View details' },
]

export const quickPrompts = [
  'Can I go running at 5 PM?',
  'Will rain affect my event?',
  "What's the best time to cycle today?",
  'What should I prepare for tomorrow?',
]

export const assistantResponses = {
  default: "5 PM isn't ideal today. A better window is 6:00–7:15 AM because temperatures and UV levels are lower, with a lower chance of rain.",
  event: 'Your event has a good window from 4:00–6:00 PM. Rain risk rises later, so an earlier start gives you more buffer.',
  cycle: 'Cycling is strongest between 6:30–8:00 AM. Wind stays comfortable and temperatures are milder than the afternoon.',
  prepare: 'Carry light rain protection, stay hydrated, and plan outdoor activity before the higher rain probability later in the day.',
}
