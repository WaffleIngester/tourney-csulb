## Info
Below is a part of the default README that is generated when making a Svelte project.

I removed some pieces, but hopefully this is helpful as is.

As this project is updated, this README will gradually be expanded so it's a bit more obvs
---------

## Install & Run
nvm install 24.21.0
nvm use 24.21.0
npm ci
npm run dev




## Adding features

Add features to your project with `sv add`:

```sh
npx sv add
```

For example, to add Tailwind CSS:

```sh
npx sv add tailwindcss
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
