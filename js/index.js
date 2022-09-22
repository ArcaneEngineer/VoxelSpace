//"use strict";

import Map from './Map.js';
import Io from './Io.js';
import Time from './Time.js';
import Render from './Render.js';
import Camera from './Camera.js';

// ---------------------------------------------
// Viewer information

var time = undefined; //new Date().getTime();
var fpsTime = undefined; //new Date().getTime();
var map = undefined;
var io = undefined;
var render = undefined;
var camera = undefined;

function Init()
{
    time = new Time();
    fpsTime = new Time();
    map = new Map(); map.Load("C1W;D1");
    camera = new Camera();
    io = new Io(camera, time, "firstperson");
    render = new Render(camera, map, io, time, fpsTime, "firstperson");
    window.onresize = e => render.OnResizeWindow(e); render.OnResizeWindow(); //kicks off rendering.
}

Init();