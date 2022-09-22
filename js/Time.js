export default class Time
{
    last = 0
    current = 0
    delta = 0
    
    constructor()
    {
        this.last = this.current = new Date().getTime();
    }
    
    updateDelta()
    {
        this.last = this.current;
        this.current = new Date().getTime();
        this.delta = this.current - this.last;
    }
}