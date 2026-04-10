export interface WorkflowStep {
  name: string;
  command: string; // CLI command or slash command
  description: string;
  dependsOn?: string;
}

export const WORKFLOW_REDESIGN: WorkflowStep[] = [
  { name: 'design', command: 'forge design', description: 'Define brand identity and design tokens → Write DESIGN.md' },
  { name: 'import', command: 'manual', description: 'Import DESIGN.md into Stitch project (manual step in Stitch UI)' },
  { name: 'homepage', command: 'forge generate', description: 'Generate homepage first (establishes visual language)', dependsOn: 'import' },
  { name: 'refine-home', command: 'forge generate', description: 'Refine homepage with 3-5 incremental prompts', dependsOn: 'homepage' },
  { name: 'internal-pages', command: 'forge generate', description: 'Generate internal pages one at a time, referencing homepage style', dependsOn: 'refine-home' },
  { name: 'sync', command: 'forge sync', description: 'Sync all screens to local', dependsOn: 'internal-pages' },
  { name: 'build', command: 'forge build --auto', description: 'Build Astro site from screens', dependsOn: 'sync' },
];

export const WORKFLOW_NEW_APP: WorkflowStep[] = [
  { name: 'brainstorm', command: 'forge generate', description: 'Start with high-level prompt to brainstorm direction' },
  { name: 'pick-direction', command: 'manual', description: 'Pick best direction from brainstorm output' },
  { name: 'drill-screens', command: 'forge generate', description: 'Generate screens one by one from chosen direction', dependsOn: 'pick-direction' },
  { name: 'extract-design', command: 'forge sync', description: 'Extract DESIGN.md from established screens (Stitch auto-generates)', dependsOn: 'drill-screens' },
  { name: 'remaining-screens', command: 'forge generate', description: 'Use DESIGN.md for remaining screens', dependsOn: 'extract-design' },
  { name: 'build', command: 'forge build --auto', description: 'Build site from all screens', dependsOn: 'remaining-screens' },
];

export function getWorkflow(type: 'redesign' | 'new-app'): WorkflowStep[] {
  return type === 'redesign' ? WORKFLOW_REDESIGN : WORKFLOW_NEW_APP;
}
