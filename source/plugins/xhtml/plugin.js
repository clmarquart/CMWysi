(function($) {
  wysiwyg.onsubmit[wysiwyg.onsubmit.length]=makeXhtml;

  function makeXhtml(){
    var eds = wysiwyg.editors;
    for(var ed in eds){
     if((eds.hasOwnProperty(ed))&&(ed!=="length")){
       var html = eds[ed].wysiDoc.body.innerHTML;
       html = html.replace(/\<br\>/g,"<br/>");
       eds[ed].wysiDoc.body.innerHTML = html;
       eds[ed].element.innerHTML = html;
     }
    }
  }
})(jQuery);