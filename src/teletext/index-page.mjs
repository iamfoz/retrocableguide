import { CC, cc, buildCarousel, buildPage } from "./tti-writer.mjs";
import {
  separatorRow,
  doubleHeightRows,
  headerRow,
  textRow,
  dotLeader,
} from "./page-builder.mjs";

const CHANNELS_PER_COLUMN = 17; // rows 4-20
const COLUMNS = 2;
const CHANNELS_PER_PAGE = CHANNELS_PER_COLUMN * COLUMNS;
const COL_WIDTH = 19; // 40 cols - 1 colour code - 1 space between = 38 / 2 = 19

function buildIndexSubpage(channels, subpageIndex, totalSubpages, config) {
  const rows = [];

  // Row 0: service name + page number right-aligned
  rows.push(headerRow(config.serviceName, 0x100));

  // Row 1: red separator bar
  rows.push(separatorRow(1, CC.MOSAIC_RED));

  // Row 2-3: double-height title
  rows.push(...doubleHeightRows(2, "  " + config.indexTitle));

  // Rows 4-20: two-column channel listing
  for (let row = 0; row < CHANNELS_PER_COLUMN; row++) {
    const rowIndex = row + 4;
    let content = cc(CC.WHITE);

    for (let col = 0; col < COLUMNS; col++) {
      if (col > 0) content += " ";
      const channelIndex = col * CHANNELS_PER_COLUMN + row;
      if (channelIndex < channels.length) {
        const ch = channels[channelIndex];
        content += dotLeader(ch.name, ch.slot + 10, COL_WIDTH);
      } else {
        content += " ".repeat(COL_WIDTH);
      }
    }

    rows.push({ index: rowIndex, content });
  }

  // Row 21: empty or pagination indicator
  if (totalSubpages > 1 && subpageIndex < totalSubpages - 1) {
    rows.push(textRow(21, "          More channels follow >>>>", CC.CYAN));
  }

  // Row 22-23: instructions
  rows.push(textRow(22, 'Press "1" then Chan.No for Today\'s', CC.GREEN));
  rows.push(textRow(23, 'Press "2" then Chan.No for Tomorrow\'s', CC.GREEN));

  return rows;
}

export function generateIndexPages(channels, config) {
  const totalSubpages = Math.ceil(channels.length / CHANNELS_PER_PAGE) || 1;

  if (totalSubpages === 1) {
    return buildPage({
      description: "Channel Guide Index",
      magazine: 1,
      page: 0x00,
      subcode: 0,
      rows: buildIndexSubpage(channels, 0, 1, config),
    });
  }

  const subpages = [];
  for (let i = 0; i < totalSubpages; i++) {
    const start = i * CHANNELS_PER_PAGE;
    const pageChannels = channels.slice(start, start + CHANNELS_PER_PAGE);
    subpages.push(buildIndexSubpage(pageChannels, i, totalSubpages, config));
  }

  return buildCarousel({
    description: "Channel Guide Index",
    magazine: 1,
    page: 0x00,
    cycleSeconds: config.indexCarouselSeconds,
    subpages,
  });
}
