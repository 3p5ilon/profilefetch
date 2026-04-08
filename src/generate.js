#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const cfg = require(path.join(ROOT, "src", "config.js"));
const { theme, font, layout } = require(path.join(ROOT, "src", "theme.js"));

const { options, logo: logoCfg } = cfg;
const { palette } = theme;
const { size: fontSize, charRatio, family, keyWeight } = font;
const { lineHeight, paddingTop: startY, width: svgW } = layout;

const charWidth = fontSize * charRatio;
const fontFamily = String(family).replace(
  /[&<>"]/g,
  (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[m],
);

// Internal utilities
const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[m],
  );
const getColor = (name) => palette[name] ?? palette.text;
const strPx = (s) => Math.round(s.length * charWidth);
const spacePx = strPx(" ");

const svgText = (x, y, fill, content, bold = false, size = fontSize) => {
  const sizeAttr = size !== fontSize ? ` font-size="${size}"` : "";
  const weightAttr = bold ? ` font-weight="${keyWeight}"` : "";
  const xPos = Number.isInteger(x) ? x : x.toFixed(3);
  const yPos = Number.isInteger(y) ? y : y.toFixed(3);
  return `<text x="${xPos}" y="${yPos}" fill="${fill}" class="f"${sizeAttr}${weightAttr} xml:space="preserve">${esc(content)}</text>`;
};

// Logo asset processing (Image or Text)
let logoLines = [];
let embeddedImage = "";
let maxGraphicPx = 0;
let graphicHeight = 0;
let logoScale = 1;

if (logoCfg.type === "image") {
  const imgPath = path.resolve(ROOT, "src", logoCfg.image.path);
  const ext = path.extname(imgPath).slice(1).toLowerCase();
  const mime = ext === "jpg" || ext === "jpeg" ? "jpeg" : "png";
  embeddedImage = `data:image/${mime};base64,${fs.readFileSync(imgPath).toString("base64")}`;
  maxGraphicPx = logoCfg.image.width;
  graphicHeight = logoCfg.image.height;
} else {
  const textFile = path.resolve(ROOT, "src", logoCfg.text.file);
  let rawLines = fs.readFileSync(textFile, "utf8").split(/\r?\n/);

  while (rawLines.length > 0 && !rawLines[0].trim()) rawLines.shift();
  while (rawLines.length > 0 && !rawLines[rawLines.length - 1].trim())
    rawLines.pop();
  logoLines = rawLines.map((l) => l.replace(/[\s\u2800]+$/, ""));

  let minLead = Infinity;
  for (const l of logoLines) {
    if (!l) continue;
    const m = l.match(/^[\s\u2800]+/);
    minLead = Math.min(minLead, m ? m[0].length : 0);
  }
  if (minLead === Infinity) minLead = 0;
  if (minLead > 0) logoLines = logoLines.map((l) => l.substring(minLead));

  const textFontSize =
    logoCfg.text.fontSize > 0 ? logoCfg.text.fontSize : fontSize;
  logoScale = textFontSize / fontSize;
  maxGraphicPx =
    Math.max(0, ...logoLines.map((l) => l.length)) * charWidth * logoScale;
  graphicHeight = logoLines.length * lineHeight * logoScale;
}

const infoColX = layout.paddingLeft + maxGraphicPx + layout.columnGap;

/// Row data processing: flat list supports objects or null for spacers
const processedRows = [];
cfg.info.forEach((entry, i) => {
  if (entry === null || entry === "break")
    return processedRows.push({ type: "blank" });

  // adds a blank row when the color changes between items
  if (
    options.blankBetweenGroups &&
    i > 0 &&
    cfg.info[i - 1] &&
    entry.color !== cfg.info[i - 1].color
  ) {
    processedRows.push({ type: "blank" });
  }

  processedRows.push({
    type: "data",
    key: entry.key,
    value: entry.value,
    keyColor: entry.color,
  });
});

const infoEls = [];
let row = 0;
const currentY = () => startY + row * lineHeight;

const { user, host } = cfg;
const sep = options.userHostSep || "@";
const title = `${user}${sep}${host}`;
infoEls.push(
  svgText(infoColX, currentY(), getColor("sky"), user, true),
  svgText(infoColX + strPx(user), currentY(), getColor("text"), sep),
  svgText(
    infoColX + strPx(user) + strPx(sep),
    currentY(),
    getColor("sky"),
    host,
    true,
  ),
);
row++;
infoEls.push(
  svgText(infoColX, currentY(), getColor("text"), "-".repeat(title.length)),
);
row++;

// Info rows with word-wrapping logic
processedRows.forEach((r) => {
  if (r.type === "blank") return row++;

  const keyStr = `${r.key}:`;
  const startValX = infoColX + strPx(keyStr) + spacePx;
  infoEls.push(
    svgText(infoColX, currentY(), getColor(r.keyColor), keyStr, true),
  );

  const limit = svgW - layout.paddingRight - startValX;
  const words = r.value.split(" ");
  let cur = "";

  words.forEach((w) => {
    const test = cur ? `${cur} ${w}` : w;
    if (cur && strPx(test) > limit) {
      infoEls.push(svgText(startValX, currentY(), getColor("text"), cur));
      row++;
      cur = w;
    } else cur = test;
  });
  if (cur) {
    infoEls.push(svgText(startValX, currentY(), getColor("text"), cur));
    row++;
  }
});

// Theme color swatches
const swatchEls = [];
if (options.showSwatches) {
  const swY = currentY() + 6;
  const box = 18;
  theme.swatches.normal.forEach((h, i) =>
    swatchEls.push(
      `<rect x="${infoColX + i * box}" y="${swY}" width="${box}" height="${box}" fill="${h}"/>`,
    ),
  );
  theme.swatches.bright.forEach((h, i) =>
    swatchEls.push(
      `<rect x="${infoColX + i * box}" y="${swY + box}" width="${box}" height="${box}" fill="${h}"/>`,
    ),
  );
}

// Logo asset generation (Text uses high-precision vector scaling)
const assetEls =
  logoCfg.type === "image"
    ? [
        `<image x="${layout.paddingLeft}" y="${startY}" width="${logoCfg.image.width}" height="${logoCfg.image.height}" href="${embeddedImage}" xlink:href="${embeddedImage}" preserveAspectRatio="xMidYMid meet"/>`,
      ]
    : [
        `<g transform="translate(${layout.paddingLeft},${startY}) scale(${logoScale}) translate(${-layout.paddingLeft},${-startY})">`,
        ...logoLines.map((l, i) =>
          svgText(
            layout.paddingLeft,
            startY + i * lineHeight,
            getColor(logoCfg.text.color),
            l,
          ),
        ),
        `</g>`,
      ];

const infoSideHeight = row * lineHeight + (options.showSwatches ? 42 : 0);
const svgH =
  startY + Math.max(infoSideHeight, graphicHeight) + layout.paddingBottom;

const svg = [
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">`,
  `  <style>@import url('${font.import.replace(/&/g, "&amp;")}'); .f { font-family: ${fontFamily}; font-size: ${fontSize}px; }</style>`,
  `  <rect width="${svgW}" height="${svgH}" rx="8" fill="${theme.bg}"/>`,
  `  <rect width="${svgW}" height="${svgH}" rx="8" fill="none" stroke="${theme.border}" stroke-width="1"/>`,
  ...assetEls.map((el) => `  ${el}`),
  ...infoEls.map((el) => `  ${el}`),
  ...swatchEls.map((el) => `  ${el}`),
  `</svg>`,
].join("\n");

fs.writeFileSync(path.join(ROOT, "profilefetch.svg"), svg, "utf8");
console.log(`✓  profilefetch.svg  (${svgW} × ${svgH}px)`);
