const fs = require('fs');
const express = require('express');

require('ejs');

const app = express();
const port = 8888;

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/assets'));


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


app.get('/', (req, res) => {
  // Serve index
  // res.send('Here be indexing dragons')

  res.render('index', {
    directories: listOfDirectoriesInPath(directories),
  });
});

// app.use('/rwx', serveIndex(__dirname + '/paths/rwx'));
// app.use('/rwx', express.static(__dirname + '/paths/rwx/'))

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
  const list = listObj.forEach((file) => {
    if (!file.endsWith('.sh')) {
      html += '<a href=' + dir + file + '>' + file + '</a><br>';
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
  'image/webp': ['webp']

});

// WIP: Handle prim creation
function getPrimRWX(reqFile) {

  if (reqFile.startsWith('p:')) { // Is Flat A Prim
    console.log('We need to implement prims, still.');
    // res.send(handleRequestedPrimRWX(reqFile))
    //res.sendFile(`${path}/unknown.rwx`);
    // Check if prim file is present in 'rwx'

  } else if (reqFile.startsWith('p3:')) { // Is 3D Prim
    console.log("User requested 3D Prim... Cannot fulfill.")
    return `${path}/unknown.rwx`;
  }
  else {
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
    console.log('User requesting folder: ' + folder)
  });

  const path = `/var/www/html/3d/path3d/${folder}`;
  app.get('/' + folder + '/:file', (req, res) => {
    // Serve RWX Index
    const reqFile = `${req.params.file}`;
    console.log(`reqFile: ${reqFile}`);

    const fileToServe = `${path}/${reqFile}`;
    console.log(`fileToServe: ${fileToServe}`);


    /*
    if (folder === 'rwx' && reqFile.startsWith('p:') {
      res.sendFile(getPrimRWX(reqFile));
      return;
    }
    if (folder === 'models') && (reqFile.startsWith('p:'))
        res.sendFile(zipThis(getPrimRWX(reqFile)));
    } */
    console.log(`Attempting to serve file: [${fileToServe}]`);
    res.sendFile(fileToServe);
  });
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
