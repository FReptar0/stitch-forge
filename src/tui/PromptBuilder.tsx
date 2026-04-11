import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import { existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { buildInitialPrompt, type ScreenSpec } from '../templates/prompts.js';
import { validatePrompt } from '../utils/validators.js';
import { StitchMcpClient } from '../mcp/client.js';
import { StatusBar } from './components/StatusBar.js';
import { Spinner } from './components/Spinner.js';

type Step = 'page-type' | 'description' | 'sections' | 'review' | 'model' | 'sending' | 'done';

const PAGE_TYPES = [
  { label: 'Landing Page', value: 'landing page' },
  { label: 'About Page', value: 'about page' },
  { label: 'Pricing Page', value: 'pricing page' },
  { label: 'Dashboard', value: 'dashboard' },
  { label: 'Contact Page', value: 'contact page' },
  { label: 'Custom...', value: 'custom' },
];

const MODEL_OPTIONS = [
  { label: 'Flash — fast iteration (350/month)', value: 'flash' },
  { label: 'Pro — higher quality (200/month)', value: 'pro' },
];

interface PromptBuilderProps {
  onBack?: () => void;
}

export function PromptBuilder({ onBack }: PromptBuilderProps) {
  const [step, setStep] = useState<Step>('page-type');
  const [pageType, setPageType] = useState('');
  const [description, setDescription] = useState('');
  const [sections, setSections] = useState('');
  const [customType, setCustomType] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState('');

  useInput((input) => {
    if (input === 'q' && step !== 'description' && step !== 'sections' && step !== 'sending') {
      onBack?.();
    }
  });

  const buildPrompt = (): string => {
    const spec: ScreenSpec = {
      productName: 'My Project',
      productDescription: 'web application',
      pageType: pageType === 'custom' ? customType : pageType,
      targetUser: 'users',
      visualTone: 'clean, modern',
      sections: sections.split('\n').filter(s => s.trim()),
      hasDesignMd: false,
    };

    spec.hasDesignMd = existsSync('DESIGN.md');

    return buildInitialPrompt(spec);
  };

  const handleReview = () => {
    const prompt = buildPrompt();
    const validation = validatePrompt(prompt);
    if (!validation.valid) {
      setErrors(validation.errors);
    } else {
      setErrors([]);
    }
    setStep('review');
  };

  const handleSend = (item: { value: string }) => {
    const model = item.value as 'flash' | 'pro';
    setStep('sending');

    const modelId = model === 'pro' ? 'GEMINI_3_PRO' : 'GEMINI_2_5_FLASH';

    (async () => {
      try {
        const client = new StitchMcpClient();
        const projects = await client.listProjects();

        if (projects.length === 0) {
          setResult('No Stitch projects found. Create one at stitch.withgoogle.com first.');
          setStep('done');
          return;
        }

        const projectId = projects[0].id;
        const prompt = buildPrompt();

        const generated = await client.generateScreen(projectId, prompt, modelId);
        const html = await client.getScreenCode(projectId, generated.screenId);

        if (!existsSync('screens')) mkdirSync('screens');
        const filename = `screens/${generated.name || generated.screenId}.html`;
        writeFileSync(filename, html);

        setResult(`Screen saved: ${filename}`);
        setStep('done');
      } catch (err) {
        setResult(`Generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setStep('done');
      }
    })();
  };

  return (
    <Box flexDirection="column">
      <Text bold>Prompt Builder</Text>
      <Text dimColor>Build a screen prompt step by step</Text>
      <Box marginTop={1} flexDirection="column">
        {step === 'page-type' && (
          <>
            <Text>What type of page do you want to create?</Text>
            <Box marginTop={1}>
              <SelectInput
                items={PAGE_TYPES}
                onSelect={(item) => {
                  if (item.value === 'custom') {
                    setPageType('custom');
                    setStep('description');
                  } else {
                    setPageType(item.value);
                    setStep('description');
                  }
                }}
              />
            </Box>
          </>
        )}

        {step === 'description' && pageType === 'custom' && !customType && (
          <>
            <Text>Enter the page type:</Text>
            <Box marginTop={1}>
              <Text color="cyan">&gt; </Text>
              <TextInput
                value={customType}
                onChange={setCustomType}
                onSubmit={() => setStep('description')}
              />
            </Box>
          </>
        )}

        {step === 'description' && (pageType !== 'custom' || customType) && (
          <>
            <Text>Describe the page in a few words:</Text>
            <Text dimColor>Example: "A modern landing page for a project management SaaS"</Text>
            <Box marginTop={1}>
              <Text color="cyan">&gt; </Text>
              <TextInput
                value={description}
                onChange={setDescription}
                onSubmit={() => setStep('sections')}
              />
            </Box>
            <Box marginTop={1}><Text dimColor>Press Enter to continue</Text></Box>
          </>
        )}

        {step === 'sections' && (
          <>
            <Text>What sections should it include? (one per line, Enter twice to finish)</Text>
            <Text dimColor>Example: Hero with CTA, Features grid, Testimonials, Footer</Text>
            <Box marginTop={1}>
              <Text color="cyan">&gt; </Text>
              <TextInput
                value={sections}
                onChange={setSections}
                onSubmit={handleReview}
              />
            </Box>
            <Box marginTop={1}><Text dimColor>Press Enter to continue</Text></Box>
          </>
        )}

        {step === 'review' && (
          <>
            <Text bold>Generated Prompt:</Text>
            <Box marginTop={1} borderStyle="round" borderColor="gray" paddingX={1}>
              <Text>{buildPrompt()}</Text>
            </Box>

            {errors.length > 0 && (
              <Box marginTop={1} flexDirection="column">
                <Text color="red" bold>Issues found:</Text>
                {errors.map((err, i) => (
                  <Text key={i} color="red">  {err}</Text>
                ))}
              </Box>
            )}

            {errors.length === 0 && (
              <Box marginTop={1} flexDirection="column">
                <Text color="green">Prompt looks good! Choose a model:</Text>
                <Box marginTop={1}>
                  <SelectInput
                    items={MODEL_OPTIONS}
                    onSelect={handleSend}
                  />
                </Box>
              </Box>
            )}
          </>
        )}

        {step === 'sending' && <Spinner label="Preparing prompt..." />}

        {step === 'done' && (
          <Box flexDirection="column">
            <Text color="green">{result}</Text>
            <Box marginTop={1}><Text dimColor>Press q to go back to menu</Text></Box>
          </Box>
        )}
      </Box>

      <StatusBar hint={step === 'description' || step === 'sections' ? 'type and press Enter' : 'q: back  ctrl+c: exit'} />
    </Box>
  );
}
