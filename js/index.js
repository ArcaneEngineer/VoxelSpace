//"use strict";

import Map from './Map.js';
import Io from './Io.js';
import Time from './Time.js';
import RootView from './RootView.js';
import RaycasterView from './RaycasterView.js';
import MapView from './MapView.js';
import Camera from './Camera.js';

// ---------------------------------------------
// Viewer information

var time = undefined; //new Date().getTime();
var fpsTime = undefined; //new Date().getTime();
var map = undefined;
var io = undefined;
var rootView = undefined;
var raycasterView = undefined;
var mapView = undefined;
var camera = undefined;

function Init()
{
    time = new Time();
    fpsTime = new Time();
    map = new Map(); map.Load("C1W;D1");
    camera = new Camera();
    io = new Io(map, camera, time, "firstperson"); //TODO camera should not be in here, declare in Raycaster
    raycasterView = new RaycasterView(camera, map, io, time, fpsTime, "firstperson");
    mapView = new MapView(map);
    rootView = new RootView(null, raycasterView, mapView);
    window.onresize = e => rootView.OnResizeWindow(e); rootView.OnResizeWindow(); //kicks off rendering.
}

Init();