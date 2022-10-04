//importScripts('Time.js')
importScripts('RaycasterView.js')
//importScripts('Camera.js')

//var a = {test: 'boo'};

//const fpsTime = new Time();
let raycaster = undefined;
var animating = false;
var updateCount = 0;
onmessage = (evt) =>
{   
    let typey = evt.data.typey;
    let camera = evt.data.camera;
    let map = evt.data.map;
    
    // if (updateCount < 1)
    // {
        // console.log(updateCount);
        // console.log(map);
    // }
    switch (typey)
    {
        case "start":
            raycaster = new RaycasterView(null);//fpsTime);
            postMessage({typey: "started"});
        break;
        case "update":
            //this *is* the update; requestAnimationFrame will take it from here,
            //updating at the right time *according* to this current dataset.
            if (map != null)
            {
                raycaster.map = map;
            
            
            }
            raycaster.camera = camera;
            
            if (!animating) //prevent multiple requestAnimationFrame schedulings!
            {
                raycaster.update(); //kick off
                
                animating = true; 
            }
        break;
        case "resize":
            
            
            raycaster.OnResizeWindow(evt.data.canvas, camera.screenwidth, camera.screenheight);
        break;
    }
    updateCount++;
    
};