// import * as vec2 from '../utils/gl-matrix/vec2.js'
// import * as vec3 from '../utils/gl-matrix/vec3.js'
import MapView from './MapView.js'
import RaycasterView from './RaycasterView.js'

export default class GameView
{
    core = undefined //remove if extends another view class!
    
    //sub-views
    map
    raycaster
    raycasterWorker = undefined
    
    time
    io
    
    constructor(core, raycaster, map, time, io)
    {
        this.core = core;
        
        //sub-views
        this.raycaster = raycaster//
        this.map = map
        this.time = time
        this.io = io
        
        this.raycasterWorker = new Worker('./js/RaycasterWorker.js');
        
        this.initUI();
    }
    
    initUI()
    {
        //window.addEventListener("resize", this.resize.bind(this), false);
        //this.resize();
        //let core = this.core;
    }
    
    update()//timeSec, deltaSec)
    {
        let core = this.core;
        //console.log("?")
        
        this.time.updateDelta();
        this.io.UpdateCamera();
        
        //TODO process subviews as list?
        this.map.update();
        
        this.raycaster.update(core.camera, core.map, core.screenwidth, core.screenheight, core.renderNovalogic);
        
        //this.raycasterWorker.postMessage(core);
        
        //window.requestAnimationFrame(e => this.update(e), 0);
        window.requestAnimationFrame(this.update.bind(this), 0);
    }
    
    OnResizeWindow(e)
    {
        //this.renderer.setSize(window.innerWidth, window.innerHeight);
        //this.camera.perspective({aspect: this.gl.canvas.width / this.gl.canvas.height});
        
        let core = this.core;
        core.screenwidth = window.innerWidth;
        core.screenheight = window.innerHeight;
        
        const canvas = document.getElementById("firstperson");
        const offscreenCanvas = canvas.transferControlToOffscreen();
        console.log(canvas);
        console.log(offscreenCanvas);
        //TODO process all subviews generically from array
        this.raycaster.OnResizeWindow(offscreenCanvas, core.screenwidth, core.screenheight);
        
        this.update(); //gets the update loop rolling.
    }
}