# Financial Budgeting Application

This is a financial budgeting application built using **React**, **TypeScript**, and **Vite**. The application allows users to manage their financial transactions (incomes and expenses), view statistics, and navigate using a secure private route setup.

## Table of Contents

- [System Requirements](#system-requirements)
- [Installation](#installation)
- [Usage](#usage)
- [Testing](#testing)
- [Features](#features)
- [Contributing](#contributing)
- [License](#license)

## System Requirements

Ensure that your system meets the following requirements before running the application:

- **Node.js**: v18 or higher
- **npm**: v10 or higher
- **Vite**: Latest stable version (comes bundled with the installation)

## Installation

Follow these steps to install and set up the application locally:

1. Clone the repository:

   ```bash
   git clone https://github.com/your-repository-url/financial-budgeting-app.git
   ```

2. Navigate to the project directory:

   ```bash
   cd financial-budgeting-app
   ```

3. Install the dependencies:

   ```bash
   npm i
   ```

## Usage

To run the application locally:

1. Start the development server:

   ```bash
   npm run dev
   ```

2. Open your browser and navigate to:

   ```
   http://localhost:5173
   ```

   The application should be running with hot-reload enabled for development.

### Building for Production

To build the application for production:

```bash
npm run build
```

The optimized and minified build will be created in the `dist/` folder.

## Testing

We use **Vitest** and **Testing Library** to test the components.

### Running Unit and Integration Tests

To run the tests with coverage:

```bash
npm run test
```

For a more detailed output or interactive mode:

```bash
npm run test:ui
```

### Coverage Report

To generate and view coverage statistics:

```bash
npm run test:coverage
```

The coverage report can be found in the `coverage/` directory, and you can view it by opening `coverage/index.html` in your browser.

## Features

- **Transaction Management**: Add, edit, and remove incomes and expenses.
- **Data Visualization**: View charts showing your financial trends.
- **Private Routes**: Secure routes with authentication checks.
- **Dark Mode Support**: Switch between light and dark themes seamlessly.
- **Responsive Design**: Fully responsive UI that works on all devices.

## Contributing

We welcome contributions from the community! Please read our [contributing guidelines](CONTRIBUTING.md) before submitting any pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
