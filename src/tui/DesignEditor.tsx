import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import { existsSync, readFileSync } from 'node:fs';
import { StatusBar } from './components/StatusBar.js';

const SECTION_NAMES = [
  '1. Visual Theme & Atmosphere',
  '2. Color Palette & Roles',
  '3. Typography',
  '4. Spacing & Layout',
  '5. Component Patterns',
  '6. Iconography',
  '7. Imagery Guidelines',
  '8. Do\'s and Don\'ts',
];

interface DesignEditorProps {
  onBack?: () => void;
  onGenerate?: () => void;
}

function parseDesignMd(content: string): Map<string, string> {
  const sections = new Map<string, string>();
  const lines = content.split('\n');
  let currentSection = '';
  let currentContent: string[] = [];

  for (const line of lines) {
    const match = line.match(/^## (\d+\..+)/);
    if (match) {
      if (currentSection) {
        sections.set(currentSection, currentContent.join('\n').trim());
      }
      currentSection = match[1];
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    }
  }

  if (currentSection) {
    sections.set(currentSection, currentContent.join('\n').trim());
  }

  return sections;
}

export function DesignEditor({ onBack, onGenerate }: DesignEditorProps) {
  const hasDesignMd = existsSync('DESIGN.md');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  useInput((input) => {
    if (input === 'q') {
      if (selectedSection) {
        setSelectedSection(null);
      } else {
        onBack?.();
      }
    }
  });

  if (!hasDesignMd) {
    return (
      <Box flexDirection="column">
        <Text bold>Design System Editor</Text>
        <Box marginTop={1} flexDirection="column">
          <Text color="yellow">No DESIGN.md found in this project.</Text>
          <Text>A DESIGN.md defines your visual language — colors, fonts, spacing, and patterns.</Text>
          <Text>Stitch uses it to keep all generated screens consistent.</Text>
          <Box marginTop={1}>
            <Text>To create one:</Text>
          </Box>
          <Text dimColor>  Run: <Text bold>forge design "Company, Industry, Audience, Style"</Text></Text>
          <Text dimColor>  Or use: <Text bold>/forge-design</Text> in Claude Code</Text>
        </Box>
        <StatusBar hint="q: back" />
      </Box>
    );
  }

  const content = readFileSync('DESIGN.md', 'utf-8');
  const sections = parseDesignMd(content);

  if (selectedSection) {
    const sectionContent = sections.get(selectedSection) || '(empty)';
    return (
      <Box flexDirection="column">
        <Text bold>DESIGN.md — {selectedSection}</Text>
        <Box marginTop={1} borderStyle="round" borderColor="gray" paddingX={1} flexDirection="column">
          <Text>{sectionContent}</Text>
        </Box>
        <Box marginTop={1}>
          <Text dimColor>To edit this section, modify DESIGN.md directly or use /forge-design in Claude Code.</Text>
        </Box>
        <StatusBar hint="q: back to sections" />
      </Box>
    );
  }

  const sectionItems = SECTION_NAMES.map((name) => {
    const key = name.replace(/^\d+\.\s*/, '');
    const hasContent = Array.from(sections.keys()).some(k =>
      k.toLowerCase().includes(key.toLowerCase().substring(0, 10))
    );
    return {
      label: `${hasContent ? '✓' : '○'} ${name}`,
      value: name,
    };
  });

  return (
    <Box flexDirection="column">
      <Text bold>Design System Editor</Text>
      <Text dimColor>Your DESIGN.md has {sections.size} sections. Select one to view:</Text>
      <Box marginTop={1}>
        <SelectInput
          items={sectionItems}
          onSelect={(item) => {
            const matchKey = item.value.replace(/^\d+\.\s*/, '').toLowerCase();
            const found = Array.from(sections.keys()).find(k =>
              k.toLowerCase().includes(matchKey.substring(0, 10))
            );
            setSelectedSection(found || item.value);
          }}
        />
      </Box>
      <StatusBar hint="Enter: view section  q: back" />
    </Box>
  );
}
