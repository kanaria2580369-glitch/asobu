import jsPDF from 'jspdf';
import { CharacterStats } from '../entities/Character';

const PRIMARY = [70, 130, 180] as const;    // steel blue
const DARK    = [20, 20, 40] as const;       // near-black bg
const LIGHT   = [230, 230, 255] as const;    // label text
const ACCENT  = [255, 220, 80] as const;     // yellow accent
const HP_CLR  = [50, 200, 80] as const;
const MP_CLR  = [80, 160, 255] as const;

function bar(doc: jsPDF, x: number, y: number, w: number, h: number, ratio: number, color: readonly [number, number, number]): void {
  // background
  doc.setFillColor(40, 40, 60);
  doc.roundedRect(x, y, w, h, 1, 1, 'F');
  // fill
  const fill = Math.max(0, Math.min(1, ratio)) * w;
  if (fill > 0) {
    doc.setFillColor(...color);
    doc.roundedRect(x, y, fill, h, 1, 1, 'F');
  }
}

export function generateCharacterSheetPdf(stats: CharacterStats): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;

  // ── Background ──────────────────────────────────────────────
  doc.setFillColor(...DARK);
  doc.rect(0, 0, W, 297, 'F');

  // ── Title banner ─────────────────────────────────────────────
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, W, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('ASOBU  RPG', W / 2, 12, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(200, 220, 255);
  doc.text('Character Sheet', W / 2, 21, { align: 'center' });

  // ── Character name box ───────────────────────────────────────
  const boxX = 15;
  let y = 36;

  doc.setFillColor(30, 30, 55);
  doc.roundedRect(boxX, y, W - 30, 18, 3, 3, 'F');
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.5);
  doc.roundedRect(boxX, y, W - 30, 18, 3, 3, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...ACCENT);
  doc.text('Name:', boxX + 5, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  // Japanese characters won't render with the default font — show romaji fallback alongside
  const nameDisplay = stats.name;
  doc.text(nameDisplay, boxX + 30, y + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...ACCENT);
  doc.text(`Lv. ${stats.level}`, W - 30, y + 7, { align: 'right' });

  // ── Divider ──────────────────────────────────────────────────
  y += 25;
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.3);
  doc.line(boxX, y, W - boxX, y);

  // ── HP / MP bars ─────────────────────────────────────────────
  y += 6;
  const labelW = 18;
  const valW   = 24;
  const barX   = boxX + labelW + 2;
  const barW   = W - 30 - labelW - valW - 4;
  const barH   = 6;

  const renderBar = (
    label: string,
    current: number,
    max: number,
    color: readonly [number, number, number],
    yPos: number,
  ) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...LIGHT);
    doc.text(label, boxX, yPos + 5);

    bar(doc, barX, yPos, barW, barH, current / max, color);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(`${current} / ${max}`, barX + barW + 3, yPos + 5);
  };

  renderBar('HP', stats.hp, stats.maxHp, HP_CLR, y);
  y += 11;
  renderBar('MP', stats.mp, stats.maxMp, MP_CLR, y);

  // ── EXP ──────────────────────────────────────────────────────
  y += 11;
  renderBar('EXP', stats.exp, stats.nextExp, [180, 100, 255], y);

  // ── Stats grid ───────────────────────────────────────────────
  y += 18;
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.3);
  doc.line(boxX, y, W - boxX, y);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...ACCENT);
  doc.text('STATS', boxX, y);

  y += 6;

  const statDefs: { label: string; value: number; max: number; color: readonly [number, number, number] }[] = [
    { label: 'ATK', value: stats.atk, max: 100, color: [255, 100, 100] },
    { label: 'DEF', value: stats.def, max: 100, color: [100, 200, 255] },
    { label: 'SPD', value: stats.spd, max: 100, color: [255, 200, 80] },
  ];

  for (const s of statDefs) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...LIGHT);
    doc.text(s.label, boxX, y + 5);

    bar(doc, barX, y, barW, barH, s.value / s.max, s.color);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(`${s.value}`, barX + barW + 3, y + 5);

    y += 11;
  }

  // ── Summary table ─────────────────────────────────────────────
  y += 4;
  doc.setDrawColor(...PRIMARY);
  doc.line(boxX, y, W - boxX, y);

  y += 6;
  const cols = [
    ['Level', String(stats.level)],
    ['EXP',   `${stats.exp} / ${stats.nextExp}`],
    ['HP',    `${stats.hp} / ${stats.maxHp}`],
    ['MP',    `${stats.mp} / ${stats.maxMp}`],
    ['ATK',   String(stats.atk)],
    ['DEF',   String(stats.def)],
    ['SPD',   String(stats.spd)],
  ];

  const colW = (W - 30) / 2;
  for (let i = 0; i < cols.length; i++) {
    const [k, v] = cols[i];
    const cx = i % 2 === 0 ? boxX : boxX + colW;
    if (i % 2 === 0 && i > 0) y += 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...LIGHT);
    doc.text(k, cx, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(255, 255, 255);
    doc.text(v, cx + 20, y);
  }

  // ── Footer ────────────────────────────────────────────────────
  y = 285;
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.2);
  doc.line(boxX, y, W - boxX, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 150);
  const date = new Date().toLocaleDateString();
  doc.text(`Generated: ${date}`, boxX, y + 6);
  doc.text('ASOBU Fantasy RPG', W - boxX, y + 6, { align: 'right' });

  // ── Save ──────────────────────────────────────────────────────
  doc.save(`${stats.name}_Lv${stats.level}_sheet.pdf`);
}
