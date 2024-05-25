import * as fs from 'fs';
import express from 'express';
import path from 'path';
import {Eta} from 'eta';
import {fileURLToPath} from 'url';
import PluginPrim from './prims.js';
import compression from 'compression';
import cors from 'cors';
// Define file and directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const devMode = !args.includes('--prod');

const config = {
  // URL to Model Viewer (not included)
  viewerURL: 'https://3d.nekohime.net/rw/',
  // set this to '' if you want the server
  //  to serve from mydomain.com/ and NOT from mydomain.com/whatever/
  vwopSubfolder: 'vwop',
  // routePrefix: null,
  // baseHref: devMode ? 'http://localhost:8888/' : 'https://3d.nekohime.net/vwop/',
  // Where VWOP is installed.
  baseVWOPPath: path.join(__dirname, '../'),
  serverBasePath: '/var/www/3d/terra',
  directories: [
    'rwx', // 'models',
    'textures', 'pictures',
    'avatars', 'seqs',
    'sounds',
    'groups',
  ],
};

// Set baseHref and routePrefix based on devMode and vwopSubfolder
config.baseHref = devMode ? `http://3d.localhost/${config.vwopSubfolder ? config.vwopSubfolder + '/' : ''}` : `https://3d.nekohime.net/${config.vwopSubfolder ? config.vwopSubfolder + '/' : ''}`;
config.routePrefix = config.vwopSubfolder ? `/${config.vwopSubfolder}/` : '/';

const app = express();
const port = 8888;

// Initialize Eta template engine
const eta = new Eta({
  views: path.join(__dirname, 'views'),
  cache: true,
  useWith: true,
  autoEscape: false,
});

// Enable CORS, Serve Static Assets and Enable Compression
app.use(cors());
app.use(express.static(path.join(__dirname, 'assets')));
app.use(compression());

// Serve main.css file explicitly
app.get(`${config.routePrefix}main.css`, (req, res) => {
  res.sendFile(path.join(__dirname, 'assets', 'main.css'));
});

// Define routes
app.get(config.routePrefix, serveIndex);
config.directories.forEach((folder) => {
  app.get(`${config.routePrefix}:folder/`, serveFolderIndex);
  app.get(`${config.routePrefix}:folder/:file`, serveFile);
});

/**
 * Serves the index page.
 * @param {express.Request} req - The request object.
 * @param {express.Response} res - The response object.
 */
function serveIndex(req, res) {
  const renderedTemplate = eta.render('index', {
    baseHref: config.baseHref,
    directories: listOfDirectoriesInPath(config.directories),
  });
  res.status(200).send(renderedTemplate);
}

/**
 * Serves the folder index page.
 * @param {express.Request} req - The request object.
 * @param {express.Response} res - The response object.
 * @return {void | express.Response} If the requested folder is not allowed,
 *  returns void. Otherwise, returns an express Response object.
 */
function serveFolderIndex(req, res) {
  const folder = req.params.folder;

  // Check if the requested folder is not allowed
  if (!config.directories.includes(folder)) {
    return res.status(400).send('Invalid request');
  }

  const renderedTemplate = eta.render('folder', {
    baseHref: config.baseHref,
    files: listOfFilesInDirectory(`/${folder}/`),
    folder: folder,
    directories: listOfDirectoriesInPath(config.directories),
  });
  console.log(`User requesting folder: ${folder}`);
  res.status(200).send(renderedTemplate);
}

/**
 * Serves a file requested by the client.
 * @param {express.Request} req - The request object.
 * @param {express.Response} res - The response object.
 * @return {void | express.Response} If the request is invalid, returns void.
  * Otherwise, returns an express Response object.
 */
function serveFile(req, res) {
  console.log('Request Parameters:', req.params);

  const folder = req.params.folder;
  const reqFile = req.params.file;
  console.log('Folder:', folder);
  console.log('Request File:', reqFile);

  if (!folder || !reqFile || !isValidFileName(reqFile)) {
    return res.status(400).send('Invalid request');
  }

  console.log('=====================================');
  const fileToServe = path.join(config.serverBasePath, folder, reqFile);
  const primPlugin = new PluginPrim(config.baseVWOPPath);
  const prim = primPlugin.handleRequest(folder, reqFile);

  if (prim) {
    const pathToPrim = path.join(config.baseVWOPPath, prim);
    res.sendFile(pathToPrim);
  } else {
    res.sendFile(fileToServe);
  }
}


/**
 * Generates HTML for a file link.
 * @param {string} file - The name of the file.
 * @param {string} dir - The directory path.
 * @return {string} HTML for the file link.
 */
function generateFileLink(file, dir) {
  const url = new URL(config.baseHref);
  url.pathname = path.join(url.pathname, dir, file).replace(/\/+/g, '/');
  let html = `<a href="${url.href}">${file}</a>`;
  // eslint-disable-next-line
  html += ' <button onclick=navigator.clipboard.writeText("' + file + '");>Copy</button>';

  if (dir === '/rwx/' || dir === '/models/' || dir === '/avatars/') {
    // eslint-disable-next-line
    html += ` <button onclick=viewModel("${config.viewerURL}?model=${file}")>View</button>`;
  }

  if (dir === '/textures/') {
    // eslint-disable-next-line
    html += ` <button onclick=viewModel("${config.viewerURL}?model=p:w800,,.5.rwx&action=create+texture+${file}")>View</button>`;
  }

  html += `<br>`;
  return html;
}

/**
 * Generates HTML for listing directories in a path.
 * @param {string[]} dirs - An array of directory names.
 * @return {string} HTML for listing directories.
 */
function listOfDirectoriesInPath(dirs) {
  let html = '';
  dirs.forEach((dir) => {
    html += `<li><a href="${dir}">${dir}</a></li>`;
  });
  return html;
}

/**
 * Generates HTML for listing files in a directory.
 * @param {string} dir - The directory path.
 * @return {string} HTML for listing files.
 */
function listOfFilesInDirectory(dir) {
  try {
    const listObj = fs.readdirSync(path.join(config.serverBasePath, dir));
    let html = '';

    listObj.forEach((file) => {
      if (!file.endsWith('.sh')) {
        html += generateFileLink(file, dir);
      }
    });

    return html;
  } catch (error) {
    console.error(`Error reading directory ${dir}: ${error.message}`);
    return '';
  }
}

/**
 * Validates file names.
 * @param {string} fileName - The file name to validate.
 * @return {boolean} True if the file name is valid, otherwise false.
 */
function isValidFileName(fileName) {
  const regex = /^[a-zA-Z0-9.,:_-]+$/;
  return regex.test(fileName);
}

// Define MIME types
express.static.mime.define({
  'text/css': ['css'],
  'text/plain': ['rwx'],
  'application/zip': ['zip'],
  'image/png': ['png'],
  'image/jpeg': ['jpg', 'jpeg'],
  'audio/mpeg': ['mp3'],
  'video/mp4': ['mp4'],
  'audio/midi': ['mid', 'midi'],
  'audio/wav': ['wav'],
  'audio/weba': ['weba'],
  'video/webm': ['webm'],
  'image/webp': ['webp'],
});

// Start the Express server
app.listen(port, () => {
  console.log(`VWOP starting on port ${port} with the following settings:`);
  console.log(config);
});
