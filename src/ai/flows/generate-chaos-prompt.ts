'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating random prompts using a set of predefined keywords.
 *
 * It exports:
 * - `generateChaosPrompt`: An async function that generates a random prompt.
 * - `ChaosPromptOutput`: The output type for the generateChaosPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChaosPromptOutputSchema = z.object({
  prompt: z.string().describe('A randomly generated prompt string.'),
  animal: z.string().describe('A random animal.'),
  action: z.string().describe('A random action.'),
  setting: z.string().describe('A random setting.'),
  style: z.string().describe('A random style.'),
});

export type ChaosPromptOutput = z.infer<typeof ChaosPromptOutputSchema>;

const animals = [
  'T-rex',
  'Penguin',
  'Kitten',
  'Puppy',
  'Elephant',
  'Lion',
  'Unicorn',
  'Dragon',
  'Llama',
  'Robot',
];
const actions = [
  'eating spaghetti',
  'skateboarding',
  'dancing',
  'flying',
  'reading a book',
  'painting',
  'coding',
  'juggling planets',
  'riding a monocycle',
  'breathing fire',
];
const settings = [
  'on Saturn',
  'in a jungle',
  'underwater',
  'in a castle',
  'on a mountain top',
  'in a neon-lit city',
  'inside a volcano',
  'at a disco',
  'in a library of lost books',
  'on a pirate ship',
];
const styles = [
  'pixel art',
  '3D render',
  'cartoon',
  'photorealistic',
  'oil painting',
  'watercolor',
  'cyberpunk',
  'steampunk',
  'art deco',
  'vaporwave',
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

async function generateRandomPrompt(): Promise<ChaosPromptOutput> {
  return chaosPromptFlow();
}

const chaosPromptFlow = ai.defineFlow(
  {
    name: 'chaosPromptFlow',
    outputSchema: ChaosPromptOutputSchema,
  },
  async () => {
    const animal = getRandomElement(animals);
    const action = getRandomElement(actions);
    const setting = getRandomElement(settings);
    const style = getRandomElement(styles);

    const prompt = `A ${animal} ${action} ${setting}, in ${style} style.`;

    return {
      prompt: prompt,
      animal,
      action,
      setting,
      style,
    };
  }
);

export {generateRandomPrompt};
