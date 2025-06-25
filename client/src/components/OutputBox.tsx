import React from 'react';
interface ScrapeResult{
    url:string;
    title:string;
    description:string;
}
interface props{
    data:ScrapeResult[];
}
const OutputBox:React.FC<props>=({data})=>{
    return(
        <div className='Output_box'>
            {data.map((item,index)=>(
              <div key={index} className='output_item'>
                <h4>{item.title}</h4>
                <p>{item.description}</p>
                <a href={item.url} target='_blank' rel='noopener noreferrer'>{item.url}</a>
              </div>
            ))}
        </div>
    )
}

export default OutputBox;