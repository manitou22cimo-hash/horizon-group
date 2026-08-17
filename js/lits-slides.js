(function(){
function boot(){
  var S=window.HG_LITS_SLIDES||[];
  if(!S.length) return;
  document.querySelectorAll(".ad-square").forEach(function(box){
    var v=box.querySelector("video");
    var h=document.createElement("div");
    h.style.cssText="position:absolute;inset:0;overflow:hidden;background:#0b1a28";
    var img=document.createElement("img");
    img.alt="Lits prets Horizon Group";
    img.style.cssText="width:100%;height:100%;object-fit:cover;display:block;transition:opacity .5s";
    h.appendChild(img);
    if(v) v.replaceWith(h); else { box.style.position="relative"; box.appendChild(h); }
    var i=0;
    function show(){
      img.style.opacity="0";
      setTimeout(function(){ img.src="data:image/jpeg;base64,"+S[i%S.length]; img.style.opacity="1"; i++; },250);
    }
    show();
    setInterval(show,3500);
  });
  document.querySelectorAll(".ad-badge").forEach(function(b){ b.textContent="Lits prets · diaporama"; });
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot);
else boot();
})();
