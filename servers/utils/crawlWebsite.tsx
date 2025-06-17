import scrapePage from "./scrappePage";

export default async function crawlWebsite(url:string,maxDepth:number=1) {
    const visited=new Set<string>();
    type QueueItem={
        url:string;
        depth:number;
    }
    const queue:QueueItem[]=[{url,depth:0}];
    const result:any[]=[];
    while (queue.length>0) {
        const{url:currentUrl,depth}=queue.shift()!;
        if (visited.has(currentUrl)||depth>maxDepth) continue;
        visited.add(currentUrl);

        try {
            const {title,description,links}=await scrapePage(currentUrl);
            result.push({url:currentUrl,title,description});

            links.forEach((links)=>{
                if (!visited.has(links)) {
                    queue.push({url:links,depth:depth+1})
                }
            })
        } catch (error:any) {
            console.log(`Error crawling ${currentUrl}`,error.message);
        }
    }
    return result;
}