//"use strict";

import Map from './Map.js';
import Io from './Io.js';
import Time from './Time.js';
import GameCore from './GameCore.js';
import GameView from './GameView.js';
//import RaycasterView from './RaycasterView.js';
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
var raycasterWorker = undefined;

function RockAndRoll()
{
    camera = new Camera();
    gameCore = new GameCore(camera, map);
    io = new Io(gameCore, time, "firstperson"); //TODO camera should not be in here, declare in Raycaster
    //raycasterView = new RaycasterView(fpsTime);//"firstperson");
    mapView = new MapView(map);
    gameView = new GameView(gameCore, raycasterWorker, mapView, time, io);
    window.onresize = e => gameView.OnResizeWindow(e); gameView.OnResizeWindow(); //kicks off rendering.
}

function StartRenderThread()
{
    raycasterWorker = new Worker('./js/RaycasterWorker.js');
        
    raycasterWorker.postMessage({typey: "start"});
    
    return new Promise(function(resolve)//, reject)
    {
        raycasterWorker.onmessage = (e) => {
          //result.textContent = e.data;
          if (e.data.typey == "started")
          {
            console.log("raycaster worker thread started");
            resolve();
          }
        }
    });
        

}

function Init()
{
    time = new Time();
    fpsTime = new Time();
    
    map = new Map(); map.Load("C1W;D1").then(result => map.OnLoadedImages(result))
                                       .then(StartRenderThread)
                                       .then(RockAndRoll);
}



Init();