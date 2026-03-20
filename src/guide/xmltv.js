import { buildDemoGuidePayload } from "./demoData.js";

const STALE_SCHEDULE_WINDOW_MS = 6 * 60 * 60 * 1000;

function decodeXmlEntities(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parseAttributes(input) {
  const attributes = {};
  const attrRegex = /([\w:-]+)="([^"]*)"/g;
  let match = attrRegex.exec(input);
  while (match) {
    attributes[match[1]] = decodeXmlEntities(match[2]);
    match = attrRegex.exec(input);
  }
  return attributes;
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

function getFirstTagValue(xml, tagName) {
  const match = xml.match(new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return match ? decodeXmlEntities(match[1].trim()) : "";
}

function parseXmltvDate(value) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  const match = trimmed.match(
    /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?(?:\s*([+-]\d{4}|Z))?$/,
  );

  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute, second = "00", offset] = match;
  const utcMillis = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  );

  if (!offset || offset === "Z") {
    return new Date(utcMillis);
  }

  const sign = offset[0] === "+" ? 1 : -1;
  const offsetHours = Number(offset.slice(1, 3));
  const offsetMinutes = Number(offset.slice(3, 5));
  const offsetMillis = sign * ((offsetHours * 60) + offsetMinutes) * 60 * 1000;

  return new Date(utcMillis - offsetMillis);
}

function formatProgrammeTime(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "--:--";
  }

  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function parseProgrammeBlocks(xml) {
  const programmes = [];
  const programmeRegex = /<programme\b([^>]*)>([\s\S]*?)<\/programme>/g;
  let match = programmeRegex.exec(xml);

  while (match) {
    const attributes = parseAttributes(match[1]);
    const body = match[2];
    programmes.push({
      channel: attributes.channel || "",
      start: parseXmltvDate(attributes.start),
      stop: parseXmltvDate(attributes.stop),
      title: getFirstTagValue(body, "title") || "Unknown Programme",
      subTitle: getFirstTagValue(body, "sub-title"),
    });
    match = programmeRegex.exec(xml);
  }

  return programmes;
}

function parseChannelBlocks(xml) {
  const channels = [];
  const channelRegex = /<channel\b([^>]*)>([\s\S]*?)<\/channel>/g;
  let match = channelRegex.exec(xml);

  while (match) {
    const attributes = parseAttributes(match[1]);
    const body = match[2];
    const displayNameRegex = /<display-name(?:\s[^>]*)?>([\s\S]*?)<\/display-name>/g;
    const displayNames = [];
    let displayNameMatch = displayNameRegex.exec(body);

    while (displayNameMatch) {
      displayNames.push(decodeXmlEntities(displayNameMatch[1].trim()));
      displayNameMatch = displayNameRegex.exec(body);
    }

    channels.push({
      id: attributes.id || "",
      displayNames,
    });

    match = channelRegex.exec(xml);
  }

  return channels;
}

function parseM3uPlaylist(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const entries = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.startsWith("#EXTINF:")) {
      continue;
    }

    const [metadataPart, namePart = ""] = line.split(/,(.*)/s);
    const attributes = parseAttributes(metadataPart);
    const streamUrl = lines[index + 1] && !lines[index + 1].startsWith("#")
      ? lines[index + 1]
      : "";

    entries.push({
      num: Number(attributes["channel-number"] || attributes["tvg-chno"] || 0),
      name: attributes["tvg-name"] || namePart.trim() || "Unknown Channel",
      xmltvId: attributes["tvg-id"] || "",
      streamUrl,
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
    return programmes.slice(currentIndex, currentIndex + 2);
  }

  const upcomingIndex = programmes.findIndex((programme) => programme.start && programme.start > now);
  if (upcomingIndex >= 0) {
    return programmes.slice(upcomingIndex, upcomingIndex + 2);
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

export function normalizeGuideData(programmes, xmltvChannels, playlistEntries, now = new Date()) {
  const groups = buildProgrammeGroups(programmes, xmltvChannels);

  return playlistEntries.map((channel) => {
    const bestGroup = groups
      .map((group) => ({ group, score: scoreGroupForChannel(group, channel) }))
      .sort((a, b) => b.score - a.score)[0];

    const channelProgrammes = bestGroup?.score > 0 ? bestGroup.group.programmes : [];

    const selected = pickNowAndNext(channelProgrammes, now);
    const normalizedProgrammes = selected.map((programme) => ({
      start: formatProgrammeTime(programme.start),
      title: programme.subTitle ? `${programme.title}: ${programme.subTitle}` : programme.title,
    }));

    if (!normalizedProgrammes.length) {
      normalizedProgrammes.push({ start: "--:--", title: "Schedule unavailable" });
    }

    if (normalizedProgrammes.length === 1) {
      normalizedProgrammes.push({ ...normalizedProgrammes[0] });
    }

    return {
      num: channel.num,
      name: channel.name,
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
  const playlistEntries = parseM3uPlaylist(m3uText);
  const xmltvChannels = parseChannelBlocks(xml);
  const programmes = parseProgrammeBlocks(xml);

  return {
    source: "xmltv+m3u",
    generatedAt: now.toISOString(),
    channels: normalizeGuideData(programmes, xmltvChannels, playlistEntries, now),
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
