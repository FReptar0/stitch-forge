import React from 'react';
import { Box, Text } from 'ink';

interface QuotaMeterProps {
  label: string;
  used: number;
  limit: number;
  width?: number;
}

export function QuotaMeter({ label, used, limit, width = 20 }: QuotaMeterProps) {
  const filled = Math.round((used / limit) * width);
  const empty = width - filled;
  const remaining = limit - used;
  const isLow = remaining / limit < 0.1;

  return (
    <Box>
      <Text>{label.padEnd(14)}</Text>
      <Text color="gray">[</Text>
      <Text color={isLow ? 'red' : 'green'}>{'='.repeat(filled)}</Text>
      <Text color="gray">{'-'.repeat(empty)}</Text>
      <Text color="gray">]</Text>
      <Text> {used}/{limit}</Text>
      <Text dimColor> ({remaining} left)</Text>
    </Box>
  );
}
