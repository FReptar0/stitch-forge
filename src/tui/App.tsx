import React, { useState } from 'react';
import { render, Box, Text, useInput, useApp } from 'ink';
import SelectInput from 'ink-select-input';
import { Dashboard } from './Dashboard.js';
import { PromptBuilder } from './PromptBuilder.js';
import { DesignEditor } from './DesignEditor.js';
import { Spinner } from './components/Spinner.js';
import { listScreenFiles, openInBrowser } from '../utils/preview.js';
import { crawlSources } from '../research/crawler.js';
import { diffAgainstKnownState } from '../research/differ.js';
import { getKnownState } from '../research/updater.js';
import { resolve, join } from 'node:path';

type View = 'menu' | 'dashboard' | 'generate' | 'design' | 'research' | 'preview';

interface MenuItem {
  label: string;
  value: View;
}

const MENU_ITEMS: MenuItem[] = [
  { label: '📊 Dashboard — Project overview & quota', value: 'dashboard' },
  { label: '🎨 Design — Create/edit DESIGN.md', value: 'design' },
  { label: '🖼️  Generate — Build a screen prompt', value: 'generate' },
  { label: '👁️  Preview — Open screens in browser', value: 'preview' },
  { label: '🔬 Research — Check for updates', value: 'research' },
];

function App() {
  const [view, setView] = useState<View>('menu');
  const [researchStatus, setResearchStatus] = useState<'idle' | 'running' | 'done'>('idle');
  const [researchResults, setResearchResults] = useState<string | null>(null);
  const [researchError, setResearchError] = useState<string | null>(null);
  const [previewMessage, setPreviewMessage] = useState<string | null>(null);
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
          ✦ Design Guard
        </Text>
        <Text dimColor> v0.3.1</Text>
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
            if (action === 'preview') setView('preview');
          }}
        />
      )}

      {view === 'design' && (
        <DesignEditor onBack={goBack} />
      )}

      {view === 'generate' && (
        <PromptBuilder onBack={goBack} />
      )}

      {view === 'preview' && (
        <Box flexDirection="column">
          <Text bold>Preview — Open Screens in Browser</Text>
          <Box marginTop={1} flexDirection="column">
            {(() => {
              const screens = listScreenFiles();
              if (screens.length === 0) {
                return (
                  <>
                    <Text color="yellow">No screens found in screens/.</Text>
                    <Text dimColor>Run <Text bold>dg generate</Text> to create screens first.</Text>
                    <Box marginTop={1}>
                      <Text dimColor>Press q to go back</Text>
                    </Box>
                  </>
                );
              }
              return (
                <>
                  <Text dimColor>Select a screen to open in your browser:</Text>
                  <Box marginTop={1}>
                    <SelectInput
                      items={screens.map(s => ({ label: s, value: s }))}
                      onSelect={(item) => {
                        const screenPath = resolve(join('screens', `${item.value}.html`));
                        openInBrowser(screenPath).then(() => {
                          setPreviewMessage(`Opened ${item.value} in browser.`);
                        }).catch(() => {
                          setPreviewMessage(`Could not open ${item.value}. Open manually: ${screenPath}`);
                        });
                      }}
                    />
                  </Box>
                  {previewMessage && (
                    <Box marginTop={1}>
                      <Text color="green">{previewMessage}</Text>
                    </Box>
                  )}
                  <Box marginTop={1}>
                    <Text dimColor>Press q to go back</Text>
                  </Box>
                </>
              );
            })()}
          </Box>
        </Box>
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
                      setResearchError(null);
                      crawlSources()
                        .then(crawlResults => {
                          const knownState = getKnownState();
                          const diff = diffAgainstKnownState(crawlResults, knownState);
                          if (diff.hasChanges) {
                            setResearchResults(
                              diff.changes.map(c => `[${c.severity}] ${c.category}: ${c.description}`).join('\n')
                            );
                          } else {
                            setResearchResults('No changes detected. Knowledge base is current.');
                          }
                          setResearchStatus('done');
                        })
                        .catch(err => {
                          setResearchError(err instanceof Error ? err.message : 'Unknown error');
                          setResearchStatus('done');
                        });
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
                {researchError ? (
                  <Text color="red">Research failed: {researchError}</Text>
                ) : (
                  <>
                    <Text color="green">Research complete!</Text>
                    {researchResults && (
                      <Box marginTop={1} flexDirection="column">
                        <Text>{researchResults}</Text>
                      </Box>
                    )}
                  </>
                )}
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
