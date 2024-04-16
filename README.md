# Virtual World Object Path

An Asset Server for a family of Virtual Worlds.

## Setup

Install dependencies: `npm install`  
Run: `npm start` or `./run.sh`  

You may need to change some configuration variables in app.js  

## Features

- Flat prims
  - ~~Cached~~ Caching currently broken
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

- Pagination, search.
- Zipped prims (only supports unzipped at the moment)
- Single-sided versions of triangle and trifloor
- .5 uvX, uvY default?

## NGINX Setup

```nginx
	location /vwop/ {
		proxy_pass http://localhost:8888/vwop/;
		proxy_set_header Host $host;
		proxy_set_header X-Real-IP $remote_addr;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header X-Forwarded-Proto $scheme;
	}
```
