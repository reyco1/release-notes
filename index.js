#!/usr/bin/env node

import { writeFile, mkdir } from 'fs/promises';
import { hideBin } from 'yargs/helpers';
import { exec } from 'child_process';
import OpenAI from 'openai';
import yargs from 'yargs';

const prompt = `Steps to Format Git Commit Logs into Release Notes:
        
1. Input Preparation:
    - User will provide all commit logs relevant for the release notes.
    - Ensure each log entry follows the standard format: "[dateTime] (v[version number]) [Commit message]".

2. Summary Creation:
    - Begin by summarizing the main achievements or features introduced in this batch of commits. Highlight any major enhancements, critical bug fixes, or significant performance improvements.

3. Release Notes Formatting:
    - Group commits by their version number. Each group corresponds to a version release.
    - For each version, sort the commit messages chronologically if dates are available, or maintain the order they were logged.

4. Release Notes Template:
    - Header: Start with a heading for the Release Notes followed by the date range these notes cover (if applicable).
    - Summary: Provide a brief, general summary of what this release encompasses. Highlight key features and improvements.
    - Detailed Changes:
        - For each version, create a subsection with the version number as the heading.
        - List each commit message under its respective version heading. Remove any redundant information like author names, and ensure the focus is on what changed.
        - Use bullet points for each commit message to improve readability.

5. Consistency Check:
    - Ensure that the language is consistent throughout the document—use the same tense and voice.
    - Check that formatting is uniform for each version subsection.

6. Example Output Structure:

Release Notes  - [Date Range or 'As of [Latest Date]']

Summary:
This release brings significant user interface enhancements, improves performance, and fixes several critical bugs. Key updates include a revamped login screen and faster data processing.

Version 1.0.10:
- Updated the UI for easier use.
- Improved error handling in the data export feature.

Version 1.0.9:
- Enhanced security protocols for user authentication.
- Fixed memory leak issues observed in version 1.0.8.`;

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
