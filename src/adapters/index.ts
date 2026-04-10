import type { Framework, FrameworkAdapter } from './types.js';
import { StaticAdapter } from './static.js';
import { NextjsAdapter } from './nextjs.js';

export function getAdapter(framework: Exclude<Framework, 'astro'>): FrameworkAdapter {
  switch (framework) {
    case 'static': return new StaticAdapter();
    case 'nextjs': return new NextjsAdapter();
  }
}

export type { Framework, FrameworkAdapter, ScreenData, BuildContext, BuildResult } from './types.js';
