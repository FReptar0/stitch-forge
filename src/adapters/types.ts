export type Framework = 'static' | 'astro' | 'nextjs';

/** Design Guard signature injected as HTML comment at the top of every generated file */
export function getGuardSignature(): string {
  const now = new Date().toISOString().split('T')[0];
  return `<!-- Built with Design Guard (https://github.com/FReptar0/design-guard) — ${now} -->\n`;
}

export interface ScreenData {
  screenId: string;
  route: string;
  name: string;
  html: string;
}

export interface BuildContext {
  projectId: string;
  outputDir: string;
  screens: ScreenData[];
}

export interface BuildResult {
  files: string[];
  instructions: string[];
}

export interface FrameworkAdapter {
  readonly name: Framework;
  build(context: BuildContext): Promise<BuildResult>;
}
