import * as fs from 'fs';
import * as path from 'path';

export default class PluginPrim {
  static RegexPrim = /^(p:)?(?<filename>(?<name>(?<type>[a-z]+)(?<params>.+?))\.rwx)$/i;
  static RegexFlatParams = /^(?<x>[0-9]+\.?[0-9]*)(x(?<y>[0-9]+\.?[0-9]*))?(?<p>p)?$/i;
  static Cache = '';
  static Templates = 'src/assets/prims/templates';
  static MMX = 1000.0;
  static MMY = 1000.0;
  static MMUV = 100.0;
  static MinValue = 0.001;
  static MaxValue = 32.0;
  static FlatWall = 'wall';
  static FlatPanel = 'panel';
  static FlatFloor = 'floor';
  static FlatFlat = 'flat';
  static FlatFacer = 'facer';
  static FlatTriangle = 'triangle';
  static FlatTrifloor = 'trifloor';
  static baseVWOPPath = '';

  constructor(baseVWOPPath) {
    // Initialize your class as needed
    PluginPrim.baseVWOPPath = baseVWOPPath;
    PluginPrim.Cache = 'prims';
  }

  getName() {
    return 'Prim generator';
  }

  handleRequest(dir, file) {
    console.log('Prims', `Checking if I handle ${dir}/${file}`);

    // Only handle rwx request
    if (dir !== 'rwx') {
      return false;
    }

    // Validate requests
    const matches = file.match(PluginPrim.RegexPrim);
    if (!matches) {
      return false;
    } else {
      console.log('Prims', `Handling request for ${file} (${matches.groups.filename})`);
    }

    file = 'p:' + matches.groups.filename;
    const path = PluginPrim.pathJoin([PluginPrim.Cache, file]);
    console.log(' ????????????? ' + path + ' ????????????? ' );
    // First, check for local file...
    if (fs.existsSync(path)) {
      PluginPrim.gotoFile(PluginPrim.Cache, file);
    }

    const type = matches.groups.type;
    const params = matches.groups.params.split(',');
    // console.log('Prim', `Trying to generate a ${type} with ${matches.groups.params}`);

    let primContent;

    switch (type) {
      case 'w':
      case 'wll':
      case 'wall':
        primContent = PluginPrim.makeFlat(params, PluginPrim.FlatWall);
        break;

      case 'p':
      case 'pan':
      case 'panel':
        primContent = PluginPrim.makeFlat(params, PluginPrim.FlatPanel);
        break;

      case 'f':
      case 'flr':
      case 'floor':
        primContent = PluginPrim.makeFlat(params, PluginPrim.FlatFloor);
        break;

      case 'flt':
      case 'flat':
        primContent = PluginPrim.makeFlat(params, PluginPrim.FlatFlat);
        break;

      case 'fac':
      case 'facer':
        primContent = PluginPrim.makeFlat(params, PluginPrim.FlatFacer);
        break;

      case 'tri':
      case 'triangle':
        primContent = PluginPrim.makeFlat(params, PluginPrim.FlatTriangle);
        break;

      case 'triflr':
      case 'trifloor':
        primContent = PluginPrim.makeFlat(params, PluginPrim.FlatTrifloor);
        break;

        // Add more cases as needed...

      default:
        return false;
    }


    if (!primContent) {
      PluginPrim.gotoError(400, 'Unknown prim generator error');
    }

    console.log('Prim', `Saving prim '${file}'`);

    if (!fs.existsSync(PluginPrim.Cache)) {
      fs.mkdirSync(PluginPrim.Cache);
    }

    fs.writeFileSync(path, primContent);
    PluginPrim.gotoFile(PluginPrim.Cache, file);

    return PluginPrim.pathJoin([PluginPrim.Cache, file]);
  }

