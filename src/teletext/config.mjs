export const TELETEXT_CONFIG = {
  // Feed URLs (duplicated from main config to avoid CJS/ESM issues)
  m3uUrl: "http://192.168.20.186:9191/output/m3u",
  xmltvUrl: "http://192.168.20.186:9191/output/epg",
  allowedGroups: ["UK - Documentaries", "UK - Entertainment", "UK - Movies", "UK - Sports"],
  stripNamePrefixes: true,
  channelLimit: 0,

  // Teletext-specific
  outputDir: "./teletext-pages",
  serviceName: "TV Guide",
  indexTitle: "THE CHANNEL GUIDE INDEX",
  indexPage: 0x100,
  todayPageBase: 0x110,
  tomorrowPageBase: 0x210,
  scheduleCarouselSeconds: 15,
  indexCarouselSeconds: 10,

  // Channel slot mapping: channel number -> slot offset (0-89)
  // When autoSlotMap is true, slots are assigned from M3U order
  autoSlotMap: true,
  channelSlotMap: {},
};
