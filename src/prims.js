import * as fs from 'fs';
import * as path from 'path';

// eslint-disable-next-line
const regexPrim = /^(p:)?(?<filename>(?<name>(?<type>[a-z]+)(?<params>.+?))\.rwx)$/i;
// eslint-disable-next-line
const regexFlatParams = /^(?<x>[0-9]+\.?[0-9]*)(x(?<y>[0-9]+\.?[0-9]*))?(?<p>p)?$/i;

/**
 * Represents a PluginPrim class for handling primitive requests.
 */
export default class PluginPrim {
/**
 * Creates an instance of PluginPrim.
 * @param {string} baseVWOPPath - The base VWOP path.
 */
  constructor(baseVWOPPath) {
    this.baseVWOPPath = baseVWOPPath;
    this.cache = 'prims';
    this.templates = 'src/assets/prims/templates';

    this.mmx = 1000.0;
    this.mmy = 1000.0;
    this.mmuv = 100.0;
    this.minValue = 0.001;
    this.maxValue = 32.0;
    this.flatWall = 'wall';
    this.flatPanel = 'panel';
    this.flatFloor = 'floor';
    this.flatFlat = 'flat';
    this.flatFacer = 'facer';
    this.flatTriangle = 'triangle';
    this.flatTrifloor = 'trifloor';
  }

  /**
   * Handles a request for a Prim.
   * @param {string} dir - The directory.
   * @param {string} file - The file.
   * @return {string|boolean} - The path or false.
   */
  handleRequest(dir, file) {
    // Only handle rwx request
    if (dir !== 'rwx') {
      return false;
    }

    // Validate requests
    const matches = file.match(regexPrim);
    if (!matches) {
      return false;
    } else {
      console.log('Prims',
          `Handling request for ${file} (${matches.groups.filename})`);
    }

    file = 'p:' + matches.groups.filename;
    // const filePath = path.join(this.cache, file);
    const primFilePath = path.join(this.baseVWOPPath, this.cache, file);
    // First, check for local file...


    const type = matches.groups.type;
    const params = matches.groups.params.split(',');

    let primContent;

    switch (type) {
      case 'w':
      case 'wll':
      case 'wall':
        primContent = this.makeFlat(params, this.flatWall);
        break;

      case 'p':
      case 'pan':
      case 'panel':
        primContent = this.makeFlat(params, this.flatPanel);
        break;

      case 'f':
      case 'flr':
      case 'floor':
        primContent = this.makeFlat(params, this.flatFloor);
        break;

      case 'flt':
      case 'flat':
        primContent = this.makeFlat(params, this.flatFlat);
        break;

      case 'fac':
      case 'facer':
        primContent = this.makeFlat(params, this.flatFacer);
        break;

      case 'tri':
      case 'triangle':
        primContent = this.makeFlat(params, this.flatTriangle);
        break;

      case 'triflr':
      case 'trifloor':
        primContent = this.makeFlat(params, this.flatTrifloor);
        break;

        // Add more cases as needed...

      default:
        return false;
    }

    if (!primContent) {
      this.gotoError(400, 'Unknown prim generator error');
    }

    if (!fs.existsSync(this.cache)) {
      fs.mkdirSync(this.cache);
    }

    if (!fs.existsSync(primFilePath)) {
      fs.writeFileSync(primFilePath, primContent);
    }

    return path.join(this.cache, file);
  }

