// import * as vec2 from '../utils/gl-matrix/vec2.js'
// import * as vec3 from '../utils/gl-matrix/vec3.js'
import MapView from './MapView.js'
import RaycasterView from './RaycasterView.js'
import SilvermanView from './SilvermanView.js'

export default class RootView
{
    //sub-views
    map
    raycaster
    silverman
    
    constructor(core, raycaster, silverman, map)
    {
        this.core = core;
        
        this.raycaster = raycaster// new RaycasterView(core);
        this.silverman = silverman// new SilvermanView(core);
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
        
        
        //this.raycaster.update();
        this.silverman.update();
        
        //window.requestAnimationFrame(e => this.update(e), 0);
        window.requestAnimationFrame(this.update.bind(this), 0);
    }
    
    OnResizeWindow(e)
    {
        //this.renderer.setSize(window.innerWidth, window.innerHeight);
        //this.camera.perspective({aspect: this.gl.canvas.width / this.gl.canvas.height});
        
        //TODO process all subviews generically from array
        //this.raycaster.OnResizeWindow(e);
        this.silverman.OnResizeWindow(e);
        
        this.update(); //gets the update loop rolling.
    }
}