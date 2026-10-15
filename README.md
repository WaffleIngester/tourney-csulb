# Tourney Scorer
A web-based scoring utility for [Super Animal Royale](https://animalroyale.com/) tournaments built with [Svelte](https://svelte.dev/).
> **Note**: This project is still in the early stages of development. As such, its primarily intended for local development/ testing. Expect things to break.

## Getting Started
### Prerequisites
- Git
- Node.js 24.21.0
- nvm

## Installation & Running
### Cloning Repository
Once you have selected a destination folder...

1. Clone the repository:
```sh
git clone https://github.com/WaffleIngester/tourney-csulb.git
```

2. Install and/ or activate the required Node.js version:
```sh
nvm install 24.21.0
nvm use 24.21.0
```

3. Install the dependencies:
```sh
npm ci
```

### Running the Development Server
```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

### Building
To create a production build:
```sh
npm run build
```

## Sample Data
The `samples/` folder contains sample data used for testing supported scenarios.

See `samples/README.md` for more information.
