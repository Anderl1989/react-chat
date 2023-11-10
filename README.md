# Usage

Install dependencies with `npm install`.

## Production use

To start the server for production, use  
`npm start`  
which will build the frontend and serve the frontend with the backend.
Navigate to [http://localhost:3000](http://localhost:3000)

## Development use

To start the frontend and backend for development, use  
`npm run start_backend`  
to start the backend  
and in a different terminal, use  
`npm run dev`  
to start the frontend.

If you change the server port in `backend/index.js`, it is necessary to also change it in `frontend/src/Chat.jsx`, otherwise the frontend cannot reach the backend.

# Project setup

This chapter describes how I set this project up. You only need this if you want to start your own similar project from scratch, or don't understand how the project is set up.

## Frontend

We created the frontend using  
`npm create vite@latest ./frontend -- --template react`  
Compared to the react-wetter-app example, we added a path `./frontend` to the command, so we get a sub-folder for the frontend.

I didn't want to have separate `package.json` files for front- and backend, so I had to restructure the project a little:

* I removed the `.gitignore` file from the `frontend` folder and created my own `.gitignore` file in the root folder
* The `package.json` was moved from the `frontend` folder to the root folder
* The `vite.config.js` was moved from the `frontend` folder to the root folder
* In the `vite.config.js` I added the line `root: './frontend',` so the vite commands know where to look for the frontend files

I added a few dependencies that we will use in the frontend:
```
npm install @mui/material @emotion/react @emotion/styled
npm install @fontsource/roboto
npm install @mui/icons-material
```

## Backend

I added a few dependencies that we will use in the backend:
```
npm install express body-parser cors
npm install express-ws
```

Then I created a `backend` folder and added an `index.js` file with my express app.

To start the backend I added the script  
`"start_backend": "node ./backend/index.js",`  
to `package.json`.

In a production environment, you would not start separate servers for frontend and backend, but rather use the backend to serve your frontend. Therefore the frontend needs to be build (prepared for production use) which can be done using the `build` script from `package.json` that was added by vite. Executing that command will create a `dist` folder inside the `frontend` folder with all the files necessary to run the frontend. In this case, we can serve the frontend by just adding a static routing ([see express doku](https://expressjs.com/en/starter/static-files.html)) to this `frontend/dist` folder, as the frontend does not include a router.

I added another script to the `package.json`:  
`"start": "npm run build && npm run start_backend",`  
This script builds the frontend (so contents of `frontend/dist` folder contains the latest changes in the code) and afterwards starts the backend.