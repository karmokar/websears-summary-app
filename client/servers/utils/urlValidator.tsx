export default  function isValidURL(string:string):boolean{
    try {
        new URL(string);
        return true;
    } catch (error:any) {
        const domainPattren=/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return domainPattren.test(string);
    }
}
