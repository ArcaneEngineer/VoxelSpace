export default class Camera
{
    x = 457//512., // x position on the map
    y = 134//800., // y position on the map
    height  =  70. // height of the camera
    heading =   0//-1.570796327, // direction of the camera
    horizon = 400 //280., // horizon position (look up and down)
    zNear =   200.   // near clip plane distance
    zFar  = 900.   // far  clip plane distance
    //NOTE! There is also a near projection plane distance! (possibly implicit)
    yk = 0.866//0.7071, //45deg
    hFov = 1.57079633
    nearWidth = 1.
    columnscale = 1.
    perspective = true
    rayStepAccl = 0.01
    
    setvFov(value)
    {
        this.yk = value;
        console.log(value, Math.asin(camera.yk) * 180 / Math.PI);
    }
    
}