const fs = require('fs');
const express = require('express')

const ejs = require('ejs');

const app = express()
const port = 8888

app.set('view engine', 'ejs');

app.use(express.static(__dirname + '/public'));


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
    directories: directoriesList()
  });

});

//app.use('/rwx', serveIndex(__dirname + '/paths/rwx'));
//app.use('/rwx', express.static(__dirname + '/paths/rwx/'))

function directoriesList() {
  const listObj = fs.readdirSync('./paths/');
  let html = '';
  const list = listObj.forEach(file => {
      html += '<li><a href='+ file +'>'+ file +'</a></li>'
  });
  return html;
}

function listDir(dir) {
  const listObj = fs.readdirSync('./paths/' + dir);
  let html = '';
  const list = listObj.forEach(file => {
    if (!file.endsWith('.sh')) {
      html += '<a href=' + dir + file + '>' + file + '</a><br>'
    }
  });
  return html;
}

express.static.mime.define({
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
function handleRequestedPrimRWX(file) {
  if (file.endsWith('.rwx')) {
    //file.startsWith('p:')
    return "Hi";
  } else {
    return "Incorrect file format";
  }
}

directories.forEach((folder, i) => {
  app.get('/' + folder + '/', (req, res) => {
    // Serve File Index
    res.render('folder', {
      files: listDir('/' + folder + '/'),
      folder: folder,
      directories: directoriesList()
    });
    console.log("Client looking up index");
  });

  const path = `/var/www/html/3d/path3d/${folder}`;
  app.get('/' + folder + '/:file', (req, res) => {
    // Serve RWX Index
    const reqFile = `${req.params.file}`;
    const fileToServe = `${path}/${reqFile}`;
    const folderExists = fs.existsSync(`${path}`);

    if (folder == 'rwx') {
      if (reqFile.startsWith('p:')) {
        console.log("We need to implement prims, still.");
        //res.send(handleRequestedPrimRWX(reqFile))
        res.sendFile(`${path}/unknown.rwx`)
      }
    } else {
      console.log(`Attempting to serve: ${fileToServe}`)
      res.sendFile(fileToServe);
    }


/*
if (folderExists) {
  console.log(`Attempting to serve: ${fileToServe}`)
  res.sendFile(fileToServe);
} else {
  console.log(`Failure to serve: ${fileToServe}`)
  res.sendStatus(404);
}
*/
  });

});





app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});
