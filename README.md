Here's an updated README with an alternative SSH clone option:

---

# Jabba Index Generator

This repository contains a tool for automatically updating the JDK index used by [Jabba](https://github.com/shyiko/jabba), a popular Java version manager. The tool leverages the [DiscoAPI](https://api.foojay.io/disco/v2.0/) to fetch the latest JDK distributions and updates the index accordingly.

## Features

- **Automated Updates**: The GitHub Action in this repository runs daily to ensure the JDK index remains up to date.
- **Integration with Jabba**: The generated index is pushed to the Jabba Index Repository, making it immediately available for users.

## Prerequisites

- **Node.js LTS or Current**: Any supported Node version should work

## Setup

1. **Clone the Repository**:

   Using HTTPS:
   ```bash
   git clone https://github.com/Jabba-Team/index-generator.git
   ```

   Or, using SSH:
   ```bash
   git clone git@github.com:Jabba-Team/index-generator.git
   ```

2. **Navigate to the Project Directory**:
   ```bash
   cd index-generator
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Run the Generator**:
   ```bash
   node src/index.js
   ```
   This command fetches the latest JDK data from DiscoAPI and updates the index.

## GitHub Actions

This repository includes a GitHub Action that automates the update process:

- **Daily Update**: The action is scheduled to run daily, pulling the latest JDK data and pushing the updated index to the [Jabba Index Repository.](https://github.com/Jabba-Team/index)
- **Token Rotation**: GitHub requires that the personal access token (PAT) used in the action is regularly rotated. Be sure to update the token if the action is disabled due to inactivity.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request with any improvements or bug fixes.
