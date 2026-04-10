export type Framework = 'static' | 'astro' | 'nextjs';

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
