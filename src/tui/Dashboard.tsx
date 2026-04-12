import React from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import { getConfig, configExists } from '../utils/config.js';
import { getQuotaStatus } from '../utils/quota.js';
import { QuotaMeter } from './components/QuotaMeter.js';
import { ScreenCard } from './components/ScreenCard.js';
import { StatusBar } from './components/StatusBar.js';

interface DashboardProps {
  onAction?: (action: string) => void;
}

const QUICK_ACTIONS = [
  { label: '🖼️  Generate a new screen', value: 'generate' },
  { label: '🔄 Sync screens from Stitch', value: 'sync' },
  { label: '👁️  Preview a screen', value: 'preview' },
  { label: '🏗️  Build site', value: 'build' },
];

export function Dashboard({ onAction }: DashboardProps) {
  if (!configExists()) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color="yellow">No project configured</Text>
        <Text>Run <Text bold>dg init</Text> to set up your project first.</Text>
        <Text dimColor>This will create your config file and connect to Stitch.</Text>
      </Box>
    );
  }

  const config = getConfig();
  const quota = getQuotaStatus();

  return (
    <Box flexDirection="column">
      <Box flexDirection="column" marginBottom={1}>
        <Text bold>Project Overview</Text>
        <Box marginTop={1} flexDirection="column">
          <Text>Name:       <Text bold>{config.projectName || '(not set)'}</Text></Text>
          <Text>Project ID: <Text dimColor>{config.projectId || '(not set)'}</Text></Text>
          {config.lastSync && (
            <Text>Last sync:  <Text dimColor>{new Date(config.lastSync).toLocaleString()}</Text></Text>
          )}
        </Box>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text bold>Quota</Text>
        <Box marginTop={1} flexDirection="column">
          <QuotaMeter label="Flash (fast)" used={quota.flash.used} limit={quota.flash.limit} />
          <QuotaMeter label="Pro (quality)" used={quota.pro.used} limit={quota.pro.limit} />
          <Text dimColor>Resets: {quota.resetDate}</Text>
        </Box>
      </Box>

      {config.screens.length > 0 && (
        <Box flexDirection="column" marginBottom={1}>
          <Text bold>Screens ({config.screens.length})</Text>
          <Box marginTop={1} flexDirection="column">
            {config.screens.map((screen) => (
              <ScreenCard
                key={screen.id}
                name={screen.name}
                route={screen.route}
                lastSynced={screen.lastSynced}
              />
            ))}
          </Box>
        </Box>
      )}

      {config.screens.length === 0 && (
        <Box marginBottom={1}>
          <Text dimColor>No screens yet. Generate your first one below!</Text>
        </Box>
      )}

      <Box flexDirection="column">
        <Text bold>Quick Actions</Text>
        <Box marginTop={1}>
          <SelectInput
            items={QUICK_ACTIONS}
            onSelect={(item) => onAction?.(item.value)}
          />
        </Box>
      </Box>

      <StatusBar
        projectName={config.projectName}
        model={config.defaultModel === 'GEMINI_2_5_FLASH' ? 'Flash' : 'Pro'}
      />
    </Box>
  );
}
