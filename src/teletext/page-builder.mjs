import { cc, CC, pad } from "./tti-writer.mjs";

const COLS = 40;

// Truncate a string, no ellipsis (authentic teletext style)
export function truncate(text, maxLen) {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen);
}

// Create a dot-leader string: "Name.......XX"
export function dotLeader(name, number, totalWidth) {
  const numStr = String(number).padStart(2, "0");
  const maxName = totalWidth - numStr.length - 1; // at least 1 dot
  const truncatedName = truncate(name, maxName);
  const dots = ".".repeat(totalWidth - truncatedName.length - numStr.length);
  return truncatedName + dots + numStr;
}

// Build a full-width mosaic separator bar
export function separatorRow(index, color = CC.MOSAIC_RED) {
  // Mosaic block 0x7F (all bits set = full block) fills the row
  const block = String.fromCharCode(0x7f);
  return { index, content: cc(color) + block.repeat(39) };
}

// Build double-height title rows (row index = top half, index+1 = bottom half)
// The bottom half must also have the double-height control code to render correctly.
export function doubleHeightRows(index, text, color = CC.YELLOW) {
  const content = cc(color) + cc(CC.DOUBLE_HEIGHT) + text;
  return [
    { index, content },
    { index: index + 1, content },
  ];
}

// Build the header row (row 0) with optional left text and right-aligned page number
export function headerRow(leftText, pageNumber) {
  const pageStr = pageNumber !== undefined ? pageNumber.toString(16).toUpperCase() : "";
  const gap = COLS - leftText.length - pageStr.length;
  if (gap < 1) {
    return { index: 0, content: pad(leftText + " " + pageStr, COLS) };
  }
  return { index: 0, content: leftText + " ".repeat(gap) + pageStr };
}

// Build a programme listing row: "[green]HH:MM [white]Title"
export function programmeRow(index, time, title) {
  const timeStr = time.padEnd(5);
  const maxTitle = COLS - 1 - 5 - 1 - 1; // cc + time + space + cc = 33
  return {
    index,
    content: cc(CC.GREEN) + timeStr + " " + cc(CC.WHITE) + truncate(title, maxTitle),
  };
}

// Build a fastext colour bar for row 23
export function fastextBar(red, green, yellow, cyan) {
  // Each label gets ~10 chars in its colour
  const labels = [
    { color: CC.RED, text: red },
    { color: CC.GREEN, text: green },
    { color: CC.YELLOW, text: yellow },
    { color: CC.CYAN, text: cyan },
  ];
  let content = "";
  for (const label of labels) {
    const segment = pad(label.text, 10);
    content += cc(label.color) + segment;
  }
  return { index: 23, content };
}

// Build a text row with a single colour
export function textRow(index, text, color = CC.WHITE) {
  return { index, content: cc(color) + text };
}

// Format a Date as "HH:MM" in 24h format
export function formatTime24(date) {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

// Format a Date as "TODAY - TUE 31 MAR" or "TOMORROW - WED 1 APR"
export function formatDateHeading(date, label) {
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const day = days[date.getDay()];
  const d = date.getDate();
  const mon = months[date.getMonth()];
  return `${label} - ${day} ${d} ${mon}`;
}
