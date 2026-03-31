import { CC, buildCarousel, buildPage, formatPageRef } from "./tti-writer.mjs";
import {
  separatorRow,
  doubleHeightRows,
  headerRow,
  programmeRow,
  fastextBar,
  textRow,
  formatTime24,
  formatDateHeading,
} from "./page-builder.mjs";

const PROGRAMMES_PER_PAGE = 17; // rows 5-21 (rows 2-3 used by double-height date, row 4 by channel name)

function buildScheduleSubpage(serviceName, channelName, pageNumber, programmes, dateHeading, subpageIndex, totalSubpages) {
  const rows = [];

  // Row 0: service name + page number
  rows.push(headerRow(serviceName, pageNumber));

  // Row 1: blue separator
  rows.push(separatorRow(1, CC.MOSAIC_BLUE));

  // Row 2-3: date heading double-height (occupies two rows)
  let heading = dateHeading;
  if (totalSubpages > 1) {
    heading += ` (${subpageIndex + 1}/${totalSubpages})`;
  }
  rows.push(...doubleHeightRows(2, " " + heading));

  // Row 4: channel name
  rows.push(textRow(4, " " + channelName, CC.CYAN));

  // Rows 5-21: programme listings
  for (let i = 0; i < PROGRAMMES_PER_PAGE; i++) {
    const rowIndex = i + 5;
    if (i < programmes.length) {
      const prog = programmes[i];
      rows.push(programmeRow(rowIndex, formatTime24(prog.start), prog.title));
    }
  }

  // Row 22: index reference
  rows.push(textRow(22, " Index p100", CC.WHITE));

  return rows;
}

export function generateSchedulePages({
  serviceName,
  channelName,
  programmes,
  date,
  dateLabel,
  magazine,
  page,
  cycleSeconds,
  prevPage,
  nextPage,
  otherDayPage,
  indexPage,
}) {
  const dateHeading = formatDateHeading(date, dateLabel);

  const fastext = {
    red: prevPage,
    green: nextPage,
    yellow: indexPage,
    cyan: otherDayPage,
    link: null,
    index: indexPage,
  };

  const totalSubpages = Math.ceil(programmes.length / PROGRAMMES_PER_PAGE) || 1;
  const pageNumber = (magazine << 8) | page;

  if (totalSubpages === 1) {
    const rows = buildScheduleSubpage(serviceName, channelName, pageNumber, programmes, dateHeading, 0, 1);
    // Add fastext bar to row 23
    rows.push(fastextBar("Prev", "Next", "Index", dateLabel === "TODAY" ? "Tomorrow" : "Today"));
    return buildPage({
      description: `${channelName} ${dateLabel}`,
      magazine,
      page,
      subcode: 0,
      rows,
      fastext,
    });
  }

  const subpages = [];
  for (let i = 0; i < totalSubpages; i++) {
    const start = i * PROGRAMMES_PER_PAGE;
    const pageProgrammes = programmes.slice(start, start + PROGRAMMES_PER_PAGE);
    const rows = buildScheduleSubpage(serviceName, channelName, pageNumber, pageProgrammes, dateHeading, i, totalSubpages);
    rows.push(fastextBar("Prev", "Next", "Index", dateLabel === "TODAY" ? "Tomorrow" : "Today"));
    subpages.push(rows);
  }

  return buildCarousel({
    description: `${channelName} ${dateLabel}`,
    magazine,
    page,
    cycleSeconds,
    subpages,
    fastext,
  });
}
