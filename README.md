# Virtual World Object Path

An Asset Server for a certain of Virtual Worlds.

## Setup

`npm install`

You need to symlink your object path folders inside ./paths/ (stuff like rwx, models, avatars, sounds, seqs, etc.)

To run, `npm start`

## Features

- Flat prims
  - Cached
- Model Viewer in <iframe> in <dialog> (view button)
- Copy button to copy filename to clipboard

## Prims

Prims are models that are generated on the fly (and then cached for later re-use) with custom dimensions.
Users can specify dimensions, and a few other parameters on the fly and instantly see the result.

Syntax: p:wall0000p,s/p/###,xxxx,yyyy

- 0000 is size in millimeters.
  - giving it a value of 400 will make a 400x400 wall
  - You can give a y value by preceding the y value with a x (400x800)
- the p is for 'phantom', or making the object non-solid.
- s/p/### is tag type (s for sign, p for picture)
  - giving it any other value will default to picture, even empty.
- aaaa is custom UV scale on X axis
  - if decimal, model name must end in .rwx (in WideWorlds)
- bbbb is custom UV scale on Y axis
  - if decimal, model name must end in .rwx (in WideWorlds)
  - if left empty, the Y value will use the X value
- tag type is required to set a custom UV scale.
  - can be left empty or given an invalid value
- UV scale can make the texture squished in either axis, or zoomed in or zoomed out. :)
  - Basically, the higher the number, the more the texture will tile across the object

Examples:

p:wall400.rwx  
p:wall400x800.rwx  
p:flr400,,.1.rwx

### Available Prims

- wall (w, wll) - Double-sided wall
- panel (p, pan) - Single-sided wall
- floor (f, flr) - Double-sided floor
- flat (flt) - Single-sided floor
- facer (fac) - 2D Sprite
- Triangle (tri) - Double-sided triangle wall
- Trifloor (triflr) - Double-sided triangle floor

## Roadmap

- Supporting both zipped (/models/) and unzipped (/rwx/, for WideWorlds) modes. At least until WideWorlds loads zipped models.
- Pagination, search.
- Zipped prims (only supports unzipped at the moment)
- It assumes one folder structure and one model viewer url at the moment.
  - TODO: Fix this and have at least variables at the top of the main file to change these.
- Single-sided versions of triangle and trifloor
