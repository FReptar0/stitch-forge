import { load } from 'cheerio';
import { existsSync, readFileSync } from 'node:fs';

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  category: 'color' | 'typography' | 'accessibility' | 'slop' | 'structure';
  message: string;
}

export interface OutputValidationResult {
  score: number; // 0-100
  issues: ValidationIssue[];
  passed: boolean;
}

/**
 * Validate generated HTML against design system and quality rules.
 */
export function validateOutput(html: string): OutputValidationResult {
  const issues: ValidationIssue[] = [];
  const $ = load(html);

  // 0. Check for empty or minimal HTML
  const bodyText = $('body').text().trim();
  if (!bodyText && $('body *').length === 0) {
    issues.push({
      type: 'error',
      category: 'structure',
      message: 'Generated HTML is empty — no content in body.',
    });
  }

  // 1. Check for AI slop font patterns (both CSS and Tailwind classes)
  const allStyles = $('style').text() + ($('[style]').map((_i, el) => $(el).attr('style')).get().join(' '));
  const allClasses = $('[class]').map((_i, el) => $(el).attr('class')).get().join(' ');

  if (/font-family[^;]*\bInter\b/i.test(allStyles) && !isIntentionalFont('Inter')) {
    issues.push({
      type: 'warning',
      category: 'slop',
      message: 'Detected "Inter" font — common AI default. Consider a more distinctive typeface.',
    });
  }

  if (/font-family[^;]*\bPoppins\b/i.test(allStyles) && !isIntentionalFont('Poppins')) {
    issues.push({
      type: 'warning',
      category: 'slop',
      message: 'Detected "Poppins" font — common AI default. Consider a more distinctive typeface.',
    });
  }

  // 1b. Check Tailwind font classes (font-sans resolves to Inter/system-ui)
  if (/\bfont-sans\b/.test(allClasses) && !isIntentionalFont('Inter')) {
    issues.push({
      type: 'info',
      category: 'slop',
      message: 'Tailwind "font-sans" class detected — resolves to system sans-serif. Consider specifying a custom font.',
    });
  }

  // 2. Check for purple-to-blue gradients
  if (/gradient[^;]*(purple|#[89a-f][0-9a-f]{5})[^;]*(blue|#[0-5][0-9a-f]{5})/i.test(allStyles) ||
      /gradient[^;]*(blue|#[0-5][0-9a-f]{5})[^;]*(purple|#[89a-f][0-9a-f]{5})/i.test(allStyles)) {
    issues.push({
      type: 'warning',
      category: 'slop',
      message: 'Detected purple-to-blue gradient — extremely common AI pattern.',
    });
  }

  // 3. Check heading hierarchy
  const headings = $('h1, h2, h3, h4, h5, h6').map((_i, el) => parseInt(el.tagName[1])).get();
  if (headings.length > 0) {
    for (let i = 1; i < headings.length; i++) {
      if (headings[i] > headings[i - 1] + 1) {
        issues.push({
          type: 'warning',
          category: 'structure',
          message: `Heading hierarchy skip: h${headings[i - 1]} → h${headings[i]}. Should not skip levels.`,
        });
        break;
      }
    }
  }

  // 4. Check for missing alt attributes
  const imgsWithoutAlt = $('img:not([alt])').length;
  if (imgsWithoutAlt > 0) {
    issues.push({
      type: 'error',
      category: 'accessibility',
      message: `${imgsWithoutAlt} image(s) missing alt attribute.`,
    });
  }

  // 5. Check for DESIGN.md color adherence
  const designColors = extractDesignColors();
  if (designColors.length > 0) {
    const usedColors = extractUsedColors(allStyles);
    const unmatchedColors = usedColors.filter(c =>
      !designColors.some(dc => dc.toLowerCase() === c.toLowerCase()) &&
      !isNeutralColor(c)
    );
    if (unmatchedColors.length > 3) {
      issues.push({
        type: 'warning',
        category: 'color',
        message: `${unmatchedColors.length} colors used that aren't in DESIGN.md palette. Output may deviate from design system.`,
      });
    }
  }

  // 6. Check for three-column icon grid as second section (classic AI slop)
  const sections = $('section, [class*="section"], main > div').toArray();
  if (sections.length >= 2) {
    const secondSection = $(sections[1]);
    const icons = secondSection.find('svg, [class*="icon"], i[class]');
    const columns = secondSection.find('[class*="col"], [class*="grid"]');
    if (icons.length === 3 && columns.length > 0) {
      issues.push({
        type: 'info',
        category: 'slop',
        message: 'Second section appears to be a three-column icon grid — very common AI layout pattern.',
      });
    }
  }

  // 7. Check business model alignment (if DESIGN.md has business context)
  if (existsSync('DESIGN.md')) {
    const designContent = readFileSync('DESIGN.md', 'utf-8').toLowerCase();

    // If NOT e-commerce, check for cart/checkout in generated HTML
    if (designContent.includes('not an e-commerce') || designContent.includes('not e-commerce') || designContent.includes('no online purchasing')) {
      const htmlLower = html.toLowerCase();
      if (/\b(add.?to.?cart|shopping.?cart|checkout|buy.?now|carrito)\b/i.test(htmlLower)) {
        issues.push({
          type: 'error',
          category: 'structure',
          message: 'Generated HTML contains e-commerce elements (cart/checkout) but DESIGN.md specifies this is NOT an e-commerce site.',
        });
      }
    }

    // If store locator is key, check for location-related elements
    if (designContent.includes('store locator') || designContent.includes('find nearest store')) {
      const hasLocationElements = /\b(location|store.?finder|find.?store|sucursal|ubicaci|postal|zip.?code|mapa|map)\b/i.test(html.toLowerCase());
      if (!hasLocationElements) {
        issues.push({
          type: 'info',
          category: 'structure',
          message: 'DESIGN.md specifies store locator as key feature but no location/finder elements detected in output.',
        });
      }
    }
  }

  // Calculate score
  const errorCount = issues.filter(i => i.type === 'error').length;
  const warningCount = issues.filter(i => i.type === 'warning').length;
  const infoCount = issues.filter(i => i.type === 'info').length;
  const score = Math.max(0, 100 - (errorCount * 15) - (warningCount * 8) - (infoCount * 3));

  return {
    score,
    issues,
    passed: score >= 60,
  };
}

function isIntentionalFont(fontName: string): boolean {
  if (!existsSync('DESIGN.md')) return false;
  const content = readFileSync('DESIGN.md', 'utf-8');
  return content.includes(fontName);
}

function extractDesignColors(): string[] {
  if (!existsSync('DESIGN.md')) return [];
  const content = readFileSync('DESIGN.md', 'utf-8');
  const hexMatches = content.match(/#[0-9A-Fa-f]{6}/g) || [];
  return [...new Set(hexMatches)];
}

function extractUsedColors(styles: string): string[] {
  const hexMatches = styles.match(/#[0-9A-Fa-f]{6}/g) || [];
  return [...new Set(hexMatches)];
}

function isNeutralColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
  return maxDiff < 20; // Nearly grayscale
}

/**
 * Format validation results for display.
 */
export function formatValidationReport(result: OutputValidationResult): string {
  const lines: string[] = [];

  lines.push(`Quality Score: ${result.score}/100 (${result.passed ? 'PASS' : 'NEEDS REVIEW'})`);
  lines.push('');

  if (result.issues.length === 0) {
    lines.push('No issues detected.');
    return lines.join('\n');
  }

  const errors = result.issues.filter(i => i.type === 'error');
  const warnings = result.issues.filter(i => i.type === 'warning');
  const infos = result.issues.filter(i => i.type === 'info');

  if (errors.length > 0) {
    lines.push('Errors:');
    errors.forEach(e => lines.push(`  [x] ${e.message}`));
    lines.push('');
  }

  if (warnings.length > 0) {
    lines.push('Warnings:');
    warnings.forEach(w => lines.push(`  [!] ${w.message}`));
    lines.push('');
  }

  if (infos.length > 0) {
    lines.push('Info:');
    infos.forEach(i => lines.push(`  [i] ${i.message}`));
  }

  return lines.join('\n');
}
