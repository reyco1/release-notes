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
        content: "You are an expert in converting git commit logs into clean, minimal, professional release notes.",
      },
      {
        role: "user",
        content: `These are the commits for our software, please convert them into release notes using the provided template. Consolidate commits from the same day for readibility sake:
                
        RELEASE NOTES TEMPLATE :

        Version range (date)
        - update 1
        - update 2

        
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

const logs = await getCommitLogs(argv.since, argv.until);
// if there are not logs, throw a warning in red and exit
if (!logs) {
  console.error('No logs found for the specified date range.');
  process.exit(1);
}
const notes = await generateReleaseNotes(logs);
await saveToFile(notes, argv.output);