  /**
   * Generates a flat primitive.
   * @param {string[]} values - The values.
   * @param {string} type - The type.
   * @return {string} - The primitive.
   */
  makeFlat(values, type) {
    const dim = regexFlatParams.exec(values[0]);

    if (!dim) {
      this.gotoError(400, 'Invalid prim syntax');
    }

    // Dimension checking (reads values as mm)
    const rawX = parseFloat(dim.groups.x);
    const rawY = (dim.groups.y && !isNaN(dim.groups.y)) ?
      parseFloat(dim.groups.y) : parseFloat(dim.groups.x);
    console.log('Flat prim', `Raw X ${rawX} by Raw Y ${rawY}`);

    const dimXFactor = 2;
    const dimYFactor = (type === this.flatFlat || type === this.flatFloor ||
      type === this.flatTrifloor) ? 2 : 1;

    const dimX = rawX / (this.mmx * dimXFactor);
    const dimY = rawY / (this.mmy * dimYFactor);
    console.log('Flat prim', `X ${dimX} by Y ${dimY}`);

    if (dimX < this.minValue || dimY < this.minValue) {
      this.gotoError(400, 'Flat primitive is too small');
    }

    if (dimX > this.maxValue || dimY > this.maxValue) {
      this.gotoError(400, 'Flat primitive is too large');
    }

    // Phantom parameter
    const phantom = (dim.groups.p && !isNaN(dim.groups.p)) ? 'off' : 'on';

    // Tags
    let tag = 200;
    if (values[1] && values[1] === 's') {
      tag = 100;
    }
    // UV coordinates
    const uvX = (typeof values[2] !== 'undefined') ? values[2] : false;
    const uvY = (typeof values[3] !== 'undefined') ? values[3] : false;

    const uv = (type === this.flatFlat || type === this.flatPanel ||
      type === this.flatFacer) ?
      this.uvFill(uvX, uvY) :
      this.uvPlanar(uvX, uvY, rawX, rawY);

    // Generate using template
    console.log('Flat', `Type: ${type}`);
    console.log('Flat', `Dimensions: (${dimX} by ${dimY})`);
    console.log(`Tag: ${tag}, uvX scale: ${uv[0]}, uvY scale: ${uv[1]}`);
    console.log(`Collision: ${phantom}`);
    const template = this.getPrimTemplate(type);
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

  /**
   * Gets the prim template.
   * @param {string} template - The template.
   * @return {string} - The template content.
   */
  getPrimTemplate(template) {
    const templatePath = path.join(this.templates, `${template}.txt`);
    return fs.readFileSync(templatePath, 'utf-8');
  }


  /**
   * Fills UV coordinates.
   * @param {string|number} x - The x coordinate.
   * @param {string|number} y - The y coordinate.
   * @return {number[]} - The UV coordinates.
   */
  uvFill(x, y) {
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

  /**
   * Calculates UV coordinates for planar surfaces.
   * @param {string|number} x - The x coordinate.
   * @param {string|number} y - The y coordinate.
   * @param {number} rawX - The raw x value.
   * @param {number} rawY - The raw y value.
   * @return {number[]} - The UV coordinates.
   */
  uvPlanar(x, y, rawX, rawY) {
    let uvX = null;
    let uvY = null;
    if (!x) {
      uvX = rawX / (this.mmuv / 1);
      uvY = rawY / (this.mmuv / 1);
    } else if (!isNaN(x) && !y) {
      uvX = rawX / (this.mmuv / parseFloat(x));
      uvY = rawY / (this.mmuv / parseFloat(x));
    } else if (!isNaN(x) && !isNaN(y)) {
      uvX = rawX / (this.mmuv / parseFloat(x));
      uvY = rawY / (this.mmuv / parseFloat(y));
    } else {
      throw new Error('Invalid UV parameters');
    }
    return [uvX, uvY];
  }


  /**
   * Parses tag value.
   * TODO: Handle 100/200 (e.g. p:w400,200.rwx)?
   * @param {string|number} val - The value to parse.
   * @return {number} - The Tag number for given tag type
   */
  parseTagNumber(val) {
    switch (val) {
      case 'p':
        return 200;
      case 's':
        return 100;
      default:
        if (!isNaN(val)) {
          return parseInt(val, 10);
        } else {
          this.gotoError(400, 'Invalid tag parameter');
        }
    }
  }
  /**
   * Logs an error message and handles error logic.
   * @param {number} code - The error code.
   * @param {string} message - The error message.
   */
  gotoError(code, message) {
    // Implement logging to file.
    console.error(`Error ${code}: ${message}`);
  }
}
