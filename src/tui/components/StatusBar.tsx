import React from 'react';
import { Box, Text } from 'ink';

interface StatusBarProps {
  projectName?: string;
  model?: string;
  hint?: string;
}

export function StatusBar({ projectName, model, hint }: StatusBarProps) {
  return (
    <Box borderStyle="single" borderColor="gray" paddingX={1} marginTop={1}>
      {projectName && (
        <Text dimColor>Project: {projectName}</Text>
      )}
      {model && (
        <Text dimColor>  Model: {model}</Text>
      )}
      <Box flexGrow={1} />
      <Text dimColor>{hint || 'q: back  ctrl+c: exit'}</Text>
    </Box>
  );
}
