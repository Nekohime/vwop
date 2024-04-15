import * as fs from 'fs';
import express from 'express';
import path from 'path';
// import * as ejs from 'ejs'; // eslint-disable-line no-unused-vars
import { Eta } from 'eta';
import compression from 'compression';
import cors from 'cors';
import {fileURLToPath} from 'url';
import PluginPrim from './prims.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const devMode = true;

// URL to Model Viewer (not included)
const viewerURL = 'https://3d.nekohime.net/rw/';

// set this to '' if you want the server
//  to serve from mydomain.com/ and NOT from mydomain.com/whatever/
let vwopSubfolder = 'vwop';
const routePrefix = vwopSubfolder ? `/${vwopSubfolder}/` : '/';

let baseHref = 'http://localhost:8888/';
const baseHrefProd = 'https://3d.nekohime.net/vwop/';

if (!devMode) baseHref = baseHrefProd;

const baseVWOPPath = path.join(__dirname, '../'); // ~/git/vwop/
console.log(baseVWOPPath)
// Where OP folders are. They are defined in directories[] below
// Where the path folders live, end with a forward slash /
const serverBasePath = '/var/www/3d/terra/';
const directories = [
  'rwx',
  // 'models',
  'avatars',
  'textures',
  'seqs',
  'sounds',
  'pictures',
  'groups',
];
const primNamespace = 'p:'; // Prim Prefix

const app = express();
const port = 8888;

//app.set('view engine', 'ejs');
const eta = new Eta({
  views: path.join(__dirname, "views"),

  cache: true,
  useWith: true,
  autoEscape: false,

});

app.use(express.static(__dirname + '/assets'));
// app.use(compression());
// app.use(cors());

app.get(routePrefix + '/', (req, res) => {
  // Serve index
  const renderedTemplate = eta.render("index", {
    baseHref: baseHref,
    directories: listOfDirectoriesInPath(directories),
  })

  res.status(200).send(renderedTemplate);
});



function listOfDirectoriesInPath(dirs) {
  let html = '';
  dirs.forEach((dir) => {
    html += '<li><a href="'+ vwopSubfolder + '/' + dir + '">' + dir + '</a></li>';

  });
  return html;
}


function listOfFilesInDirectory(dir) {
  try {
    const listObj = fs.readdirSync(serverBasePath + dir);
    let html = '';

    listObj.forEach((file) => {
      if (!file.endsWith('.sh')) {
        html += `<a href="${vwopSubfolder}${(dir + file).replace(/\/+/g, '/')}">${file}</a>`;
        html += ' <button onclick=navigator.clipboard.writeText("' + file + '");>Copy</button>';

        if (dir === '/rwx/' || dir === '/models/' || dir === '/avatars/') {
          html += ' <button onclick=viewModel("' + viewerURL + '?model=' + file + '")>View</button>';
        }

        if (dir === '/textures/') {
          html += ' <button onclick=viewModel("' + viewerURL + '?model=aw-pp01.rwx&action=create+texture+' + file + '")>View</button>';
        }

        html += `<br>`;
      }
    });

    return html;
  } catch (error) {
    console.error(`Error reading directory ${dir}: ${error.message}`)
  }
}


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

function isValidFileName(fileName) {
  const regex = /^[a-zA-Z0-9.,:_-]+$/;
  return regex.test(fileName);
}


directories.forEach((folder, i) => {

  app.get(routePrefix + folder + '/', (req, res) => {
    // Serve File Index
    const renderedTemplate = eta.render('folder', {
      baseHref: baseHref,
      files: listOfFilesInDirectory('/' + folder + '/'),
      folder: folder,
      directories: listOfDirectoriesInPath(directories),
    })
    console.log('User requesting folder: ' + folder);
    res.status(200).send(renderedTemplate);
  });


  const folderPath = `${serverBasePath}${folder}`;
  app.get(routePrefix + folder + '/:file', (req, res) => {
    // Serve RWX Index

    const reqFile = `${req.params.file}`;
    if (!isValidFileName(reqFile)) {
      return res.status(400).send('Invalid filename');
    }
    console.log('=====================================');
    // console.log(`reqFile: ${reqFile}`);

    // const fileToServe = `${path}/${reqFile}`;
    const fileToServe = path.join(folderPath, reqFile);
    // const basePath = __dirname + '/';


    const primPlugin = new PluginPrim("~/git/vwop/");
    const prim = primPlugin.handleRequest(folder, reqFile);
    console.log('help me? ', folder, reqFile)

    if (prim) {
      res.sendFile(baseVWOPPath + prim);
    } else {
      res.sendFile(fileToServe);
    }

    // console.log(`Attempting to serve file: [${fileToServe}]`);
  });
});



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
