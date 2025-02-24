export default class Camera
{
    x = 537//457//512., // x position on the map
    y = 162//800., // y position on the map
    height  =  150. // height of the camera
    heading =   -3.14 // direction of the camera
    horizonFrac = 0.5 //280., // horizon position (look up and down)
    zNear =   10.   // near clip plane distance
    zFar  = 5000.   // far  clip plane distance
    //NOTE! There is also a near projection plane distance! (possibly implicit)
    yk = 0.866//0.7071, //45deg
    hFov = 1.57079633
    nearWidth = 1.
    columnscale = 2.
    perspective = true
    rayStepAccl = 0.005
    //optional, could be pulled from offscreen canvas instead.
    screenwidth = 0
    screenheight = 0
    
    pitch = 0.0
    
    setvFov(value)
    {
        this.yk = value;
        console.log(value, Math.asin(camera.yk) * 180 / Math.PI);
    }
    
}