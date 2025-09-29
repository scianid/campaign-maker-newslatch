
export function ad300x250Template({
  title, 
  description, 
  image_url, 
  click_url, 
  cta = "Learn More"
} : {
  title: string,
  description: string,
  image_url: string,
  click_url: string,
  cta?: string
}): string {
  return `
<div style="margin:0;padding:0;">
  <a href="${click_url}" target="_blank" style="
     position:relative;
     display:block;
     width:300px;
     height:250px;
     overflow:hidden;
     border-radius:10px;
     box-shadow:0 4px 12px rgba(0,0,0,0.15);
     text-decoration:none;
     cursor:pointer;
     font-family:Arial,Helvetica,sans-serif;
   ">
    <img src="${image_url}" alt="${title}" style="
         position:absolute;
         top:0;
         left:0;
         width:100%;
         height:100%;
         object-fit:cover;
         transition:transform 0.8s ease;
       ">
    <div style="
        position:absolute;
        top:0;
        left:0;
        width:100%;
        height:100%;
        background:linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 60%);
      "></div>
    <div style="
        position:absolute;
        bottom:16px;
        left:16px;
        right:16px;
        display:flex;
        flex-direction:column;
        gap:8px;
        color:#fff;
      ">
      <div style="
          font-size:20px;
          font-weight:600;
          line-height:1.2em;
          max-height:2.4em;
          overflow:hidden;
          display:-webkit-box;
          -webkit-line-clamp:2;
          -webkit-box-orient:vertical;
        ">
        ${title}
      </div>

      <!-- Description -->
      <div style="
          font-size:14px;
          font-weight:400;
          line-height:1.3em;
          max-height:2.6em;
          overflow:hidden;
          display:-webkit-box;
          -webkit-line-clamp:2;
          -webkit-box-orient:vertical;
          opacity:0.9;
        ">
        ${description}
      </div>
      <div style="
          align-self:start;
          padding:8px 16px;
          background:linear-gradient(90deg, #00c6ff 0%, #7d2cff 100%);
          color:#fff;
          font-size:14px;
          font-weight:600;
          border-radius:6px;
          text-transform:uppercase;
          letter-spacing:0.5px;
        ">
        ${cta}
      </div>
    </div>
  </a>
</div>`
}

export function ad300by100Template({
  title, 
  description, 
  image_url, 
  click_url, 
  cta = "Learn More"
} : {
  title: string,
  description: string,
  image_url: string,
  click_url: string,
  cta?: string
}): string {
  return `
<div>
<a href="${click_url}" target="_blank"
   style="
     position:relative;
     display:block;
     width:300px;
     height:100px;
     overflow:hidden;
     border-radius:8px;
     box-shadow:0 3px 8px rgba(0,0,0,0.15);
     text-decoration:none;
     cursor:pointer;
     font-family:Arial,Helvetica,sans-serif;
   ">
  <img src="${image_url}"
       alt="Ad Background"
       style="
         position:absolute;
         top:0;
         left:0;
         width:100%;
         height:100%;
         object-fit:cover;
       ">
  <div style="
        position:absolute;
        top:0;
        left:0;
        width:100%;
        height:100%;
        background:linear-gradient(to right, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.2) 70%);
      "></div>
  <div style="
        position:absolute;
        top:12px;
        left:14px;
        right:14px;
        display:flex;
        flex-direction:column;
        gap:6px;
        color:#fff;
      ">
    <div style="
          font-size:16px;
          font-weight:600;
          line-height:1.2em;
          max-height:2.4em; /* ~2 lines */
          overflow:hidden;
          display:-webkit-box;
          -webkit-line-clamp:2;
          -webkit-box-orient:vertical;
        ">
      ${title}
    </div>
    <div style="
          font-size:12px;
          font-weight:400;
          line-height:1.2em;
          max-height:2.4em; /* ~2 lines */
          overflow:hidden;
          display:-webkit-box;
          -webkit-line-clamp:2;
          -webkit-box-orient:vertical;
          opacity:0.9;
        ">
      ${description}
    </div>
  </div>
  <div style="
        position:absolute;
        right:12px;
        bottom:12px;
        padding:6px 12px;
        background:linear-gradient(90deg, #00c6ff 0%, #7d2cff 100%);
        color:#fff;
        font-size:12px;
        font-weight:600;
        border-radius:4px;
        text-transform:uppercase;
        letter-spacing:0.5px;
      ">
    ${cta}
  </div>
</a>
</div>`
}