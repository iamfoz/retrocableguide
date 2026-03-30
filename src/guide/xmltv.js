import { parseXmltv } from "@iptv/xmltv";
import { parseM3U } from "@iptv/playlist";
import { buildDemoGuidePayload } from "./demoData.js";

const STALE_SCHEDULE_WINDOW_MS = 6 * 60 * 60 * 1000;

function decodeXmlEntities(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)));
}

function normaliseName(value) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function extractChannelNumber(value) {
  const match = value?.match(/\b(\d{1,4})\b/);
  return match ? Number(match[1]) : null;
}

function formatTimeValue(date, timeFormat) {
  if (timeFormat === "12h") {
    const hour12 = date.getHours() % 12 || 12;
    return `${hour12}:${String(date.getMinutes()).padStart(2, "0")}`;
  }

  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function formatProgrammeTime(date, timeFormat) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "--:--";
  }

  return formatTimeValue(date, timeFormat);
}

function parseXmltvData(xml) {
  const result = parseXmltv(xml);

  const channels = result.channels.map((ch) => ({
    id: ch.id || "",
    displayNames: (ch.displayName || []).map((d) => decodeXmlEntities(d._value)),
    iconUrl: ch.icon?.[0]?.src || "",
  }));

  const seen = new Set();
  const programmes = [];
  for (const p of result.programmes) {
    const key = `${p.channel}|${p.start}|${p.title?.[0]?._value}`;
    if (seen.has(key)) continue;
    seen.add(key);
    programmes.push({
      channel: p.channel || "",
      start: p.start ? new Date(p.start) : null,
      stop: p.stop ? new Date(p.stop) : null,
      title: decodeXmlEntities(p.title?.[0]?._value || "Unknown Programme"),
      subTitle: decodeXmlEntities(p.subTitle?.[0]?._value || ""),
    });
  }

  return { channels, programmes };
}

function stripChannelPrefix(name) {
  return name.replace(/^[A-Z]{2}\s*(?:\||-)\s*/i, "").trim();
}

function parsePlaylist(text, config) {
  const result = parseM3U(text);

  const entries = [];
  for (const ch of result.channels) {
    const groupTitle = ch.groupTitle || "";

    if (config.allowedGroups?.length && !config.allowedGroups.includes(groupTitle)) {
      continue;
    }

    const rawName = ch.tvgName || ch.name || "Unknown Channel";
    const extras = ch.extras || {};

    entries.push({
      num: Number(extras["channel-number"] || extras["tvg-chno"] || 0),
      name: config.stripNamePrefixes ? stripChannelPrefix(rawName) : rawName,
      rawName,
      groupTitle,
      xmltvId: ch.tvgId || "",
      logoUrl: ch.tvgLogo || "",
      streamUrl: ch.url || "",
    });
  }

  return entries;
}

function pickNowAndNext(programmes, now) {
  if (!programmes.length) {
    return [];
  }

  const currentIndex = programmes.findIndex((programme, index) => {
    const startsBeforeNow = programme.start && programme.start <= now;
    const nextProgramme = programmes[index + 1];
    const stopsAfterNow = programme.stop
      ? programme.stop > now
      : nextProgramme?.start
        ? nextProgramme.start > now
        : true;

    return startsBeforeNow && stopsAfterNow;
  });

  if (currentIndex >= 0) {
    const currentProgramme = programmes[currentIndex];
    const nextProgramme = programmes
      .slice(currentIndex + 1)
      .find((programme) => programme.start && currentProgramme.stop
        ? programme.start >= currentProgramme.stop
        : programme.start && currentProgramme.start && programme.start > currentProgramme.start);

    return [currentProgramme, nextProgramme].filter(Boolean);
  }

  const upcomingIndex = programmes.findIndex((programme) => programme.start && programme.start > now);
  if (upcomingIndex >= 0) {
    return [programmes[upcomingIndex], programmes[upcomingIndex + 1]].filter(Boolean);
  }

  const lastProgramme = programmes[programmes.length - 1];
  const lastTimestamp = lastProgramme?.stop || lastProgramme?.start;
  if (lastTimestamp && now - lastTimestamp > STALE_SCHEDULE_WINDOW_MS) {
    return [];
  }

  return programmes.slice(-2);
}

