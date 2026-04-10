import React from 'react';
import { Box, Text } from 'ink';

interface ScreenCardProps {
  name: string;
  route?: string;
  lastSynced?: string;
}

export function ScreenCard({ name, route, lastSynced }: ScreenCardProps) {
  return (
    <Box borderStyle="round" borderColor="gray" paddingX={1} marginBottom={0}>
      <Text bold>{name}</Text>
      {route && <Text dimColor>  {route}</Text>}
      {lastSynced && (
        <Text dimColor>  synced {new Date(lastSynced).toLocaleDateString()}</Text>
      )}
    </Box>
  );
}
