#!/usr/bin/env node

import { writeFile, mkdir } from 'fs/promises';
import { hideBin } from 'yargs/helpers';
import { exec } from 'child_process';
import OpenAI from 'openai';
import yargs from 'yargs';
import fs from 'fs';

const prompt = fs.readFileSync('prompt.txt', 'utf8');
const apiKey = process.env.OPENAI_API_KEY;
const openai = new OpenAI({ apiKey });

const argv = yargs(hideBin(process.argv))
  .option('since', {
    describe: 'Starting date in YYYY-MM-DD format',
    type: 'string',
    demandOption: true,
    requiresArg: true
  })
  .option('until', {
    describe: 'Ending date in YYYY-MM-DD format',
    type: 'string',
    demandOption: true,
    requiresArg: true
  })
  .option('output', {
    describe: 'File path to output the release notes',
    type: 'string',
    demandOption: true,
    requiresArg: true
  })
  .help()
  .alias('help', 'h')
  .argv;

if (!apiKey) {
  console.error('Please set the OPENAI_API_KEY environment variable.');
  process.exit(1);
}

const getCommitLogs = async (since, until) => {
  console.log(`Fetching commit logs from ${since} to ${until}...`);
  const command = `git log --since="${since}" --until="${until}" --pretty=format:"%ad - %s"`;
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(stderr);
      } else {
        resolve(stdout);
      }
    });
  });
};

const generateReleaseNotes = async (commitLogs) => {
  console.log('Generating release notes...');
  const response = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: prompt,
      },
      {
        role: "user",
        content: `Please generate release notes for the following commit logs:
        
        ${commitLogs}`
      },
    ],
    model: "gpt-3.5-turbo-0125",
  });
  return response.choices[0].message.content;
};

const saveToFile = async (releaseNotes, filePath) => {
  const path = filePath.split('/');
  path.pop();
  await mkdir(path.join('/'), { recursive: true });
  await writeFile(filePath, releaseNotes, 'utf8');
  console.log(`Release notes saved to ${filePath}`);
};

const logs = await getCommitLogs(argv.since, argv.until);

if (!logs) {
  console.error('No logs found for the specified date range.');
  process.exit(1);
}

const notes = await generateReleaseNotes(logs);
await saveToFile(notes, argv.output);
