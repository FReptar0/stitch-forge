export interface ScreenSpec {
  productName: string;
  productDescription: string;
  pageType: string; // "landing page", "dashboard", "pricing page", etc.
  targetUser: string;
  visualTone: string; // "premium", "playful", "minimal", etc.
  sections: string[];
  hasDesignMd: boolean;
}

export interface RefinementSpec {
  screenName: string;
  sectionTarget: string; // e.g. "hero section", "pricing cards"
  change: string;
  details?: string[];
}

/**
 * Build an initial generation prompt using zoom-out-zoom-in framework.
 */
export function buildInitialPrompt(spec: ScreenSpec): string {
  const designRef = spec.hasDesignMd
    ? 'Following the imported design system, '
    : '';

  const sectionList = spec.sections
    .map((s, i) => `${i + 1}. ${s}`)
    .join('\n');

  return `${designRef}A ${spec.visualTone} ${spec.pageType} for "${spec.productName}," a ${spec.productDescription}.
Designed for ${spec.targetUser}.

Include these sections:
${sectionList}`;
}

/**
 * Build a refinement prompt (one change at a time).
 */
export function buildRefinementPrompt(spec: RefinementSpec): string {
  let prompt = `On the ${spec.sectionTarget} of ${spec.screenName}, ${spec.change}.`;

  if (spec.details && spec.details.length > 0) {
    prompt += '\n' + spec.details.map(d => `- ${d}`).join('\n');
  }

  return prompt;
}

/**
 * Build a localization prompt (apply after layout is established).
 */
export function buildLocalePrompt(language: string): string {
  return `Switch all text content to ${language}.`;
}

/**
 * Build a multi-screen consistency prefix.
 */
export function buildConsistencyPrefix(referenceScreen: string): string {
  return `Following the same design language as the ${referenceScreen}, `;
}