  static makeFlat(values, type) {
    const dim = PluginPrim.RegexFlatParams.exec(values[0]);

    if (!dim) {
      PluginPrim.gotoError(400, 'Invalid prim syntax');
    }

    // Dimension checking (reads values as mm)
    const rawX = parseFloat(dim.groups.x);
    const rawY = (dim.groups.y && !isNaN(dim.groups.y)) ? parseFloat(dim.groups.y) : parseFloat(dim.groups.x);
    console.log('Flat prim', `Raw X ${rawX} by Raw Y ${rawY}`);

    const dimXFactor = 2;
    const dimYFactor = (type === PluginPrim.FlatFlat || type === PluginPrim.FlatFloor || type === PluginPrim.FlatTrifloor) ? 2 : 1;

    const dimX = rawX / (PluginPrim.MMX * dimXFactor);
    const dimY = rawY / (PluginPrim.MMY * dimYFactor);
    console.log('Flat prim', `X ${dimX} by Y ${dimY}`);

    if (dimX < PluginPrim.MinValue || dimY < PluginPrim.MinValue) {
      PluginPrim.gotoError(400, 'Flat primitive is too small');
    }

    if (dimX > PluginPrim.MaxValue || dimY > PluginPrim.MaxValue) {
      PluginPrim.gotoError(400, 'Flat primitive is too large');
    }

    // Phantom parameter
    const phantom = (dim.groups.p && !isNaN(dim.groups.p)) ? 'off' : 'on';

    // Tags
    // const tag = (values[1] && !isNaN(values[1])) ? PluginPrim.parseTagNumber(values[1]) : 200;
    let tag = 200;
    if (values[1] && values[1] === 's') {
      tag = 100;
    }
    console.log(values);
    // UV coordinates
    // const uvX = values[2] || false;
    // const uvY = values[3] || false;
    const uvX = (typeof values[2] !== 'undefined') ? values[2] : false;
    const uvY = (typeof values[3] !== 'undefined') ? values[3] : false;

    const uv = (type === PluginPrim.FlatFlat || type === PluginPrim.FlatPanel || type === PluginPrim.FlatFacer) ?
      PluginPrim.uvFill(uvX, uvY) :
      PluginPrim.uvPlanar(uvX, uvY, rawX, rawY);

    // Generate using template
    console.log('Flat', `Type: ${type}`);
    console.log('Flat', `Dimensions: ${dimX} by ${dimY}, tag: ${tag}, uvX scale: ${uv[0]}, uvY scale: ${uv[1]}, collision: ${phantom}`);
    const template = PluginPrim.getPrimTemplate(type);
    const prim = template
        .replace(/%1\$.4f/g, dimX)
        .replace(/%2\$.4f/g, dimY)
        .replace(/%3\$u/g, tag)
        .replace(/%4\$.4f/g, uv[0])
        .replace(/%5\$.4f/g, uv[1])
        .replace(/%6\$s/g, phantom);

    console.log('Flat', `Generated: ${prim}`);
    return prim;
  }

  static getPrimTemplate(template) {
    const path = PluginPrim.pathJoin([PluginPrim.Templates, `${template}.txt`]);
    return fs.readFileSync(path, 'utf-8');
  }
  static uvFill(x, y) {
    if (!x) {
      return [1, 1];
    } else if (!isNaN(x) && !y) {
      return [parseFloat(x), parseFloat(x)];
    } else if (!isNaN(x) && !isNaN(y)) {
      return [parseFloat(x), parseFloat(y)];
    } else {
      // PluginPrim.gotoError(400, 'Invalid UV parameters');
      throw new Error('Invalid UV parameters');
    }
  }

  static uvPlanar(x, y, rawX, rawY) {
    let uvX = null;
    let uvY = null;
    if (!x) {
      uvX = rawX / (PluginPrim.MMUV / 1);
      uvY = rawY / (PluginPrim.MMUV / 1);
    } else if (!isNaN(x) && !y) {
      uvX = rawX / (PluginPrim.MMUV / parseFloat(x));
      uvY = rawY / (PluginPrim.MMUV / parseFloat(x));
    } else if (!isNaN(x) && !isNaN(y)) {
      uvX = rawX / (PluginPrim.MMUV / parseFloat(x));
      uvY = rawY / (PluginPrim.MMUV / parseFloat(y));
    } else {
      throw new Error('Invalid UV parameters');
    }
    return [uvX, uvY];
  }

  static parseTagNumber(val) {
    switch (val) {
      case 'p':
        return 200;
      case 's':
        return 100;
      default:
        if (!isNaN(val)) {
          return parseInt(val, 10);
        } else {
          PluginPrim.gotoError(400, 'Invalid tag parameter');
        }
    }
  }

  static pathJoin(parts) {
    return path.join(...parts);
  }

  static gotoFile(cache, file) {
    // Implement gotoFile logic
    // For now, I'll log a message to the console
    console.log(`Goto file: ${path.join(cache, file)}`);
  }
  static gotoError(code, message) {
  // Implement gotoError logic
  // For now, I'll log an error message to the console
    console.error(`Error ${code}: ${message}`);
  }
}