function buildProgrammeGroups(programmes, xmltvChannels) {
  const groups = new Map();

  for (const programme of programmes) {
    const key = programme.channel;
    if (!groups.has(key)) {
      groups.set(key, {
        id: key,
        displayNames: new Set(),
        normalisedDisplayNames: new Set(),
        channelNumbers: new Set(),
        iconUrl: "",
        programmes: [],
      });
    }

    const group = groups.get(key);
    group.programmes.push(programme);
    const number = extractChannelNumber(programme.channel);
    if (number !== null) {
      group.channelNumbers.add(number);
    }
  }

  for (const channel of xmltvChannels) {
    const directGroup = groups.get(channel.id);
    if (directGroup) {
      directGroup.iconUrl = directGroup.iconUrl || channel.iconUrl;
      for (const displayName of channel.displayNames) {
        directGroup.displayNames.add(displayName);
        directGroup.normalisedDisplayNames.add(normaliseName(displayName));
        const number = extractChannelNumber(displayName);
        if (number !== null) {
          directGroup.channelNumbers.add(number);
        }
      }
    }
  }

  for (const group of groups.values()) {
    for (const channel of xmltvChannels) {
      const channelNumbers = [
        extractChannelNumber(channel.id),
        ...channel.displayNames.map(extractChannelNumber),
      ].filter((value) => value !== null);

      const sharesNumber = channelNumbers.some((value) => group.channelNumbers.has(value));
      if (!sharesNumber) {
        continue;
      }

      for (const displayName of channel.displayNames) {
        group.displayNames.add(displayName);
        group.normalisedDisplayNames.add(normaliseName(displayName));
      }
      group.iconUrl = group.iconUrl || channel.iconUrl;
    }

    group.programmes.sort((a, b) => a.start - b.start);
  }

  return Array.from(groups.values());
}

function scoreGroupForChannel(group, channel) {
  let score = 0;

  if (channel.xmltvId && group.id === channel.xmltvId) {
    score += 100;
  }

  if (channel.num && group.channelNumbers.has(channel.num)) {
    score += 60;
  }

  const normalisedChannelName = normaliseName(channel.name);
  if (normalisedChannelName && group.normalisedDisplayNames.has(normalisedChannelName)) {
    score += 80;
  }

  return score;
}

export function normalizeGuideData(programmes, xmltvChannels, playlistEntries, timeFormat, now = new Date()) {
  const groups = buildProgrammeGroups(programmes, xmltvChannels);

  return playlistEntries.map((channel) => {
    const bestGroup = groups
      .map((group) => ({ group, score: scoreGroupForChannel(group, channel) }))
      .sort((a, b) => b.score - a.score)[0];

    const channelProgrammes = bestGroup?.score > 0 ? bestGroup.group.programmes : [];

    const selected = pickNowAndNext(channelProgrammes, now);
    const normalizedProgrammes = selected.map((programme) => ({
      start: formatProgrammeTime(programme.start, timeFormat),
      title: programme.subTitle ? `${programme.title}: ${programme.subTitle}` : programme.title,
    }));

    if (!normalizedProgrammes.length) {
      normalizedProgrammes.push({ start: "--:--", title: "No information available" });
    }

    if (normalizedProgrammes.length === 1) {
      normalizedProgrammes.push({ start: "--:--", title: "No information available" });
    }

    return {
      num: channel.num,
      name: channel.name,
      logoUrl: channel.logoUrl || bestGroup?.group.iconUrl || "",
      streamUrl: channel.streamUrl,
      programmes: normalizedProgrammes,
    };
  });
}

export async function buildGuidePayload(config, now = new Date()) {
  if (!config.xmltvUrl || !config.m3uUrl) {
    throw new Error("No XMLTV or M3U URL configured");
  }

  const [m3uResponse, xmltvResponse] = await Promise.all([
    fetch(config.m3uUrl),
    fetch(config.xmltvUrl),
  ]);

  if (!m3uResponse.ok) {
    throw new Error(`M3U request failed with ${m3uResponse.status}`);
  }

  if (!xmltvResponse.ok) {
    throw new Error(`XMLTV request failed with ${xmltvResponse.status}`);
  }

  const [m3uText, xml] = await Promise.all([m3uResponse.text(), xmltvResponse.text()]);
  const playlistEntries = parsePlaylist(m3uText, config);
  const limitedEntries = config.channelLimit
    ? playlistEntries.slice(0, config.channelLimit)
    : playlistEntries;
  const { channels: xmltvChannels, programmes } = parseXmltvData(xml);

  return {
    source: "xmltv+m3u",
    generatedAt: now.toISOString(),
    channels: normalizeGuideData(programmes, xmltvChannels, limitedEntries, config.timeFormat, now),
  };
}

export async function buildGuideResponse(config, now = new Date()) {
  try {
    return await buildGuidePayload(config, now);
  } catch (error) {
    if (!config.fallbackToDemoData) {
      throw error;
    }

    return {
      ...buildDemoGuidePayload(),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
