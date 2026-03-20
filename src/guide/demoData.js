export const DEMO_CHANNELS = [
  { num: 1, name: "Sky One", programmes: [
    { start: "6:00", title: "Batfink" },
    { start: "6:30", title: "DJ Kat Show" },
    { start: "9:25", title: "Hercules: The Legendary Journeys" },
    { start: "10:15", title: "Xena: Warrior Princess" },
  ]},
  { num: 2, name: "Sky 2", programmes: [
    { start: "6:00", title: "Shop on the Box" },
    { start: "9:00", title: "Sally Jessy Raphael" },
    { start: "10:00", title: "Oprah Winfrey" },
  ]},
  { num: 3, name: "UK Gold", programmes: [
    { start: "6:00", title: "Open All Hours" },
    { start: "6:30", title: "Are You Being Served?" },
    { start: "7:00", title: "Keeping Up Appearances" },
    { start: "7:30", title: "Last of the Summer Wine" },
  ]},
  { num: 5, name: "UK Living", programmes: [
    { start: "6:00", title: "Infomercial" },
    { start: "7:00", title: "Good Morning with Anne and Nick" },
    { start: "9:00", title: "Supermarket Sweep" },
  ]},
  { num: 6, name: "Sky News", programmes: [
    { start: "6:00", title: "Sky News Sunrise" },
    { start: "9:00", title: "Sky News at Nine" },
    { start: "10:00", title: "Sky News at Ten" },
  ]},
  { num: 7, name: "CNN", programmes: [
    { start: "7:00", title: "CNN World News" },
    { start: "8:00", title: "CNN Moneyline" },
    { start: "9:00", title: "CNN Newsnight" },
  ]},
  { num: 8, name: "Euronews", programmes: [
    { start: "7:00", title: "News Bulletin" },
    { start: "8:00", title: "Euronews Magazine" },
    { start: "9:00", title: "World Business Report" },
  ]},
  { num: 9, name: "EBN", programmes: [
    { start: "7:00", title: "EBN Breakfast: Focus Europe / Focus Asia" },
    { start: "9:00", title: "Business Day" },
    { start: "10:00", title: "Markets in Motion" },
  ]},
  { num: 10, name: "NCTV", programmes: [
    { start: "7:00", title: "ScreenScene" },
    { start: "8:00", title: "The Wire" },
    { start: "9:00", title: "Local News" },
  ]},
  { num: 11, name: "Nick", programmes: [
    { start: "7:00", title: "Teenage Mutant Hero Turtles" },
    { start: "7:30", title: "Rugrats" },
    { start: "8:00", title: "Hey Arnold!" },
  ]},
  { num: 12, name: "Eurosport", programmes: [
    { start: "7:30", title: "Mountain Bike: Grundig / UCI World Cup" },
    { start: "9:00", title: "Eurosport News" },
    { start: "9:30", title: "Tour de France Highlights" },
  ]},
  { num: 14, name: "Sky Sports 1", programmes: [
    { start: "7:00", title: "Gillette World Sport Special" },
    { start: "8:00", title: "Premier League Football Review" },
    { start: "9:00", title: "Ringside" },
  ]},
  { num: 15, name: "Sky Movies", programmes: [
    { start: "7:30", title: "Baby's Day Out (1994) Cert: PG" },
    { start: "9:15", title: "The Shawshank Redemption (1994) Cert: 15" },
    { start: "11:30", title: "Congo (1995) Cert: PG" },
  ]},
  { num: 25, name: "Ice", programmes: [
    { start: "6:30", title: "Iznogoud" },
    { start: "7:30", title: "Sci-Fi Knightmare" },
    { start: "9:00", title: "The Outer Limits" },
  ]},
];

export function buildDemoGuidePayload() {
  return {
    source: "demo",
    generatedAt: new Date().toISOString(),
    channels: DEMO_CHANNELS,
  };
}
