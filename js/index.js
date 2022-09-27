//"use strict";

import Map from './Map.js';
import Io from './Io.js';
import Time from './Time.js';
import RaycasterView from './RaycasterView.js';
//import TopView from './TopView.js';
import Camera from './Camera.js';

// ---------------------------------------------
// Viewer information

var time = undefined; //new Date().getTime();
var fpsTime = undefined; //new Date().getTime();
var map = undefined;
var io = undefined;
var raycaster = undefined;
var camera = undefined;

function Init()
{
    time = new Time();
    fpsTime = new Time();
    map = new Map(); map.Load("C1W;D1");
    camera = new Camera();
    io = new Io(camera, time, "firstperson");
    raycaster = new RaycasterView(camera, map, io, time, fpsTime, "firstperson");
    window.onresize = e => raycaster.OnResizeWindow(e); raycaster.OnResizeWindow(); //kicks off rendering.
}

Init();