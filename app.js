import * as fs from 'fs';
import express from 'express';
import * as ejs from 'ejs'; // eslint-disable-line no-unused-vars
import compression from 'compression';
import cors from 'cors';

import * as fflate from 'fflate';
import path from 'path';
import {fileURLToPath} from 'url';

import PluginPrim from './prims.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 8888;

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/assets'));
app.use(compression());
app.use(cors());

const primNamespace = 'p:';

const directories = [
  'rwx',
  'models',
  'avatars',
  'textures',
  'seqs',
  'sounds',
  'pictures',
  'groups',
];

const viewerURL = 'https://nekohime.net/rw/';

app.get('/', (req, res) => {
  // Serve index

  res.render('index', {
    directories: listOfDirectoriesInPath(directories),
  });
});

function listOfDirectoriesInPath(dirs) {
  let html = '';
  dirs.forEach((file) => {
    html += '<li><a href='+ file +'>' + file + '</a></li>';
  });
  return html;
}

function listOfFilesInDirectory(dir) {
  const listObj = fs.readdirSync('./paths/' + dir);
  let html = '';
  listObj.forEach((file) => {
    if (!file.endsWith('.sh')) {
      html += `<a href=${dir.replace(/^\/+/, '')}${file}>${file}</a>`;
      html += ' <button onclick=navigator.clipboard.writeText("' + file + '");>Copy</button>';
      if (dir === '/rwx/' || dir === '/models/' || dir === 'avatars') {
        html += ' <button onclick=viewModel("' + viewerURL + '?model=' + file + '")>View</button>';
      }
      if (dir === '/textures/') {
        // TODO: Change preview object to prim
        html += ' <button onclick=viewModel("' + viewerURL + '?model=aw-pp01.rwx&action=create+texture+' + file + '")>View</button>';
      }

      html += `<br>`;
    }
  });
  return html;
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

// WIP: Handle prim creation
function getPrimRWX(reqFile) {
  if (reqFile.startsWith('p:')) { // Is Flat A Prim
    console.log('We need to implement prims, still.');
    // res.send(handleRequestedPrimRWX(reqFile))
    // res.sendFile(`${path}/unknown.rwx`);
    // Check if prim file is present in 'rwx'
  } else {
    console.log(`Attempting to serve RWX: ${fileToServe}`);
    res.sendFile(fileToServe);
  }
}

directories.forEach((folder, i) => {
  app.get('/' + folder + '/', (req, res) => {
    // Serve File Index
    res.render('folder', {
      files: listOfFilesInDirectory('/' + folder + '/'),
      folder: folder,
      directories: listOfDirectoriesInPath(directories),
    });
    console.log('User requesting folder: ' + folder);
  });

  const path = `/var/www/html/3d/path3d/${folder}`;
  app.get('/' + folder + '/:file', (req, res) => {
    // Serve RWX Index
    const reqFile = `${req.params.file}`;
    console.log('=====================================');
    console.log(`reqFile: ${reqFile}`);

    const fileToServe = `${path}/${reqFile}`;
    const basePath = __dirname + '/';

    const primPlugin = new PluginPrim();
    const prim = primPlugin.handleRequest(folder, reqFile);

    if (prim) {
      res.sendFile(basePath + prim);
    } else {
      res.sendFile(fileToServe);
    }

    // console.log(`Attempting to serve file: [${fileToServe}]`);
  });
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
