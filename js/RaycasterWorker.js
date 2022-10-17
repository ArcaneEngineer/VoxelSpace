//importScripts('Time.js')
importScripts('CanvasView.js')
importScripts('RaycasterView.js')
importScripts('MapView.js')
//importScripts('Camera.js')

//var a = {test: 'boo'};

//const fpsTime = new Time();
let mapView = undefined; //new MapView(map);
let raycaster = undefined;
var animating = false;
var updateCount = 0;
onmessage = (evt) =>
{   
    let typey = evt.data.typey;
    let camera = evt.data.camera;
    let mapIn = evt.data.map;
    let renderNovalogic = evt.data.renderNovalogic;
    
    
    // if (updateCount < 1)
    // {
        // console.log(updateCount);
        // console.log(map);
    // }
    switch (typey)
    {
        case "start":
            mapView = new MapView()//map);
            raycaster = new RaycasterView(null);//fpsTime);
            raycaster.mapView = mapView;
            postMessage({typey: "started"});
        break;
        case "update":
            //this *is* the update; requestAnimationFrame will take it from here,
            //updating at the right time *according* to this current dataset.
            if (mapIn != null)
            {
                raycaster.map = mapIn;
                mapView.core = mapIn;
            }
            
            raycaster.camera = camera;
            raycaster.renderNovalogic = renderNovalogic;
            
            if (!animating) //prevent multiple requestAnimationFrame schedulings!
            {
                raycaster.update(); //kick off
                
                animating = true; 
            }
        break;
        case "resize":
            
            
            raycaster.OnResizeWindow(evt.data.raycasteroffscreencanvas, evt.data.mapoffscreencanvas, evt.data.samplesoffscreencanvas, camera.screenwidth, camera.screenheight, mapIn);
        break;
    }
    updateCount++;
    
};