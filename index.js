#!/usr/bin/env node

import OpenAI from 'openai';
import { exec } from 'child_process';
import { writeFile, mkdir } from 'fs/promises';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

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

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('Please set the OPENAI_API_KEY environment variable.');
  process.exit(1);
}

const openai = new OpenAI({ apiKey });

const getCommitLogs = async (since, until) => {
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
  const response = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are an expert in converting git commit logs into clean, minimal, professional release notes.",
      },
      {
        role: "user",
        content: `These are the commits for our software, please convert them into release notes using the provided template. Consolidate commits from the same day for readibility sake:
                
        RELEASE NOTES TEMPLATE :

        Version 1.0.62 - 1.0.61 (April 12, 2024)
        Process headlines updates.
        Enhanced caching features, including a force flag and improved handling of file naming conflicts.

        
        COMMIT MESSAGES :
        
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

console.log(`Generating release notes from ${argv.since} to ${argv.until}...`);
const logs = await getCommitLogs(argv.since, argv.until);
console.log('Commit logs retrieved.');
console.log('Generating release notes...');
const notes = await generateReleaseNotes(logs);
console.log('Release notes generated.');
console.log('Saving release notes to file...');
await saveToFile(notes, argv.output);
console.log('Release notes saved.');
