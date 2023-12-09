import * as fs from 'fs';
import express from 'express';
// import * as ejs from 'ejs'; // eslint-disable-line no-unused-vars
import compression from 'compression';
import cors from 'cors';
import path from 'path';
import {fileURLToPath} from 'url';
import PluginPrim from './prims.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// URL to Model Viewer (not included)
const viewerURL = 'https://nekohime.net/rw/';
const baseVWOPPath = path.join(__dirname, '/'); // ~/git/vwop/
// Where OP folders are. They are defined in directories[] below
const serverBasePath = '/var/www/html/3d/path3d/';
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

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/assets'));
app.use(compression());
app.use(cors());

app.get('/', (req, res) => {
  // Serve index

  res.render('index', {
    directories: listOfDirectoriesInPath(directories),
  });
});

function listOfDirectoriesInPath(dirs) {
  let html = '';
  dirs.forEach((dir) => {
    html += '<li><a href="/' + dir + '">' + dir + '</a></li>';
  });
  return html;
}


function listOfFilesInDirectory(dir) {
  try {
    const listObj = fs.readdirSync(serverBasePath + dir);
    let html = '';

    listObj.forEach((file) => {
      if (!file.endsWith('.sh')) {
        html += `<a href="${(dir + file).replace(/\/+/g, '/')}">${file}</a>`;
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
  app.get('/' + folder + '/', (req, res) => {
    // Serve File Index
    res.render('folder', {
      files: listOfFilesInDirectory('/' + folder + '/'),
      folder: folder,
      directories: listOfDirectoriesInPath(directories),
    });
    console.log('User requesting folder: ' + folder);
  });



  const folderPath = `${serverBasePath}${folder}`;
  app.get('/' + folder + '/:file', (req, res) => {
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


    const primPlugin = new PluginPrim();
    const prim = primPlugin.handleRequest(folder, reqFile);

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
