# Contributing to Zentrun

We love your input! We want to make contributing to Zentrun as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

### Internal Team Contributors

#### Bug Fixes and Minor Feature Improvements

- Develop directly on the `dev` branch
- Code submitted to the `dev` branch must ensure:
  - Basic functionality works
  - No compilation errors
  - Project can start normally with `npm run dev`

#### Major Features or Refactoring

- Create a new feature branch named `feature/featurename`
- Merge the feature branch back to `dev` branch upon completion

### External Contributors

1. Fork this repository to your personal account
2. Create your development branch from `dev`
3. Develop in your forked repository
4. Submit a Pull Request to the `dev` branch of the original repository
5. Describe the Issues fixed in your PR description (if applicable)

## Local Development Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/zentrun.git
   cd zentrun
   ```

2. Install required development tools:

   - Install [Node.js](https://nodejs.org/) (Latest LTS version recommended)

3. Additional setup based on your operating system:

   **Windows:**

   - Install Windows Build Tools:
     GUI Installation:
     - Install [Visual Studio Community](https://visualstudio.microsoft.com/vs/community/)
     - Select "Desktop development with C++" workload during installation
     - Ensure "Windows 10/11 SDK" and "MSVC v143 build tools" components are selected（Vistual Studio 2022 recommended)
   - Install Git for Windows

   **macOS:**

   - Install Xcode Command Line Tools:
     ```bash
     xcode-select --install
     ```
   - Recommended: Install Homebrew package manager:
     ```bash
     /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
     ```

   **Linux:**

   - Install required build dependencies:
     ```bash
     # Ubuntu/Debian
     sudo apt-get install build-essential git
     # Fedora
     sudo dnf groupinstall "Development Tools"
     sudo dnf install git
     ```

4. Install project dependencies:

   ```bash
   yarn install
   ```

5. Start the development server:
   ```bash
   yarn dev
   ```

## Project Structure

- `/src` - Main source code
- `/scripts` - Build and development scripts
- `/resources` - Application resources
- `/build` - Build configuration
- `/out` - Build output

## Code Style

- We use ESLint for JavaScript/TypeScript linting
- Prettier for code formatting
- EditorConfig for maintaining consistent coding styles

Please ensure your code follows our style guidelines by running:

```bash
yarn lint
yarn format
```

## Pull Request Process

1. Update the README.md with details of changes to the interface, if applicable.
2. Update documentation in the `/docs` directory if needed.
3. The PR will be merged once you have the sign-off of at least one maintainer.

## Any Questions?

Feel free to open an issue with the tag "question" if you have any questions about contributing.

## License

By contributing, you agree that your contributions will be licensed under the project's license.
