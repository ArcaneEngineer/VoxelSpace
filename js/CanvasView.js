//export default 
class CanvasView
{
    core = undefined
    
    canvas = undefined //grab from DOM, typically
    context   = undefined
    imagedata = undefined
    
    xRes = 0
    yRes = 0
    
    constructor(core)
    {
        this.core = core;
    }
    
    changeScale(element, scaleElement, scaleStyle) //abstract
    {
        let xRes = this.xRes;
        let yRes = this.yRes;
        
         //raster unscaled
        this.changeElementDimensions(element, scaleElement, xRes, yRes);
        this.changeStyleDimensions  (element.style, scaleStyle, xRes, yRes);
    }
    
    changeElementDimensions(element, scale, width, height)
    {
        element.setAttribute("width",  width  * scale);
        element.setAttribute("height", height * scale);
    }
    
    changeStyleDimensions(style, scale, width, height)
    {
        style.width  = (width  * scale) + "px";
        style.height = (height * scale) + "px";
    }
}