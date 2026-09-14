/**
 * Utility for parsing clipboard plain text into a 2D matrix of cell values,
 * supporting Excel/Google Sheets TSV, bracketed patterns [NOMBRE] WR...,
 * space-delimited columns, CSV, and WR-code pattern matching.
 */
export function parseClipboardSpreadsheet(text: string): string[][] {
  if (!text || typeof text !== 'string') return [];

  // Normalize line endings and split
  const rawLines = text.split(/\r\n|\r|\n/);

  // Remove trailing blank line if text ended with newline
  if (rawLines.length > 0 && rawLines[rawLines.length - 1].trim() === '') {
    rawLines.pop();
  }

  if (rawLines.length === 0) return [];

  // Check if any line contains tabs (universal TSV from Excel / Google Sheets)
  const hasTabs = rawLines.some(l => l.includes('\t'));
  const matrix: string[][] = [];

  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      matrix.push(['']);
      continue;
    }

    // 1. TSV from Google Sheets or Excel
    if (hasTabs) {
      matrix.push(
        rawLine.split('\t').map(c => c.trim().replace(/^["']|["']$/g, ''))
      );
      continue;
    }

    // 2. Semicolons
    if (trimmed.includes(';')) {
      matrix.push(
        trimmed.split(';').map(c => c.trim().replace(/^["']|["']$/g, ''))
      );
      continue;
    }

    // 3. Bracket prefix, e.g.: [NOMBRE] WR000460103 or [CARLOS] WR000460103 460103
    const bracketMatch = trimmed.match(/^(\[[^\]]+\])\s+(.+)$/);
    if (bracketMatch) {
      const col0 = bracketMatch[1].trim();
      const rest = bracketMatch[2].trim();
      const restParts = rest.split(/\s{2,}|\t/);
      if (restParts.length > 1) {
        matrix.push([col0, ...restParts.map(p => p.trim().replace(/^["']|["']$/g, ''))]);
      } else {
        const wrRestMatch = rest.match(/^(WR[-\s]?[A-Z0-9]+)\s+(.+)$/i);
        if (wrRestMatch) {
          matrix.push([col0, wrRestMatch[1].trim(), wrRestMatch[2].trim()]);
        } else {
          matrix.push([col0, rest]);
        }
      }
      continue;
    }

    // 4. Multiple consecutive spaces (2 or more spaces)
    if (/\s{2,}/.test(trimmed)) {
      matrix.push(
        trimmed.split(/\s{2,}/).map(c => c.trim().replace(/^["']|["']$/g, ''))
      );
      continue;
    }

    // 5. Commas (CSV format), e.g.: "JUAN PEREZ, WR000460103"
    if (trimmed.includes(',') && !/^\d+,\d+$/.test(trimmed)) {
      const parts = trimmed.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
      if (parts.length > 1) {
        matrix.push(parts);
        continue;
      }
    }

    // 6. Pattern: "Name WRcode" or "Name WRcode TIB", e.g. "JUAN PEREZ WR000460103"
    const nameWrMatch = trimmed.match(/^(.*?)\s+(WR[-\s]?[A-Z0-9]{4,15}|\b\d{6,8}\b)(?:\s+(.*))?$/i);
    if (nameWrMatch && nameWrMatch[1] && nameWrMatch[2]) {
      const col0 = nameWrMatch[1].trim();
      const col1 = nameWrMatch[2].trim();
      const col2 = nameWrMatch[3] ? nameWrMatch[3].trim() : '';
      if (col2) {
        matrix.push([col0, col1, col2]);
      } else {
        matrix.push([col0, col1]);
      }
      continue;
    }

    // 7. Single cell value
    matrix.push([trimmed]);
  }

  // Header detection safeguard: skip "NOMBRE" and "CODIGO WAREHOUSE"
  if (
    matrix.length > 1 &&
    matrix[0].length >= 2 &&
    /^(NOMBRE|CLIENTE|CONSIGNATARIO)$/i.test(matrix[0][0]) &&
    /^(CODIGO|WR|WAREHOUSE|TIB)/i.test(matrix[0][1])
  ) {
    matrix.shift();
  }

  return matrix;
}
