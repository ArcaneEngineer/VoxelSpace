// import * as vec2 from '../utils/gl-matrix/vec2.js'
// import * as vec3 from '../utils/gl-matrix/vec3.js'
import MapView from './MapView.js'
import RaycasterView from './RaycasterView.js'

export default class RootView
{
    //sub-views
    map
    raycaster
    
    constructor(core, raycaster, map)
    {
        this.core = core;
        
        this.raycaster = raycaster// new RaycasterView(core);
        this.map = map
        
        this.initUI();
    }
    
    initUI()
    {
        //window.addEventListener("resize", this.resize.bind(this), false);
        //this.resize();
        let core = this.core;
    }
    
    update()//timeSec, deltaSec)
    {
        let core = this.core;
        //console.log("?")
        //TODO as list?
        this.map.update();
        this.raycaster.update();
        
        //window.requestAnimationFrame(e => this.update(e), 0);
        window.requestAnimationFrame(this.update.bind(this), 0);
    }
    
    OnResizeWindow(e)
    {
        //this.renderer.setSize(window.innerWidth, window.innerHeight);
        //this.camera.perspective({aspect: this.gl.canvas.width / this.gl.canvas.height});
        
        //TODO process all subviews generically from array
        this.raycaster.OnResizeWindow(e);
        
        this.update(); //gets the update loop rolling.
    }
}