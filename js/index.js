//"use strict";

import Map from './Map.js';
import Io from './Io.js';
import Time from './Time.js';
import GameCore from './GameCore.js';
import GameView from './GameView.js';
import RaycasterView from './RaycasterView.js';
import MapView from './MapView.js';
import Camera from './Camera.js';

// ---------------------------------------------
// Viewer information

var time = undefined; //new Date().getTime();
var fpsTime = undefined; //new Date().getTime();
var map = undefined;
var io = undefined;
var gameView = undefined;
var raycasterView = undefined;
var mapView = undefined;
var camera = undefined;
var gameCore = undefined;

function Init()
{
    time = new Time();
    //fpsTime 
    
    
    map = new Map(); map.Load("C1W;D1");
    camera = new Camera();
    gameCore = new GameCore(camera, map);
    io = new Io(gameCore, time, "firstperson"); //TODO camera should not be in here, declare in Raycaster
    raycasterView = new RaycasterView();//"firstperson");
    mapView = new MapView(map);
    gameView = new GameView(gameCore, raycasterView, mapView, time, io);
    window.onresize = e => gameView.OnResizeWindow(e); gameView.OnResizeWindow(); //kicks off rendering.
}

Init();