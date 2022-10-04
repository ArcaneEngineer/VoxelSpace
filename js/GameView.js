import MapView from './MapView.js'
//import RaycasterView from './RaycasterView.js'

export default class GameView
{
    core = undefined //remove if extends another view class!
    
    //sub-views
    map  = undefined
    
    raycasterWorker = undefined
    
    time = undefined
    io = undefined
    
    constructor(core, raycasterWorker, map, time, io)
    {
        this.core = core;
        
        //sub-views
        this.raycasterWorker = raycasterWorker
        this.map = map
        this.time = time
        this.io = io
    }
    
    started = 0
    
    update()//timeSec, deltaSec)
    {
        let core = this.core;
        let camera = core.camera;
        let map = core.map;
        
        this.time.updateDelta();
        this.io.UpdateCamera();
        
        //TODO process subviews as list?
        this.map.update();
        
        //this.raycaster.update();
        //TODO remove "started" in favour of "updated" when we have our generated map data model.
        this.raycasterWorker.postMessage({typey: "update", camera: camera, map: this.started ? null : map, renderNovalogic: core.renderNovalogic});
        this.started++;
        
        //window.requestAnimationFrame(e => this.update(e), 0);
        window.requestAnimationFrame(this.update.bind(this), 0);
    }
    
    OnResizeWindow(e)
    {
        console.log("GameView.OnResizeWindow (kick off rendering)");
        //this.renderer.setSize(window.innerWidth, window.innerHeight);
        //this.camera.perspective({aspect: this.gl.canvas.width / this.gl.canvas.height});
        
        let core = this.core;
        let camera = core.camera;
        camera.screenwidth = window.innerWidth;
        camera.screenheight = window.innerHeight;
        let map = core.map;
        
        //TODO make it possible to resize once again...
        //"So it turns out that the only solution to this was cloning the canvas, replacing it in the DOM with its own clone, and then using transferControlToOffscreen on the clone"
        //from https://stackoverflow.com/questions/46546066/reattach-the-canvas-context-after-using-transfercontroltooffscreen
        const canvas = document.getElementById("firstperson");
        canvas.width = window.innerWidth//window.innerWidth;
        canvas.height = window.innerHeight//canvas.width / aspect;
        canvas.style.width  = window.innerWidth  + "px";
        canvas.style.height = window.innerHeight + "px";
        
        const offscreenCanvas = canvas.transferControlToOffscreen();
        //offscreenCanvas.width = window.innerWidth//window.innerWidth;
        //offscreenCanvas.height = window.innerHeight//canvas.width / aspect;
        
        //TODO postMessage to do this!
        this.raycasterWorker.postMessage({typey: "resize", camera: camera, map: map, renderNovalogic: core.renderNovalogic, canvas: offscreenCanvas}, [offscreenCanvas]);
        //this.raycaster.OnResizeWindow(offscreenCanvas, core.screenwidth, core.screenheight);
        
        this.update(); //gets the update loop rolling.
    }
    /*
    cloneCanvas(oldCanvas)
    {

        //create a new canvas
        var newCanvas = document.createElement('canvas');
        var context = newCanvas.getContext('2d');

        //set dimensions
        newCanvas.width = oldCanvas.width;
        newCanvas.height = oldCanvas.height;
        //TODO style dims?
        newCanvas.id = oldCanvas.id;

        //apply the old canvas to the new one
        //context.drawImage(oldCanvas, 0, 0);

        //return the new canvas
        return newCanvas;
    }

    */

}