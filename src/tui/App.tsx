import React, { useState } from 'react';
import { render, Box, Text, useInput, useApp } from 'ink';
import SelectInput from 'ink-select-input';
import { Dashboard } from './Dashboard.js';
import { PromptBuilder } from './PromptBuilder.js';
import { DesignEditor } from './DesignEditor.js';
import { Spinner } from './components/Spinner.js';

type View = 'menu' | 'dashboard' | 'generate' | 'design' | 'research';

interface MenuItem {
  label: string;
  value: View;
}

const MENU_ITEMS: MenuItem[] = [
  { label: '📊 Dashboard — Project overview & quota', value: 'dashboard' },
  { label: '🎨 Design — Create/edit DESIGN.md', value: 'design' },
  { label: '🖼️  Generate — Build a screen prompt', value: 'generate' },
  { label: '🔬 Research — Check for updates', value: 'research' },
];

function App() {
  const [view, setView] = useState<View>('menu');
  const [researchStatus, setResearchStatus] = useState<'idle' | 'running' | 'done'>('idle');
  const { exit } = useApp();

  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      exit();
    }
    if (input === 'q' && view === 'menu') {
      exit();
    }
    if (input === 'q' && view !== 'generate' && view !== 'design') {
      setView('menu');
    }
  });

  const handleSelect = (item: MenuItem) => {
    setView(item.value);
  };

  const goBack = () => setView('menu');

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          ✦ Stitch Forge
        </Text>
        <Text dimColor> v0.1.0</Text>
      </Box>

      {view === 'menu' && (
        <Box flexDirection="column">
          <Text dimColor>Select an action:</Text>
          <Box marginTop={1}>
            <SelectInput items={MENU_ITEMS} onSelect={handleSelect} />
          </Box>
          <Box marginTop={1}>
            <Text dimColor>q: quit  ctrl+c: exit</Text>
          </Box>
        </Box>
      )}

      {view === 'dashboard' && (
        <Dashboard
          onAction={(action) => {
            if (action === 'generate') setView('generate');
          }}
        />
      )}

      {view === 'design' && (
        <DesignEditor onBack={goBack} />
      )}

      {view === 'generate' && (
        <PromptBuilder onBack={goBack} />
      )}

      {view === 'research' && (
        <Box flexDirection="column">
          <Text bold>Research — Stitch Updates</Text>
          <Box marginTop={1} flexDirection="column">
            {researchStatus === 'idle' && (
              <>
                <Text>Check if Google Stitch has any updates (new models, tools, features).</Text>
                <Box marginTop={1}>
                  <SelectInput
                    items={[
                      { label: '🔍 Run research now', value: 'run' },
                    ]}
                    onSelect={() => {
                      setResearchStatus('running');
                      setTimeout(() => setResearchStatus('done'), 2000);
                    }}
                  />
                </Box>
              </>
            )}
            {researchStatus === 'running' && (
              <Spinner label="Checking for Stitch updates..." />
            )}
            {researchStatus === 'done' && (
              <>
                <Text color="green">Research complete!</Text>
                <Box marginTop={1}>
                  <Text dimColor>
                    Run <Text bold>forge research</Text> from the CLI for a full update,{'\n'}
                    or use <Text bold>/forge-research</Text> in Claude Code for web-powered research.
                  </Text>
                </Box>
                <Box marginTop={1}>
                  <Text dimColor>Press q to go back</Text>
                </Box>
              </>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}

export function renderApp() {
  render(<App />);
}
