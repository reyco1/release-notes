# Release Notes Generator

The Release Notes Generator is a command-line tool that automates the creation of professional release notes from Git commit logs. Leveraging OpenAI's powerful GPT-3.5 model, it efficiently converts raw commit data into a clean, structured format. This tool is ideal for project managers, developers, and teams looking to streamline their release documentation process.

## Features

- **Automated Generation**: Automatically generates release notes from Git commit logs.
- **OpenAI Integration**: Uses OpenAI's GPT-3.5 to ensure the notes are concise and professionally formatted.
- **Customizable Date Range**: Generate notes for specific development periods by specifying start and end dates.

## Prerequisites

Before you install and use the Release Notes Generator, ensure you have the following:

- Node.js (v14 or higher)
- npm (v6 or higher)
- Git installed on your machine
- An OpenAI API key (set as an environment variable `OPENAI_API_KEY`)

## Installation

To install the Release Notes Generator globally, run the following command:

```bash
npm install -g @reyco1/release-notes
```

## Usage

To generate release notes, you need to provide a date range (`since` and `until`) and an output file path:

```bash
release-notes --since=YYYY-MM-DD --until=YYYY-MM-DD --output=path/to/output.md
```

### Example

```bash
release-notes --since=2024-01-01 --until=2024-04-01 --output=./release-notes-April.md
```

This will fetch commits from 1st January 2024 to 1st April 2024 and save the generated release notes to `release-notes-April.md`.

## Configuration

Ensure that your `OPENAI_API_KEY` is set in your environment variables to authenticate requests to OpenAI:

```bash
export OPENAI_API_KEY="your_openai_api_key_here"
```

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue if you have feedback, suggestions, or improvements.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any problems or have any queries about using the tool, please open an issue on GitHub.

## Authors

- **Rey Columna** - [reyco1](https://github.com/reyco1)

Thank you for using or contributing to Release Notes Generator!